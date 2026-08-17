import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common"
import { DataSource } from "typeorm"
import { DeliveryRecord } from "../entities/delivery_record.entity"
import { Order } from "../entities/order.entity"
import { OrderItem } from "../entities/order_item.entity"

@Injectable()
export class DeliveryService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Only a Manager can verify a delivery (Anti-Fraud).
   * Verifying sets the 7-day payment clock if it is the first delivery verified.
   */
  async verifyDelivery(
    deliveryId: string,
    managerUserId: string,
    userRole: string, // e.g. 'MANAGER' or 'GM'
  ) {
    if (userRole !== "MANAGER" && userRole !== "GM") {
      throw new ForbiddenException(
        "Only a manager can verify customer acceptance.",
      )
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const delivery = await queryRunner.manager.findOne(DeliveryRecord, {
        where: { id: deliveryId },
        relations: ["order"],
      })

      if (!delivery) throw new BadRequestException("Delivery not found")
      if (
        delivery.status !== "pending-customer-confirmation" &&
        delivery.status !== "delivered-proof-submitted"
      ) {
        throw new BadRequestException("Delivery not in a verifiable state.")
      }

      delivery.status = "verified"
      delivery.verifiedByManagerId = managerUserId
      await queryRunner.manager.save(delivery)

      // Check 7-day clock setup
      if (!delivery.order.paymentDeadlineAt) {
        // Set to 7 days from now
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + 7)
        delivery.order.paymentDeadlineAt = deadline
        await queryRunner.manager.save(delivery.order)
      }

      // Check if ALL deliveries for this order are now verified?
      // For this simplified version, we just mark the order status if we assume it's fully verified.
      // But typically, we'd query all OrderItems and sum verified delivery quantities.

      await queryRunner.commitTransaction()
      return delivery
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Example placeholder for uploading a file (Multer integration happens in Controller)
   */
  async uploadProof(deliveryId: string, filePath: string) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const delivery = await queryRunner.manager.findOne(DeliveryRecord, {
        where: { id: deliveryId },
      })
      if (delivery) {
        delivery.proofDocumentPath = filePath
        delivery.status = "delivered-proof-submitted"
        await queryRunner.manager.save(delivery)
      }
    } finally {
      await queryRunner.release()
    }
  }
}
