import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("packaging_materials")
export class PackagingMaterial {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", length: 100 })
  name: string // e.g. Kraft Paper, Foil

  @Column({ type: "boolean", default: true })
  isActive: boolean
}

@Entity("packaging_sizes")
export class PackagingSize {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "material_id", type: "uuid" })
  materialId: string

  @Column({ type: "varchar", length: 50 })
  size: string // e.g. 250g, 500g, 1kg

  @Column({ type: "boolean", default: true })
  isActive: boolean
}
