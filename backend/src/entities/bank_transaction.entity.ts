import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { CompanyBankAccount } from "./company_bank_account.entity"

@Entity("bank_transactions")
export class BankTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "bank_account_id", type: "uuid" })
  bankAccountId: string

  @ManyToOne(() => CompanyBankAccount)
  @JoinColumn({ name: "bank_account_id" })
  bankAccount: CompanyBankAccount

  @Column({ type: "decimal", precision: 14, scale: 2 })
  amount: number // positive = deposit, negative = withdrawal

  @Column({ type: "varchar", length: 50 })
  // e.g. CUSTOMER_PAYMENT, EXPENSE, PAYROLL
  sourceType: string

  @Column({ name: "source_id", type: "uuid" })
  sourceId: string // The ID of the Payment, Expense, or PayrollRun

  @Column({ name: "reference_note", type: "text", nullable: true })
  referenceNote: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
