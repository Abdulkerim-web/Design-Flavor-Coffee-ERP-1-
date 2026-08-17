import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';

@Entity('customer_sales_rep_history')
export class CustomerSalesRepHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.history)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'sales_rep_id', type: 'uuid' })
  salesRepId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: User;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'unassigned_at', type: 'timestamp', nullable: true })
  unassignedAt: Date | null;
}
