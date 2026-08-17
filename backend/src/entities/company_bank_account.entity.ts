import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('company_bank_accounts')
export class CompanyBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bank_name', type: 'enum', length: 100 })
  bankName: string;

  @Column({ name: 'account_number', type: 'enum', length: 100 })
  accountNumber: string;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 14, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ name: 'opening_balance_date', type: 'timestamp' })
  openingBalanceDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
