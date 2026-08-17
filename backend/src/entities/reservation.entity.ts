import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './order_item.entity';
import { CoffeeProduct } from './coffee_product.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ name: 'coffee_product_id', type: 'uuid' })
  coffeeProductId: string;

  @ManyToOne(() => CoffeeProduct)
  @JoinColumn({ name: 'coffee_product_id' })
  coffeeProduct: CoffeeProduct;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  // ACTIVE, RELEASED, CONSUMED
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
