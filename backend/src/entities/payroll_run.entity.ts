import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { PayrollRunLine } from './payroll_run_line.entity';

@Entity('payroll_runs')
export class PayrollRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({ type: 'enum', length: 50, default: 'draft' })
  // DRAFT, PENDING_MANAGER_APPROVAL, APPROVED, PAID, REJECTED
  status: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'prepared_by_user_id', type: 'uuid' })
  preparedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'prepared_by_user_id' })
  preparedBy: User;

  @Column({ name: 'approved_by_manager_id', type: 'uuid', nullable: true })
  approvedByManagerId: string | null;

  @OneToMany(() => PayrollRunLine, (line) => line.payrollRun, { cascade: true })
  lines: PayrollRunLine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
