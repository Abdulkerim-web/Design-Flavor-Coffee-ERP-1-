const { Client } = require("pg")

async function run() {
  const client = new Client({
    connectionString:
      "postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()

    // 1. Roles
    await client.query(`
      INSERT INTO "roles" ("id", "tier") VALUES 
      ('ADMIN', 1), ('MANAGER', 2), ('ACCOUNTANT', 2), ('SALES_REP', 3), ('ROASTER', 3), ('STOREKEEPER', 3)
      ON CONFLICT DO NOTHING;
    `)

    // 2. Admin User
    await client.query(`
      INSERT INTO "users" ("business_number", "name", "email", "role_id", "status") VALUES
      ('USR-1001', 'Admin Demo', 'admin@designflavor.com', 'ADMIN', 'active')
      ON CONFLICT DO NOTHING;
    `)

    // 4. Get the UUIDs for relations
    const userRes = await client.query(
      `SELECT id FROM "users" WHERE business_number = 'USR-1001'`,
    )
    const userId = userRes.rows[0].id

    // 3. Customers
    await client.query(
      `
      INSERT INTO "customers" ("business_number", "name", "active", "sales_rep_id") VALUES
      ('CUST-1001', 'Blue Nile Trading Co.', true, $1)
      ON CONFLICT DO NOTHING;
    `,
      [userId],
    )

    console.log("Demo data re-seeded successfully!")
  } catch (err) {
    console.error("Error seeding data:", err)
  } finally {
    await client.end()
  }
}

run()
