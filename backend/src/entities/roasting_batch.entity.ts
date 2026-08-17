import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order_item.entity';
import { User } from './user.entity';

@Entity('roasting_batches')
export class RoastingBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ type: 'varchar', length: 50, default: 'planned' })
  // Enums: PLANNED, IN_PROGRESS, COMPLETED, FAILED
  status: string;

  @Column({ name: 'green_input_quantity', type: 'decimal', precision: 10, scale: 3 })
  greenInputQuantity: number;

  @Column({ name: 'expected_roasted_quantity', type: 'decimal', precision: 10, scale: 3 })
  expectedRoastedQuantity: number;

  @Column({ name: 'actual_roasted_quantity', type: 'decimal', precision: 10, scale: 3, nullable: true })
  actualRoastedQuantity: number | null;

  @Column({ name: 'applied_yield_percentage', type: 'decimal', precision: 5, scale: 2 })
  // Store the yield% configured at the time so it doesn't drift
  appliedYieldPercentage: number;

  @Column({ name: 'acceptable_range_percentage', type: 'decimal', precision: 5, scale: 2 })
  // Store the +/- tolerance % configured at the time
  acceptableRangePercentage: number;

  @Column({ name: 'roaster_user_id', type: 'uuid', nullable: true })
  roasterUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'roaster_user_id' })
  roaster: User | null;

  @Column({ name: 'storekeeper_user_id', type: 'uuid', nullable: true })
  storekeeperUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'storekeeper_user_id' })
  storekeeper: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
