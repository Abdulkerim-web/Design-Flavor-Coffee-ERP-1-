import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./user.entity"

@Entity("inventory_transactions")
export class InventoryTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 50 })
  // e.g. RECEIPT, RESERVATION, CONSUMPTION, ADJUSTMENT, RETURN
  type: string

  @Column({ type: "varchar", enum: ["in", "out", "reserve", "release"] })
  direction: "in" | "out" | "reserve" | "release"

  @Column({ type: "decimal", precision: 10, scale: 3 })
  quantity: number

  @Column({ name: "coffee_product_id", type: "uuid" })
  coffeeProductId: string

  // The resulting available balance at the time of transaction (optional cache for fast read history)
  @Column({
    name: "resulting_balance",
    type: "decimal",
    precision: 10,
    scale: 3,
    nullable: true,
  })
  resultingBalance: number | null

  @Column({ name: "reference_entity_type", type: "varchar", length: 50 })
  referenceEntityType: string // e.g. 'ReceivingRecord', 'Order', 'StockAdjustment'

  @Column({ name: "reference_entity_id", type: "varchar", length: 50 })
  referenceEntityId: string

  @Column({ name: "performed_by_user_id", type: "uuid" })
  performedByUserId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "performed_by_user_id" })
  performedBy: User

  @Column({ name: "approved_by_user_id", type: "uuid", nullable: true })
  approvedByUserId: string | null

  @ManyToOne(() => User)
  @JoinColumn({ name: "approved_by_user_id" })
  approvedBy: User | null

  @Column({ type: "text", nullable: true })
  notes: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
