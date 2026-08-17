import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('app_notifications')
export class AppNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // The target user receiving the notification

  @Column({ type: 'varchar', length: 100 })
  type: string; // e.g. DISCREPANCY_ALERT, APPROVAL_NEEDED

  @Column({ name: 'reference_entity_id', type: 'uuid' })
  referenceEntityId: string; // e.g. Discrepancy ID, Order ID

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'UNREAD' })
  status: string; // UNREAD, READ

  @Column({ type: 'int', default: 1 })
  triggerCount: number; // For dedup/spam prevention

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
