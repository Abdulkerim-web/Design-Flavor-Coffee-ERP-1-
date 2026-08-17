import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CoffeeProduct } from './coffee_product.entity';
import { ReceivingRecord } from './receiving_record.entity';

@Entity('lots')
export class Lot {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  // Format: LOT-{ORIGIN}-{YYYY}-{seq}
  id: string;

  @Column({ name: 'coffee_product_id', type: 'uuid' })
  coffeeProductId: string;

  @ManyToOne(() => CoffeeProduct)
  @JoinColumn({ name: 'coffee_product_id' })
  coffeeProduct: CoffeeProduct;

  @Column({ name: 'receiving_record_id', type: 'uuid' })
  receivingRecordId: string;

  @ManyToOne(() => ReceivingRecord)
  @JoinColumn({ name: 'receiving_record_id' })
  receivingRecord: ReceivingRecord;

  @Column({ name: 'initial_quantity', type: 'decimal', precision: 10, scale: 3 })
  initialQuantity: number;

  @Column({ name: 'unit_cost_etb', type: 'decimal', precision: 14, scale: 2 })
  unitCostEtb: number;

  @Column({ name: 'total_cost_etb', type: 'decimal', precision: 14, scale: 2 })
  totalCostEtb: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
