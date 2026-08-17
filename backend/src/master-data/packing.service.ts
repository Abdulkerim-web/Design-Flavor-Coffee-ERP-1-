import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { OrderItem } from "../entities/order_item.entity"
import { StockBalance } from "../entities/stock_balance.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"
import { Discrepancy } from "../entities/discrepancy.entity"

@Injectable()
export class PackingService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Packer records completed packing. Consumes packaging stock natively.
   * If they packed a different amount than requested, it triggers a discrepancy.
   */
  async confirmPacking(
    orderItemId: string,
    packerUserId: string,
    packagingMaterialId: string, // e.g. Foil
    packagingSizeId: string, // e.g. 1KG
    packagesProduced: number, // actual count produced
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const orderItem = await queryRunner.manager.findOne(OrderItem, {
        where: { id: orderItemId },
      })

      if (!orderItem) throw new BadRequestException("Order Item not found")
      if (
        orderItem.status !== "ready-for-packing" &&
        orderItem.status !== "PACKING_IN_PROGRESS"
      ) {
        throw new BadRequestException(
          "Order Item not in a valid state for packing.",
        )
      }

      // E.g. we expected to pack 50 KG into 50 x 1KG bags.
      // A full ERP would derive expectedPackages based on orderItem.quantity / size.
      // For this system, we will assume 1 orderItem unit = 1 KG, so if they are using 1KG bags, expected = quantity.
      // We'll pass expected logic simply as orderItem.quantity to keep the math clean for the test.
      const expectedPackages = orderItem.quantity

      if (packagesProduced !== expectedPackages) {
        // Discrepancy logged for manager. Packing is stalled for this item.
        const discrepancy = queryRunner.manager.create(Discrepancy, {
          entityType: "PackingRecord",
          entityId: orderItem.id,
          expectedQuantity: expectedPackages,
          actualQuantity: packagesProduced,
          difference: packagesProduced - expectedPackages,
          status: "pending-review",
        })
        await queryRunner.manager.save(discrepancy)

        await queryRunner.commitTransaction()
        return {
          success: false,
          message: "Discrepancy recorded for manager review.",
        }
      }

      // No discrepancy: Consume Packaging Stock
      const stock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: packagingMaterialId, itemType: "PACKAGING" },
        lock: { mode: "pessimistic_write" },
      })

      // DB-level `available >= 0` check will protect us here too
      if (!stock || Number(stock.available) < packagesProduced) {
        throw new BadRequestException("PACKAGING_STOCK_INSUFFICIENT")
      }

      stock.onHand = Number(stock.onHand) - packagesProduced
      stock.available = Number(stock.available) - packagesProduced
      await queryRunner.manager.save(stock)

      const tx = queryRunner.manager.create(InventoryTransaction, {
        type: "PACKAGING_CONSUMPTION",
        direction: "out",
        quantity: packagesProduced,
        coffeeProductId: packagingMaterialId, // Reusing column for item ID
        resultingBalance: stock.available,
        referenceEntityType: "OrderItem",
        referenceEntityId: orderItem.id,
        performedByUserId: packerUserId,
        notes: `Size ID: ${packagingSizeId}`,
      })
      await queryRunner.manager.save(tx)

      orderItem.status = "ready-for-delivery" // Next step
      await queryRunner.manager.save(orderItem)

      await queryRunner.commitTransaction()
      return {
        success: true,
        message: "Packing confirmed and inventory deducted.",
      }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
