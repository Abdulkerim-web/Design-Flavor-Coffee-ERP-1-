import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { Payment } from "../entities/payment.entity"
import { Order } from "../entities/order.entity"
import { CompanyBankAccount } from "../entities/company_bank_account.entity"
import { BankTransaction } from "../entities/bank_transaction.entity"

@Injectable()
export class PaymentService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Dynamically calculate payment status (UNPAID, PARTIALLY_PAID, PAID, OVERDUE)
   * This is calculated live rather than stored statically on the DB, per prompt constraints.
   */
  async getOrderStatus(orderId: string): Promise<{
    totalAmount: number
    amountPaid: number
    balanceOutstanding: number
    status: "unpaid" | "partially-paid" | "paid" | "overdue"
  }> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
      })
      if (!order) throw new BadRequestException("Order not found")

      const payments = await queryRunner.manager.find(Payment, {
        where: { orderId: orderId },
      })

      const totalAmount = Number(order.totalAmount) || 0
      const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const balanceOutstanding = totalAmount - amountPaid

      let status: "unpaid" | "partially-paid" | "paid" | "overdue" = "unpaid"

      if (amountPaid >= totalAmount && totalAmount > 0) {
        status = "paid"
      } else if (amountPaid > 0) {
        status = "partially-paid"
      }

      // Check overdue if not fully paid
      if (status !== "paid" && order.paymentDeadlineAt) {
        if (new Date() > new Date(order.paymentDeadlineAt)) {
          status = "overdue"
        }
      }

      return { totalAmount, amountPaid, balanceOutstanding, status }
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Register a customer payment idempotently, block overpayments, and atomically post to Bank Ledger.
   */
  async registerPayment(
    orderId: string,
    amount: number,
    paymentMethod: string,
    bankReferenceNumber: string | null,
    bankAccountId: string | null, // The company bank account receiving the money
    idempotencyKey: string,
    userId: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Idempotency Check
      const existingPayment = await queryRunner.manager.findOne(Payment, {
        where: { idempotencyKey },
      })
      if (existingPayment) {
        await queryRunner.rollbackTransaction()
        return {
          success: true,
          message: "Already registered",
          payment: existingPayment,
        }
      }

      // 2. Load order and existing payments
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
      })
      if (!order) throw new BadRequestException("Order not found")

      const payments = await queryRunner.manager.find(Payment, {
        where: { orderId: orderId },
      })
      const totalAmount = Number(order.totalAmount) || 0
      const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const balanceOutstanding = totalAmount - amountPaid

      // 3. Overpayment guard
      if (amount > balanceOutstanding) {
        throw new BadRequestException(
          `Overpayment rejected. Amount ${amount} exceeds outstanding balance ${balanceOutstanding}. Use manual credit adjustment if intentional.`,
        )
      }

      // 4. Create Payment
      const payment = queryRunner.manager.create(Payment, {
        orderId,
        amount,
        paymentMethod,
        bankReferenceNumber,
        idempotencyKey,
        registeredByUserId: userId,
      })
      await queryRunner.manager.save(payment)

      // 5. Atomic Bank Ledger Post (if not Cash)
      if (paymentMethod === "BANK_TRANSFER" && bankAccountId) {
        // Fetch bank account to ensure it exists.
        // Note: The ledger strictly reconstructs balance from transactions.
        const bankAccount = await queryRunner.manager.findOne(
          CompanyBankAccount,
          { where: { id: bankAccountId } },
        )
        if (!bankAccount)
          throw new BadRequestException("Bank Account not found")

        const bankTx = queryRunner.manager.create(BankTransaction, {
          bankAccountId: bankAccount.id,
          amount: amount, // Positive = deposit
          sourceType: "CUSTOMER_PAYMENT",
          sourceId: payment.id,
          referenceNote: bankReferenceNumber || "No Reference",
        })
        await queryRunner.manager.save(bankTx)
      }

      await queryRunner.commitTransaction()
      return { success: true, payment }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
