const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase!');
    
    const sql = fs.readFileSync('/home/abdulkerim/snap/antigravity/5/.gemini/antigravity/brain/f1c4ab25-f05a-40aa-b22c-dea3a02ac53a/supabase_schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema successfully deployed to Supabase!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
