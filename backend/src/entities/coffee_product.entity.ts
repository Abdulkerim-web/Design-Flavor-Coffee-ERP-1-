import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coffee_products')
export class CoffeeProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_number', unique: true, type: 'enum', length: 50 })
  businessNumber: string;

  @Column({ name: 'origin_id', type: 'enum', length: 100 })
  originId: string;

  @Column({ name: 'roast_level', type: 'enum', length: 50 })
  roastLevel: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
