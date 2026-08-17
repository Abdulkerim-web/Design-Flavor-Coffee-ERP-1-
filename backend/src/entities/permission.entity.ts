import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ type: 'enum', length: 100 })
  id: string;

  @Column({ type: 'enum', length: 255 })
  description: string;
}
