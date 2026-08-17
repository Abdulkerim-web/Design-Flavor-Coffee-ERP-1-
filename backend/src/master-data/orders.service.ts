import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common"
import { DataSource } from "typeorm"
import { Order } from "../entities/order.entity"
import { OrderItem } from "../entities/order_item.entity"
import { Reservation } from "../entities/reservation.entity"
import { FeasibilityEngineService } from "./feasibility.service"

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly feasibilityService: FeasibilityEngineService,
  ) {}

  /**
   * Sales rep edits a pending order. Resets status if it was pending manager confirmation.
   */
  async editPendingOrder(
    orderId: string,
    userId: string,
    updates: { quantity?: number, branchId?: string },
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ["items"],
      })

      if (!order) throw new BadRequestException("Order not found")

      if (
        order.status !== "draft" &&
        order.status !== "PENDING_MANAGER_CONFIRMATION"
      ) {
        throw new BadRequestException(
          "Cannot edit order once it has been confirmed or moved past pending.",
        )
      }

      // If branch changed
      if (updates.branchId) {
        order.branchId = updates.branchId
      }

      // If quantity changed on the first item (simplification for UI single-item UI, though we support multi-item)
      if (updates.quantity && order.items.length > 0) {
        order.items[0].quantity = updates.quantity
        await queryRunner.manager.save(order.items[0])
      }

      // Reset to pending if draft, or leave as pending
      order.status = "PENDING_MANAGER_CONFIRMATION"
      await queryRunner.manager.save(order)

      // Audit Log goes here...

      await queryRunner.commitTransaction()
      return order
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Cancel an order. Releases reservations if pre-roasting. Blocks if post-roasting.
   */
  async cancelOrder(orderId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ["items"],
      })

      if (!order) throw new BadRequestException("Order not found")

      // Check invariant: cannot cancel if post-roasting (e.g. ROASTING_IN_PROGRESS or beyond)
      const postRoastingStatuses = [
        "roasting-in-progress",
        "ROASTING_COMPLETE_PENDING_RECEIPT",
        "ready-for-packing",
        "PACKING_IN_PROGRESS",
        "ready-for-delivery",
        "DELIVERED_PENDING_VERIFICATION",
        "completed",
      ]

      if (postRoastingStatuses.includes(order.status)) {
        throw new ConflictException(
          "Cannot cancel order after roasting has started. Production history must be preserved.",
        )
      }

      // Release any active reservations atomically
      for (const item of order.items) {
        const reservations = await queryRunner.manager.find(Reservation, {
          where: { orderItemId: item.id, status: "active" },
        })

        for (const res of reservations) {
          res.status = "released"
          await queryRunner.manager.save(res)

          // We also need to restore stock balance here using the ledger
          // (Calling FeasibilityService to release stock would happen here in a full integration)
        }

        item.status = "cancelled"
        await queryRunner.manager.save(item)
      }

      order.status = "cancelled"
      await queryRunner.manager.save(order)

      await queryRunner.commitTransaction()
      return order
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
