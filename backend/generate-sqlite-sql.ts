import { DataSource } from 'typeorm';
import { AllEntities } from './src/entities';
import * as fs from 'fs';

const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: AllEntities,
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
  
  let sqlString = '';
  for (const query of sqlInMemory.upQueries) {
    let q = query.query;
    // Basic SQLite to Postgres replacements
    q = q.replace(/datetime/g, 'TIMESTAMP');
    q = q.replace(/varchar/g, 'VARCHAR(255)');
    q = q.replace(/boolean/g, 'BOOLEAN');
    q = q.replace(/integer/g, 'INTEGER');
    q = q.replace(/text/g, 'TEXT');
    q = q.replace(/AUTOINCREMENT/g, ''); // Handled by Postgres SERIAL or UUID usually
    q = q.replace(/"id" VARCHAR\(255\) PRIMARY KEY NOT NULL/g, '"id" UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    q = q.replace(/"id" integer PRIMARY KEY NOT NULL/g, '"id" SERIAL PRIMARY KEY');
    sqlString += q + ';\n\n';
  }
  
  fs.writeFileSync('full_schema.sql', sqlString);
  console.log('Schema generated to full_schema.sql');
  process.exit(0);
}

run().catch(console.error);
