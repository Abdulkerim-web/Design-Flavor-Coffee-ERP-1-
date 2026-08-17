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

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "order_id", type: "uuid" })
  orderId: string

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column({ type: "decimal", precision: 14, scale: 2 })
  amount: number

  @Column({ name: "payment_method", type: "varchar", length: 50 })
  // BANK_TRANSFER, CASH
  paymentMethod: string

  @Column({
    name: "bank_reference_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  bankReferenceNumber: string | null

  @Column({
    name: "idempotency_key",
    type: "varchar",
    length: 100,
    unique: true,
  })
  idempotencyKey: string

  @Column({ name: "registered_by_user_id", type: "uuid" })
  registeredByUserId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "registered_by_user_id" })
  registeredBy: User

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
