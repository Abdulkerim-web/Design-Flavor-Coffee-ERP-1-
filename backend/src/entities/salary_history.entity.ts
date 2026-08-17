import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('salary_histories')
export class SalaryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_user_id', type: 'uuid' })
  employeeUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employee_user_id' })
  employee: User;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'effective_from_date', type: 'date' })
  effectiveFromDate: string;

  @Column({ name: 'changed_by_user_id', type: 'uuid' })
  changedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by_user_id' })
  changedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
