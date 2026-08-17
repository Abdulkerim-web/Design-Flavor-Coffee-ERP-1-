import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_branches')
export class CustomerBranch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.branches)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'contact_info', type: 'varchar', length: 255 })
  contactInfo: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;
}
