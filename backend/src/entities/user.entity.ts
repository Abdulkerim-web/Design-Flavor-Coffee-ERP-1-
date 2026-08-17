import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm"
import { Role } from "./role.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({
    name: "business_number",
    unique: true,
    type: "varchar",
    length: 50,
  })
  businessNumber: string

  @Column({ type: "varchar", length: 255 })
  name: string

  @Column({ unique: true, type: "varchar", length: 255 })
  email: string

  @Column({ name: "role_id", type: "varchar", length: 50 })
  roleId: string

  @ManyToOne(() => Role)
  @JoinColumn({ name: "role_id" })
  role: Role

  @Column({ type: "varchar", length: 20, default: "active" })
  status: string

  @Column({ name: "last_active", type: "timestamp", nullable: true })
  lastActive: Date | null

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string | null

  @Column({ name: "avatar_color", type: "varchar", length: 20, nullable: true })
  avatarColor: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  department: string | null

  @Column({ name: "deactivated_at", type: "timestamp", nullable: true })
  deactivatedAt: Date | null

  @Column({ name: "deactivated_by", type: "uuid", nullable: true })
  deactivatedBy: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
