import { DataSource } from "typeorm"
import { AllEntities } from "./src/entities"
import { SeederService } from "./src/database/seeder.service"

const dataSource = new DataSource({
  type: "postgres",
  url: "postgresql://postgres:Lx3MLqIBcFeL4uh7@db.udvtogofulclohhvdnzc.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
  entities: AllEntities,
  synchronize: true, // Force sync!
  logging: true,
})

async function run() {
  try {
    console.log("Connecting directly to db.udvtogofulclohhvdnzc.supabase.co...")
    await dataSource.initialize()
    console.log(
      "DataSource Initialized! All 32 tables schema synced successfully!",
    )

    console.log("Seeding demo data...")
    const seeder = new SeederService(
      dataSource.getRepository("Customer"),
      dataSource.getRepository("Order"),
      dataSource.getRepository("Lot"),
      dataSource.getRepository("RoastingBatch"),
      dataSource.getRepository("User"),
      dataSource.getRepository("Role"),
    )
    await seeder.onApplicationBootstrap()
    console.log("Seeding complete!")
    process.exit(0)
  } catch (err) {
    console.error("Error during sync:", err)
    process.exit(1)
  }
}

run()
