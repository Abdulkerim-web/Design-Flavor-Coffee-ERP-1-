import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { StockBalance } from "../entities/stock_balance.entity"
import { Reservation } from "../entities/reservation.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"
import { OrderItem } from "../entities/order_item.entity"

@Injectable()
export class FeasibilityEngineService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Computes expected yield: requests / expected_yield always rounded UP to nearest gram (0.001)
   */
  computeGreenRequirement(
    roastedRequested: number,
    expectedYieldRatio: number,
  ): number {
    const raw = roastedRequested / expectedYieldRatio
    return Math.ceil(raw * 1000) / 1000
  }

  /**
   * Canonical formula for Stock Feasibility.
   * available_green = on_hand - sum(active_reservations) - sum(issued_to_roasting_not_yet_consumed)
   */
  async checkFeasibility(
    coffeeProductId: string,
    roastedQuantityRequested: number,
    expectedYieldRatio: number = 0.82, // Default 82% yield
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const stock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: coffeeProductId, itemType: "GREEN" },
      })

      const onHand = stock ? Number(stock.onHand) : 0
      const reserved = stock ? Number(stock.reserved) : 0
      const available = stock ? Number(stock.available) : 0

      const requirement = this.computeGreenRequirement(
        roastedQuantityRequested,
        expectedYieldRatio,
      )

      const shortfall = requirement > available ? requirement - available : 0

      return {
        onHand,
        reserved,
        available,
        requirement,
        shortfall,
        isFeasible: shortfall === 0,
      }
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Reserves green stock for an order item safely using pessimistic locking
   * to guarantee no negative balances under concurrency.
   */
  async reserveStock(
    orderItemId: string,
    coffeeProductId: string,
    quantityToReserve: number,
    userId: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const stock = await queryRunner.manager.findOne(StockBalance, {
        where: { itemId: coffeeProductId, itemType: "GREEN" },
        lock: { mode: "pessimistic_write" },
      })

      if (!stock) throw new BadRequestException("Stock balance not found.")

      if (Number(stock.available) < quantityToReserve) {
        throw new BadRequestException("STOCK_INSUFFICIENT")
      }

      // Update Stock (available decreases, reserved increases, onHand stays same)
      stock.reserved = Number(stock.reserved) + quantityToReserve
      stock.available = Number(stock.onHand) - stock.reserved // Canonical formula

      // DB constraint `available >= 0` adds another safety layer here
      await queryRunner.manager.save(stock)

      // Create Reservation record
      const reservation = queryRunner.manager.create(Reservation, {
        orderItemId,
        coffeeProductId,
        quantity: quantityToReserve,
        status: "active",
      })
      await queryRunner.manager.save(reservation)

      // Ledger Transaction for tracking
      const transaction = queryRunner.manager.create(InventoryTransaction, {
        type: "RESERVATION",
        direction: "reserve",
        quantity: quantityToReserve,
        coffeeProductId,
        resultingBalance: stock.available,
        referenceEntityType: "Reservation",
        referenceEntityId: reservation.id,
        performedByUserId: userId,
      })
      await queryRunner.manager.save(transaction)

      await queryRunner.commitTransaction()
      return reservation
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
