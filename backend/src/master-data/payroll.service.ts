import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { PayrollRun } from "../entities/payroll_run.entity"
import { PayrollRunLine } from "../entities/payroll_run_line.entity"
import { BankTransaction } from "../entities/bank_transaction.entity"
import { CompanyBankAccount } from "../entities/company_bank_account.entity"

@Injectable()
export class PayrollService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Prepares a Payroll Run. Sums up all lines and handles negative advance deductions.
   */
  async preparePayrollRun(
    periodStart: string,
    periodEnd: string,
    lines: {
      employeeUserId: string
      baseSalaryAmount: number
      advanceDeductionAmount: number
      notes?: string
    }[],
    preparedByUserId: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      let totalAmount = 0

      const run = queryRunner.manager.create(PayrollRun, {
        periodStart,
        periodEnd,
        preparedByUserId,
        status: "pending-manager-approval",
      })
      await queryRunner.manager.save(run)

      for (const l of lines) {
        // Validate inputs
        if (l.baseSalaryAmount < 0 || l.advanceDeductionAmount < 0) {
          throw new BadRequestException(
            "Salary and Deduction amounts must be positive",
          )
        }

        const netAmount =
          Number(l.baseSalaryAmount) - Number(l.advanceDeductionAmount)

        if (netAmount < 0) {
          throw new BadRequestException(
            `Negative net salary not allowed for employee ${l.employeeUserId}`,
          )
        }

        totalAmount += netAmount

        const line = queryRunner.manager.create(PayrollRunLine, {
          payrollRunId: run.id,
          employeeUserId: l.employeeUserId,
          baseSalaryAmount: l.baseSalaryAmount,
          advanceDeductionAmount: l.advanceDeductionAmount,
          netAmount,
          notes: l.notes,
        })
        await queryRunner.manager.save(line)
      }

      run.totalAmount = totalAmount
      await queryRunner.manager.save(run)

      await queryRunner.commitTransaction()
      return run
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Approve and Pay payroll. Atomically posts to the Bank Ledger.
   */
  async payPayrollRun(
    payrollRunId: string,
    managerUserId: string,
    bankAccountId: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const run = await queryRunner.manager.findOne(PayrollRun, {
        where: { id: payrollRunId },
      })

      if (!run) throw new BadRequestException("Payroll Run not found")
      if (run.status !== "pending-manager-approval") {
        throw new BadRequestException("Payroll Run not in a payable state")
      }

      run.status = "paid"
      run.approvedByManagerId = managerUserId
      await queryRunner.manager.save(run)

      const bankAccount = await queryRunner.manager.findOne(
        CompanyBankAccount,
        { where: { id: bankAccountId } },
      )
      if (!bankAccount) throw new BadRequestException("Bank Account not found")

      const bankTx = queryRunner.manager.create(BankTransaction, {
        bankAccountId: bankAccount.id,
        amount: -run.totalAmount, // Negative = withdrawal
        sourceType: "PAYROLL",
        sourceId: run.id,
        referenceNote: `Payroll ${run.periodStart} to ${run.periodEnd}`,
      })
      await queryRunner.manager.save(bankTx)

      await queryRunner.commitTransaction()
      return run
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
