import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { Discrepancy } from "../entities/discrepancy.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"
import { StockBalance } from "../entities/stock_balance.entity"
import { RoastingBatch } from "../entities/roasting_batch.entity"

@Injectable()
export class DiscrepancyService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Manager adjudicates a discrepancy. Only the final accepted figure posts to inventory.
   */
  async resolveDiscrepancy(
    discrepancyId: string,
    managerUserId: string,
    resolutionType: "ACCEPT_EXPECTED" | "ACCEPT_ACTUAL" | "CUSTOM_OVERRIDE",
    customQuantity?: number,
    resolutionNote?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const discrepancy = await queryRunner.manager.findOne(Discrepancy, {
        where: { id: discrepancyId },
      })

      if (!discrepancy) throw new BadRequestException("Discrepancy not found")
      if (discrepancy.status === "resolved") {
        throw new BadRequestException("Discrepancy is already resolved.")
      }

      let finalQty = 0
      if (resolutionType === "ACCEPT_EXPECTED") {
        finalQty = discrepancy.expectedQuantity
      } else if (resolutionType === "ACCEPT_ACTUAL") {
        finalQty = discrepancy.actualQuantity
      } else {
        if (customQuantity === undefined)
          throw new BadRequestException("Custom quantity required")
        if (!resolutionNote)
          throw new BadRequestException(
            "Resolution note required for custom override",
          )
        finalQty = customQuantity
      }

      discrepancy.finalAdjudicatedQuantity = finalQty
      discrepancy.status = "resolved"
      discrepancy.resolvedByUserId = managerUserId
      discrepancy.resolutionNote = resolutionNote || null

      await queryRunner.manager.save(discrepancy)

      // If this was a Roasting Yield discrepancy, we now post the ROASTED inventory!
      if (discrepancy.entityType === "RoastingYield") {
        const batch = await queryRunner.manager.findOne(RoastingBatch, {
          where: { id: discrepancy.entityId },
          relations: ["orderItem"],
        })
        if (batch) {
          let stock = await queryRunner.manager.findOne(StockBalance, {
            where: {
              itemId: batch.orderItem.coffeeProductId,
              itemType: "ROASTED",
            },
            lock: { mode: "pessimistic_write" },
          })

          if (!stock) {
            stock = queryRunner.manager.create(StockBalance, {
              itemId: batch.orderItem.coffeeProductId,
              itemType: "ROASTED",
              onHand: 0,
              reserved: 0,
              available: 0,
            })
          }

          stock.onHand = Number(stock.onHand) + Number(finalQty)
          stock.available = Number(stock.available) + Number(finalQty)
          await queryRunner.manager.save(stock)

          const transaction = queryRunner.manager.create(InventoryTransaction, {
            type: "ROASTING_YIELD",
            direction: "in",
            quantity: finalQty,
            coffeeProductId: batch.orderItem.coffeeProductId,
            resultingBalance: stock.available,
            referenceEntityType: "Discrepancy",
            referenceEntityId: discrepancy.id,
            performedByUserId: managerUserId,
            notes: `Adjudicated yield.`,
          })
          await queryRunner.manager.save(transaction)
        }
      }

      await queryRunner.commitTransaction()
      return discrepancy
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Idempotent endpoint simulation for Storekeeper confirming yield.
   * If they click "Confirm" twice quickly, it must not double-create stock.
   */
  async confirmRoastedYield(
    batchId: string,
    storekeeperUserId: string,
    storekeeperActualQty: number,
    idempotencyKey: string, // Crucial for duplicate prevention
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Check if batch already has a receipt transaction (DB unique constraint analog)
      const existingTx = await queryRunner.manager.findOne(
        InventoryTransaction,
        {
          where: {
            referenceEntityType: "RoastingBatch",
            referenceEntityId: batchId,
          },
        },
      )

      if (existingTx) {
        // Idempotent return: just return success if already processed
        await queryRunner.rollbackTransaction()
        return {
          success: true,
          message: "Already confirmed",
          transaction: existingTx,
        }
      }

      const batch = await queryRunner.manager.findOne(RoastingBatch, {
        where: { id: batchId },
        relations: ["orderItem"],
      })

      if (!batch) throw new BadRequestException("Batch not found")
      if (batch.status !== "completed")
        throw new BadRequestException("Batch is not completed")

      // Check mismatch (0.001 logic)
      if (
        Number(storekeeperActualQty) !== Number(batch.expectedRoastedQuantity)
      ) {
        // Discrepancy!
        const discrepancy = queryRunner.manager.create(Discrepancy, {
          entityType: "RoastingYield",
          entityId: batchId,
          expectedQuantity: batch.expectedRoastedQuantity,
          actualQuantity: storekeeperActualQty,
          difference: storekeeperActualQty - batch.expectedRoastedQuantity,
          status: "pending-review",
        })
        await queryRunner.manager.save(discrepancy)
        await queryRunner.commitTransaction()
        return {
          success: false,
          message: "Discrepancy recorded for manager review.",
        }
      }

      // Exact match - add to inventory
      let stock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: batch.orderItem.coffeeProductId, itemType: "ROASTED" },
        lock: { mode: "pessimistic_write" },
      })

      if (!stock) {
        stock = queryRunner.manager.create(StockBalance, {
          itemId: batch.orderItem.coffeeProductId,
          itemType: "ROASTED",
          onHand: 0,
          reserved: 0,
          available: 0,
        })
      }

      stock.onHand = Number(stock.onHand) + storekeeperActualQty
      stock.available = Number(stock.available) + storekeeperActualQty
      await queryRunner.manager.save(stock)

      const transaction = queryRunner.manager.create(InventoryTransaction, {
        type: "ROASTING_YIELD",
        direction: "in",
        quantity: storekeeperActualQty,
        coffeeProductId: batch.orderItem.coffeeProductId,
        resultingBalance: stock.available,
        referenceEntityType: "RoastingBatch",
        referenceEntityId: batch.id,
        performedByUserId: storekeeperUserId,
        notes: `IdempotencyKey: ${idempotencyKey}`, // Real system uses a dedicated idempotency table
      })
      await queryRunner.manager.save(transaction)

      await queryRunner.commitTransaction()
      return { success: true, transaction }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
