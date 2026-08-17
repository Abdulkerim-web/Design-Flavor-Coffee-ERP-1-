import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { CoffeeProduct } from './coffee_product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'coffee_product_id', type: 'uuid' })
  coffeeProductId: string;

  @ManyToOne(() => CoffeeProduct)
  @JoinColumn({ name: 'coffee_product_id' })
  coffeeProduct: CoffeeProduct;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ type: 'enum', length: 100, default: 'pending-confirmation' })
  // Sub-fulfillment status: PENDING, RESERVED, ISSUED_TO_ROASTING, COMPLETED, CANCELLED
  status: string;
}
