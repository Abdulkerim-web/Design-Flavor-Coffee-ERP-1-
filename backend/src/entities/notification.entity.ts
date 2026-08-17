import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', length: 50 })
  type: string;

  @Column({ type: 'enum', length: 20 })
  severity: string;

  @Column({ name: 'recipient_user_id', type: 'uuid' })
  recipientUserId: string;

  @Column({ name: 'related_entity_type', type: 'enum', length: 100, nullable: true })
  relatedEntityType: string | null;

  @Column({ name: 'related_entity_id', type: 'enum', length: 100, nullable: true })
  relatedEntityId: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
