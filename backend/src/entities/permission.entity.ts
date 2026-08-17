import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity("permissions")
export class Permission {
  @PrimaryColumn({ type: "varchar", length: 100 })
  id: string

  @Column({ type: "varchar", length: 255 })
  description: string
}
