import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from "typeorm"
import { User } from "./user.entity"
import { CustomerBranch } from "./customer_branch.entity"
import { CustomerSalesRepHistory } from "./customer_sales_rep_history.entity"

@Entity("customers")
// Ensures one active record per customer (if we used active as part of unique constraint,
// but TypeORM handles unique constraints natively on columns too).
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    name: "business_number",
    unique: true,
    type: "varchar",
    length: 50,
  })
  businessNumber: string

  @Column({ type: "varchar", length: 255 })
  name: string

  @Column({ type: "varchar", length: 50, default: "pending" })
  status: string

  @Column({ type: "varchar", length: 50, default: "cafe" })
  type: string

  @Column({
    name: "contact_person",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  contactPerson: string

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string

  @Column({ type: "text", nullable: true })
  notes: string

  @Column({ type: "boolean", default: true })
  active: boolean

  @Column({ name: "sales_rep_id", type: "uuid" })
  salesRepId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "sales_rep_id" })
  salesRep: User

  @OneToMany(
    () => CustomerBranch,
    (branch) => branch.customer,
  )
  branches: CustomerBranch[]

  @OneToMany(
    () => CustomerSalesRepHistory,
    (history) => history.customer,
  )
  history: CustomerSalesRepHistory[]
}
