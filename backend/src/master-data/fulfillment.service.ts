import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { OrderItem } from "../entities/order_item.entity"
import { StockBalance } from "../entities/stock_balance.entity"
import { DeliveryRecord } from "../entities/delivery_record.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"

@Injectable()
export class FulfillmentService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Partially allocates an OrderItem from Ready Roasted stock (e.g. Urgent Order)
   * It creates a DeliveryRecord for the allocated amount.
   */
  async allocatePartialFulfillment(
    orderItemId: string,
    allocateQuantity: number,
    managerUserId: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const orderItem = await queryRunner.manager.findOne(OrderItem, {
        where: { id: orderItemId },
        relations: ["order"],
      })

      if (!orderItem) throw new BadRequestException("Order Item not found")
      if (allocateQuantity > orderItem.quantity) {
        throw new BadRequestException(
          "Cannot allocate more than requested in order item.",
        )
      }

      // Check Available Roasted Stock
      const stock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: orderItem.coffeeProductId, itemType: "ROASTED" },
        lock: { mode: "pessimistic_write" },
      })

      if (!stock || Number(stock.available) < allocateQuantity) {
        throw new BadRequestException("STOCK_INSUFFICIENT")
      }

      // 1. Reserve the roasted stock
      stock.reserved = Number(stock.reserved) + allocateQuantity
      stock.available = Number(stock.onHand) - stock.reserved
      await queryRunner.manager.save(stock)

      const tx = queryRunner.manager.create(InventoryTransaction, {
        type: "RESERVATION",
        direction: "reserve",
        quantity: allocateQuantity,
        coffeeProductId: orderItem.coffeeProductId,
        resultingBalance: stock.available,
        referenceEntityType: "DeliveryRecord", // Tied to delivery record creation
        referenceEntityId: "pending", // Will update below
        performedByUserId: managerUserId,
      })
      const savedTx = await queryRunner.manager.save(tx)

      // 2. Create Delivery Record in READY_FOR_ASSIGNMENT
      const delivery = queryRunner.manager.create(DeliveryRecord, {
        orderId: orderItem.orderId,
        customerId: orderItem.order.customerId,
        status: "READY_FOR_ASSIGNMENT",
      })
      await queryRunner.manager.save(delivery)

      // Back-update transaction reference
      savedTx.referenceEntityId = delivery.id
      await queryRunner.manager.save(savedTx)

      // 3. The remaining quantity is automatically calculated dynamically in UI/Reports via OrderItem.quantity - sum(DeliveryRecords.qty)
      // Or we can literally split the OrderItem into two OrderItems (one reserved, one pending).
      // Splitting OrderItems is safer for preserving Prompt 06's 1:N tracking per item.
      if (allocateQuantity < orderItem.quantity) {
        const remainingQty = orderItem.quantity - allocateQuantity

        // Update original to match allocation
        orderItem.quantity = allocateQuantity
        orderItem.status = "ready-for-packing" // Next step
        await queryRunner.manager.save(orderItem)

        // Create new item for remainder
        const newRemainderItem = queryRunner.manager.create(OrderItem, {
          orderId: orderItem.orderId,
          coffeeProductId: orderItem.coffeeProductId,
          quantity: remainingQty,
          unitPrice: orderItem.unitPrice,
          status: "pending-confirmation",
        })
        await queryRunner.manager.save(newRemainderItem)
      } else {
        orderItem.status = "ready-for-packing"
        await queryRunner.manager.save(orderItem)
      }

      // Note: orderItem.order.urgentDeadlineAt would already be set per Prompt 07 during creation.

      await queryRunner.commitTransaction()
      return delivery
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
