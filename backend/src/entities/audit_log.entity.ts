import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', length: 50 })
  action: string;

  @Column({ name: 'entity_type', type: 'enum', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'enum', length: 100 })
  entityId: string;

  @Column({ type: 'json' })
  changes: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
