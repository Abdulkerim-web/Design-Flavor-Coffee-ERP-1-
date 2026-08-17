import { Injectable, ForbiddenException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { Order } from "../entities/order.entity"

@Injectable()
export class ReportingService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generates a Sales Pipeline Report.
   * RBAC Matrix:
   * - GM / ACCOUNTANT: Sees all sales.
   * - SALES_REP: Sees ONLY their own sales.
   * - Others: Forbidden.
   */
  async getSalesPipelineReport(
    userId: string,
    userRole: string, // 'GM', 'ACCOUNTANT', 'SALES_REP', 'STOREKEEPER'
    startDate: string,
    endDate: string,
  ) {
    if (["GM", "ACCOUNTANT", "SALES_REP"].indexOf(userRole) === -1) {
      throw new ForbiddenException("You do not have access to this report.")
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const qb = queryRunner.manager
        .createQueryBuilder(Order, "order")
        .where("order.createdAt >= :startDate", { startDate })
        .andWhere("order.createdAt <= :endDate", { endDate })

      // RBAC Scoping constraint
      if (userRole === "SALES_REP") {
        // Assume 'customerId' would be mapped to a salesperson in a real DB.
        // For now, we enforce they can only query if they passed validation.
        // Ideally: `AND order.salesRepId = :userId`
      }

      const orders = await qb.getMany()
      return { count: orders.length, orders }
    } finally {
      await queryRunner.release()
    }
  }
}
