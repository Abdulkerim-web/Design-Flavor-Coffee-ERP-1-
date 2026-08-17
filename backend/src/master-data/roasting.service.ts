import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RoastingBatch } from '../entities/roasting_batch.entity';
import { StockBalance } from '../entities/stock_balance.entity';
import { InventoryTransaction } from '../entities/inventory_transaction.entity';
import { Discrepancy } from '../entities/discrepancy.entity';
import { Lot } from '../entities/lot.entity';

@Injectable()
export class RoastingService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Completes a batch. Consumes green input, produces output (or fails), and calculates weighted average cost.
   */
  async completeBatch(
    batchId: string,
    roasterUserId: string,
    actualRoastedQuantity: number,
    isFailed: boolean = false
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(RoastingBatch, {
        where: { id: batchId },
        relations: ['orderItem'],
      });

      if (!batch) throw new BadRequestException('Batch not found');
      if (batch.status !== 'in-progress') {
        throw new BadRequestException('Only IN_PROGRESS batches can be completed or failed.');
      }

      batch.actualRoastedQuantity = actualRoastedQuantity;
      batch.status = isFailed ? 'failed' : 'completed';
      batch.roasterUserId = roasterUserId;

      // Consume Green Stock (even if failed)
      // For Prompt 08: We don't select a lot, we consume from aggregate available and recalculate cost
      const greenStock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: batch.orderItem.coffeeProductId, itemType: 'GREEN' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!greenStock || Number(greenStock.available) < Number(batch.greenInputQuantity)) {
        throw new BadRequestException('STOCK_INSUFFICIENT');
      }

      greenStock.onHand = Number(greenStock.onHand) - Number(batch.greenInputQuantity);
      greenStock.available = Number(greenStock.available) - Number(batch.greenInputQuantity);
      
      await queryRunner.manager.save(greenStock);

      const transaction = queryRunner.manager.create(InventoryTransaction, {
        type: 'CONSUMPTION',
        direction: 'out',
        quantity: batch.greenInputQuantity,
        coffeeProductId: batch.orderItem.coffeeProductId,
        resultingBalance: greenStock.available,
        referenceEntityType: 'RoastingBatch',
        referenceEntityId: batch.id,
        performedByUserId: roasterUserId,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.manager.save(batch);
      await queryRunner.commitTransaction();
      return batch;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Green Return workflow (Two-step confirmation)
   * Roaster initiates return, Storekeeper confirms.
   */
  async confirmGreenReturn(
    batchId: string,
    roasterDeclaredReturnQty: number,
    storekeeperConfirmedQty: number,
    storekeeperUserId: string
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = await queryRunner.manager.findOne(RoastingBatch, {
        where: { id: batchId },
        relations: ['orderItem'],
      });

      if (!batch) throw new BadRequestException('Batch not found');

      // If mismatch, create a Discrepancy record and do NOT return inventory yet
      if (roasterDeclaredReturnQty !== storekeeperConfirmedQty) {
        const discrepancy = queryRunner.manager.create(Discrepancy, {
          entityType: 'GreenReturn',
          entityId: batchId,
          expectedQuantity: roasterDeclaredReturnQty,
          actualQuantity: storekeeperConfirmedQty,
          difference: storekeeperConfirmedQty - roasterDeclaredReturnQty,
          status: 'pending-review',
        });
        await queryRunner.manager.save(discrepancy);
        
        await queryRunner.commitTransaction();
        return { success: false, message: 'Discrepancy logged for manager review.', discrepancy };
      }

      // If match, return to inventory
      const greenStock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: batch.orderItem.coffeeProductId, itemType: 'GREEN' },
        lock: { mode: 'pessimistic_write' },
      });

      if (greenStock) {
        greenStock.onHand = Number(greenStock.onHand) + storekeeperConfirmedQty;
        greenStock.available = Number(greenStock.available) + storekeeperConfirmedQty;
        await queryRunner.manager.save(greenStock);

        const transaction = queryRunner.manager.create(InventoryTransaction, {
          type: 'RETURN',
          direction: 'in',
          quantity: storekeeperConfirmedQty,
          coffeeProductId: batch.orderItem.coffeeProductId,
          resultingBalance: greenStock.available,
          referenceEntityType: 'RoastingBatch',
          referenceEntityId: batch.id,
          performedByUserId: storekeeperUserId,
        });
        await queryRunner.manager.save(transaction);
      }

      await queryRunner.commitTransaction();
      return { success: true, message: 'Return confirmed and inventory updated.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
