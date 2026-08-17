import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { ReceivingRecord } from "../entities/receiving_record.entity"
import { Lot } from "../entities/lot.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"
import { StockBalance } from "../entities/stock_balance.entity"
import { AuditLog } from "../entities/audit_log.entity"

@Injectable()
export class ReceivingService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Initializes a receiving record (Storekeeper action)
   */
  async receiveShipment(data: {
    supplierId: string
    coffeeProductId: string
    storekeeperUserId: string
    receivedQuantity: number
  }): Promise<ReceivingRecord> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const record = queryRunner.manager.create(ReceivingRecord, {
        supplierId: data.supplierId,
        coffeeProductId: data.coffeeProductId,
        storekeeperUserId: data.storekeeperUserId,
        receivedQuantity: data.receivedQuantity,
        status: "received",
      })
      await queryRunner.manager.save(record)

      await queryRunner.manager.save(
        queryRunner.manager.create(AuditLog, {
          userId: data.storekeeperUserId,
          action: "CREATE",
          entityType: "ReceivingRecord",
          entityId: record.id,
          changes: { new: record },
        }),
      )

      await queryRunner.commitTransaction()
      return record
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * QC Inspection (Inspector action)
   */
  async performQC(
    recordId: string,
    inspectorUserId: string,
    acceptedQuantity: number,
    rejectedQuantity: number,
    qcNotes?: string,
  ): Promise<ReceivingRecord> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const record = await queryRunner.manager.findOne(ReceivingRecord, {
        where: { id: recordId },
      })
      if (!record) throw new BadRequestException("Record not found")
      if (record.status !== "received" && record.status !== "qc-pending") {
        throw new BadRequestException(
          `Cannot perform QC in status ${record.status}`,
        )
      }

      const total = acceptedQuantity + rejectedQuantity
      if (total !== Number(record.receivedQuantity)) {
        throw new BadRequestException(
          "Accepted and Rejected quantities must equal total received",
        )
      }

      record.inspectorUserId = inspectorUserId
      record.acceptedQuantity = acceptedQuantity
      record.rejectedQuantity = rejectedQuantity
      record.qcNotes = qcNotes || null
      record.status = "pending-manager-approval"

      await queryRunner.manager.save(record)

      await queryRunner.commitTransaction()
      return record
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Manager Approval (Manager action).
   * Atomically creates Lot and adds Inventory if acceptedQuantity > 0.
   */
  async approveShipment(
    recordId: string,
    managerUserId: string,
    unitCostEtb: number,
    isApproved: boolean,
  ): Promise<ReceivingRecord> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const record = await queryRunner.manager.findOne(ReceivingRecord, {
        where: { id: recordId },
        relations: ["coffeeProduct"],
      })

      if (!record) throw new BadRequestException("Record not found")
      if (record.status !== "pending-manager-approval") {
        throw new BadRequestException(
          `Cannot approve in status ${record.status}`,
        )
      }

      if (!isApproved) {
        record.status = "rejected"
        record.managerUserId = managerUserId
        await queryRunner.manager.save(record)
        await queryRunner.commitTransaction()
        return record
      }

      record.status = "approved"
      record.managerUserId = managerUserId
      await queryRunner.manager.save(record)

      // Only produce inventory and Lot if there's accepted quantity > 0
      if (record.acceptedQuantity > 0) {
        // Generate LOT ID
        const origin = record.coffeeProduct.originId
          .substring(0, 3)
          .toUpperCase()
        const year = new Date().getFullYear()
        // In a real system, you'd query the max sequence or use a sequence generator
        const seq = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(4, "0")
        const lotId = `LOT-${origin}-${year}-${seq}`

        const lot = queryRunner.manager.create(Lot, {
          id: lotId,
          coffeeProductId: record.coffeeProductId,
          receivingRecordId: record.id,
          initialQuantity: record.acceptedQuantity,
          unitCostEtb,
          totalCostEtb: Number(
            (record.acceptedQuantity * unitCostEtb).toFixed(2),
          ),
        })
        await queryRunner.manager.save(lot)

        // Fetch or create stock balance for GREEN coffee with Pessimistic lock
        let stock = await queryRunner.manager.findOne(StockBalance, {
          where: { itemId: record.coffeeProductId, itemType: "GREEN" },
          lock: { mode: "pessimistic_write" },
        })

        if (!stock) {
          stock = queryRunner.manager.create(StockBalance, {
            itemId: record.coffeeProductId,
            itemType: "GREEN",
            onHand: 0,
            reserved: 0,
            available: 0,
          })
        }

        stock.onHand = Number(stock.onHand) + Number(record.acceptedQuantity)
        stock.available =
          Number(stock.available) + Number(record.acceptedQuantity)
        await queryRunner.manager.save(stock)

        // Record Inventory Transaction
        const transaction = queryRunner.manager.create(InventoryTransaction, {
          type: "RECEIPT",
          direction: "in",
          quantity: record.acceptedQuantity,
          coffeeProductId: record.coffeeProductId,
          resultingBalance: stock.available,
          referenceEntityType: "ReceivingRecord",
          referenceEntityId: record.id,
          performedByUserId: managerUserId, // The manager action triggered the stock add
          approvedByUserId: managerUserId,
          notes: `Lot generated: ${lotId}`,
        })
        await queryRunner.manager.save(transaction)
      }

      await queryRunner.commitTransaction()
      return record
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
