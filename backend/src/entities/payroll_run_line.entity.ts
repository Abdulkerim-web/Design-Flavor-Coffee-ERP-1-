import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { PayrollRun } from "./payroll_run.entity"
import { User } from "./user.entity"

@Entity("payroll_run_lines")
export class PayrollRunLine {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "payroll_run_id", type: "uuid" })
  payrollRunId: string

  @ManyToOne(
    () => PayrollRun,
    (run) => run.lines,
  )
  @JoinColumn({ name: "payroll_run_id" })
  payrollRun: PayrollRun

  @Column({ name: "employee_user_id", type: "uuid" })
  employeeUserId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "employee_user_id" })
  employee: User

  @Column({
    name: "base_salary_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
  })
  baseSalaryAmount: number

  @Column({
    name: "advance_deduction_amount",
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  advanceDeductionAmount: number

  @Column({ name: "net_amount", type: "decimal", precision: 14, scale: 2 })
  netAmount: number // baseSalaryAmount - advanceDeductionAmount

  @Column({ type: "text", nullable: true })
  notes: string | null
}
