import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('discrepancies')
export class Discrepancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'enum', length: 50 })
  // e.g. 'RoastingBatch', 'PackingRecord', 'GreenReturn'
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  expectedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  actualQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  difference: number; // actual - expected

  @Column({ type: 'enum', length: 50, default: 'pending-review' })
  // PENDING_RESOLUTION, RESOLVED
  status: string;

  @Column({ name: 'resolved_by_user_id', type: 'uuid', nullable: true })
  resolvedByUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedBy: User | null;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ name: 'final_adjudicated_quantity', type: 'decimal', precision: 10, scale: 3, nullable: true })
  finalAdjudicatedQuantity: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
