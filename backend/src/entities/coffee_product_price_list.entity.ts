import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CoffeeProduct } from './coffee_product.entity';

@Entity('coffee_product_price_lists')
export class CoffeeProductPriceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coffee_product_id', type: 'uuid' })
  coffeeProductId: string;

  @ManyToOne(() => CoffeeProduct)
  @JoinColumn({ name: 'coffee_product_id' })
  coffeeProduct: CoffeeProduct;

  @Column({ name: 'unit_price', type: 'decimal', precision: 14, scale: 2 })
  unitPrice: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
