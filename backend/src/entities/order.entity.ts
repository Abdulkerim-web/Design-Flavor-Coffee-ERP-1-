import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';
import { CustomerBranch } from './customer_branch.entity';
import { User } from './user.entity';
import { OrderItem } from './order_item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', length: 50, unique: true })
  orderNumber: string; // Auto-generated e.g. ORD-YYYYMMDD-0001

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => CustomerBranch)
  @JoinColumn({ name: 'branch_id' })
  branch: CustomerBranch;

  @Column({ name: 'sales_rep_id', type: 'uuid' })
  salesRepId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: User;

  @Column({ type: 'enum', length: 100, default: 'draft' })
  // Enums from Appendix A: DRAFT, PENDING_MANAGER_CONFIRMATION, CONFIRMED_RESERVED, INSUFFICIENT_STOCK_ON_HOLD, CANCELLATION_REQUESTED, CANCELLED, etc.
  status: string;

  @Column({ name: 'feasibility_override_reason', type: 'text', nullable: true })
  feasibilityOverrideReason: string | null;

  @Column({ name: 'is_urgent', type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ name: 'urgent_deadline_at', type: 'timestamp', nullable: true })
  urgentDeadlineAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ name: 'payment_deadline_at', type: 'timestamp', nullable: true })
  paymentDeadlineAt: Date | null;

  @Column({ name: 'pre_vat_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  preVatAmount: number;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  // E.g. 15.00 for 15% VAT
  vatRate: number;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
