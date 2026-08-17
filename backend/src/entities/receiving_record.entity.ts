import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { User } from './user.entity';
import { CoffeeProduct } from './coffee_product.entity';

@Entity('receiving_records')
export class ReceivingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', length: 50, default: 'received' })
  // RECEIVED, QC_PENDING, QC_COMPLETED, PENDING_MANAGER_APPROVAL, APPROVED, REJECTED
  status: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'coffee_product_id', type: 'uuid' })
  coffeeProductId: string;

  @ManyToOne(() => CoffeeProduct)
  @JoinColumn({ name: 'coffee_product_id' })
  coffeeProduct: CoffeeProduct;

  @Column({ name: 'storekeeper_user_id', type: 'uuid' })
  storekeeperUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'storekeeper_user_id' })
  storekeeper: User;

  @Column({ name: 'inspector_user_id', type: 'uuid', nullable: true })
  inspectorUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_user_id' })
  inspector: User | null;

  @Column({ name: 'manager_user_id', type: 'uuid', nullable: true })
  managerUserId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'manager_user_id' })
  manager: User | null;

  @Column({ name: 'received_quantity', type: 'decimal', precision: 10, scale: 3 })
  receivedQuantity: number;

  @Column({ name: 'accepted_quantity', type: 'decimal', precision: 10, scale: 3, nullable: true })
  acceptedQuantity: number | null;

  @Column({ name: 'rejected_quantity', type: 'decimal', precision: 10, scale: 3, nullable: true })
  rejectedQuantity: number | null;

  @Column({ name: 'qc_notes', type: 'text', nullable: true })
  qcNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
