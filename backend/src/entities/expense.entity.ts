import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'enum', length: 100 })
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', length: 50, default: 'requested' })
  // REQUESTED, PENDING_MANAGER_APPROVAL, APPROVED, PAID, REJECTED
  status: string;

  @Column({ name: 'payment_method', type: 'enum', length: 50, nullable: true })
  // BANK_TRANSFER, CASH (Cash does NOT hit BankTransaction)
  paymentMethod: string | null;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy: User;

  @Column({ name: 'approved_by_manager_id', type: 'uuid', nullable: true })
  approvedByManagerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
