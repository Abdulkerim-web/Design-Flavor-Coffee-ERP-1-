import { Injectable } from "@nestjs/common"
import { DataSource } from "typeorm"
import { Order } from "../entities/order.entity"
import { Expense } from "../entities/expense.entity"
import { PayrollRun } from "../entities/payroll_run.entity"

@Injectable()
export class ProfitEngineService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Profit Formula: Revenue (Pre-VAT) - Production Cost - Non-Production Expenses (Rent/Payroll) = Profit
   *
   * This is calculated dynamically. For an actual production cost, we would normally sum the
   * weighted-average cost of Green Coffee consumed + Packaging cost for the specific period/orders.
   * To keep this implementation focused on the core formula, we will simulate the production cost
   * as a fixed percentage or queried sum, but accurately subtract the Payroll and Expenses.
   */
  async calculateProfitForPeriod(startDate: string, endDate: string): Promise<{
    revenuePreVat: number
    vatLiability: number
    productionCost: number // Simulated or derived from inventory transactions
    operatingExpenses: number // Sum of Expenses
    payrollExpenses: number // Sum of Payroll
    netProfit: number
  }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      // 1. Revenue & VAT Liability (Only count COMPLETED/VERIFIED orders ideally, here we sum all created in period for demo)
      const orders = await queryRunner.manager
        .createQueryBuilder(Order, "order")
        .where("order.createdAt >= :startDate", { startDate })
        .andWhere("order.createdAt <= :endDate", { endDate })
        .getMany()

      const revenuePreVat = orders.reduce(
        (sum, o) => sum + Number(o.preVatAmount),
        0,
      )
      const vatLiability = orders.reduce(
        (sum, o) => sum + Number(o.vatAmount),
        0,
      )

      // 2. Production Cost (Normally derived from `InventoryTransaction` of type `ROASTING_CONSUMPTION` and `PACKAGING_CONSUMPTION` * historical cost)
      // For this isolated test, we will assume Production Cost is tracked directly or we mock it as 40% of preVat revenue.
      const productionCost = revenuePreVat * 0.4

      // 3. Operating Expenses (APPROVED or PAID in this period)
      const expenses = await queryRunner.manager
        .createQueryBuilder(Expense, "expense")
        .where("expense.status IN (:...statuses)", {
          statuses: ["approved", "paid"],
        })
        .andWhere("expense.createdAt >= :startDate", { startDate })
        .andWhere("expense.createdAt <= :endDate", { endDate })
        .getMany()

      const operatingExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      )

      // 4. Payroll Expenses (APPROVED or PAID)
      const payrolls = await queryRunner.manager
        .createQueryBuilder(PayrollRun, "payroll")
        .where("payroll.status IN (:...statuses)", {
          statuses: ["approved", "paid"],
        })
        .andWhere("payroll.createdAt >= :startDate", { startDate })
        .andWhere("payroll.createdAt <= :endDate", { endDate })
        .getMany()

      const payrollExpenses = payrolls.reduce(
        (sum, p) => sum + Number(p.totalAmount),
        0,
      )

      // 5. Final Profit Calculation
      const netProfit =
        revenuePreVat - productionCost - operatingExpenses - payrollExpenses

      return {
        revenuePreVat,
        vatLiability,
        productionCost,
        operatingExpenses,
        payrollExpenses,
        netProfit,
      }
    } finally {
      await queryRunner.release()
    }
  }
}
