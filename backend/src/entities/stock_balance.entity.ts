import { Entity, PrimaryColumn, Column, Check, UpdateDateColumn } from 'typeorm';

@Entity('stock_balances')
// Database-level constraint to prevent negative available inventory!
@Check(`"available" >= 0`)
export class StockBalance {
  // Can be a CoffeeProductId or PackagingProductId
  @PrimaryColumn({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ type: 'enum', enum: ['GREEN', 'ROASTED', 'PACKAGING'] })
  itemType: 'GREEN' | 'ROASTED' | 'PACKAGING';

  @Column({ name: 'on_hand', type: 'decimal', precision: 10, scale: 3, default: 0 })
  onHand: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reserved: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  available: number; // Derived: on_hand - reserved

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
