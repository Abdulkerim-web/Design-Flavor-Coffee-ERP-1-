import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { CustomerBranch } from './customer_branch.entity';
import { CustomerSalesRepHistory } from './customer_sales_rep_history.entity';

@Entity('customers')
// Ensures one active record per customer (if we used active as part of unique constraint,
// but TypeORM handles unique constraints natively on columns too).
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_number', unique: true, type: 'enum', length: 50 })
  businessNumber: string;

  @Column({ type: 'enum', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'sales_rep_id', type: 'uuid' })
  salesRepId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: User;

  @OneToMany(() => CustomerBranch, (branch) => branch.customer)
  branches: CustomerBranch[];

  @OneToMany(() => CustomerSalesRepHistory, (history) => history.customer)
  history: CustomerSalesRepHistory[];
}
