import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { Order } from "./order.entity"
import { Customer } from "./customer.entity"

@Entity("delivery_records")
export class DeliveryRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "order_id", type: "uuid" })
  orderId: string

  @ManyToOne(() => Order)
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column({ name: "customer_id", type: "uuid" })
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer

  @Column({ type: "varchar", length: 50, default: "READY_FOR_ASSIGNMENT" })
  // READY_FOR_ASSIGNMENT, ASSIGNED, IN_TRANSIT, DELIVERED_PENDING_VERIFICATION, COMPLETED
  status: string

  @Column({ name: "driver_user_id", type: "uuid", nullable: true })
  driverUserId: string | null

  @Column({
    name: "proof_document_path",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  proofDocumentPath: string | null

  @Column({ name: "verified_by_manager_id", type: "uuid", nullable: true })
  verifiedByManagerId: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
