const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT * FROM "users"');
  console.log(res.rows);
  await client.end();
}
run();
