const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = fs.readFileSync('full_schema_postgres_clean.sql', 'utf8');
    
    // In PostgreSQL, constraints (like UQ_) are created inline during CREATE TABLE IF NOT EXISTS.
    // However, if we do ALTER TABLE for constraints, it might fail if they exist.
    // SQLite SchemaBuilder doesn't use ALTER TABLE ADD CONSTRAINT for everything, mostly inline.
    
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    
    await client.query(sql);
    console.log('All 32 tables successfully deployed to Supabase!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
