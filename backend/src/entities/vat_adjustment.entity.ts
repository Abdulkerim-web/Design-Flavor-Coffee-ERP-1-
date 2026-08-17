import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { Order } from "./order.entity"
import { User } from "./user.entity"

@Entity("vat_adjustments")
export class VatAdjustment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "order_id", type: "uuid" })
  orderId: string

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column({ name: "delta_amount", type: "decimal", precision: 14, scale: 2 })
  deltaAmount: number // Positive = adding VAT liability, Negative = reducing VAT liability

  @Column({ type: "text" })
  reason: string

  @Column({ name: "approved_by_user_id", type: "uuid" })
  approvedByUserId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "approved_by_user_id" })
  approvedBy: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
