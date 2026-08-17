import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./user.entity"

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "user_id", type: "uuid" })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User

  @Column({ name: "token_hash", type: "varchar", length: 255 })
  tokenHash: string

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  device: string | null

  @CreateDateColumn({ name: "issued_at" })
  issuedAt: Date

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date

  @Column({ name: "revoked_at", type: "timestamp", nullable: true })
  revokedAt: Date | null
}
