const { Client } = require('pg');

const DEMO_USERS = [
  { email: 'abebe.g@flavorcoffee.et', role: 'ADMIN', name: 'Abebe G.' },
  { email: 'meron.b@flavorcoffee.et', role: 'SALES', name: 'Meron B.' },
  { email: 'dawit.h@flavorcoffee.et', role: 'ROASTER', name: 'Dawit H.' },
  { email: 'tigist.a@flavorcoffee.et', role: 'ACCOUNTANT', name: 'Tigist A.' },
  { email: 'yohannes.m@flavorcoffee.et', role: 'DELIVERY', name: 'Yohannes M.' },
  { email: 'biruk.a@flavorcoffee.et', role: 'ADMIN', name: 'Biruk A.', status: 'disabled' },
];

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  let id = 2000;
  for (const u of DEMO_USERS) {
    const status = u.status || 'active';
    await client.query(`
      INSERT INTO "users" ("business_number", "name", "email", "role_id", "status") 
      VALUES ('USR-${id++}', '${u.name}', '${u.email}', '${u.role}', '${status}')
    `);
    console.log('Inserted', u.email);
  }
  await client.end();
}
run().catch(console.error);
