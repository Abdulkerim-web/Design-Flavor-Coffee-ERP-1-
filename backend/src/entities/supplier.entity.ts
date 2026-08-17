import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_number', unique: true, type: 'enum', length: 50 })
  businessNumber: string;

  @Column({ type: 'enum', length: 255 })
  name: string;

  @Column({ name: 'contact_info', type: 'enum', length: 255 })
  contactInfo: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
