import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'int' })
  tier: number;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
