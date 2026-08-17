import { DataSource } from 'typeorm';
import { AllEntities } from './src/entities';
import * as fs from 'fs';

const dataSource = new DataSource({
  type: 'sqljs',
  autoSave: false,
  entities: AllEntities,
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
  
  let sqlString = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';
  for (const query of sqlInMemory.upQueries) {
    let q = query.query;
    // Replace SQLite types with Postgres types
    q = q.replace(/datetime/g, 'TIMESTAMP');
    q = q.replace(/varchar/g, 'VARCHAR(255)');
    q = q.replace(/boolean/g, 'BOOLEAN');
    q = q.replace(/integer/g, 'INTEGER');
    q = q.replace(/text/g, 'TEXT');
    q = q.replace(/AUTOINCREMENT/g, '');
    q = q.replace(/"id" VARCHAR\(255\) PRIMARY KEY NOT NULL/g, '"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
    q = q.replace(/"id" integer PRIMARY KEY NOT NULL/g, '"id" SERIAL PRIMARY KEY');
    
    // Fix VARCHAR lengths
    q = q.replace(/VARCHAR\(255\)\((\d+)\)/g, 'VARCHAR($1)');
    
    // Fix default syntax
    q = q.replace(/DEFAULT \(TIMESTAMP\('now'\)\)/g, 'DEFAULT NOW()');
    q = q.replace(/BOOLEAN NOT NULL DEFAULT \(1\)/g, 'BOOLEAN NOT NULL DEFAULT TRUE');
    q = q.replace(/BOOLEAN NOT NULL DEFAULT \(0\)/g, 'BOOLEAN NOT NULL DEFAULT FALSE');

    // Add IF NOT EXISTS
    q = q.replace(/CREATE TABLE/g, 'CREATE TABLE IF NOT EXISTS');

    // Prevent duplicate constraint errors on indexes by ignoring or wrapping
    q = q.replace(/CREATE UNIQUE INDEX/g, 'CREATE UNIQUE INDEX IF NOT EXISTS');
    q = q.replace(/CREATE INDEX/g, 'CREATE INDEX IF NOT EXISTS');

    sqlString += q + ';\n\n';
  }
  
  fs.writeFileSync('full_schema_postgres_clean.sql', sqlString);
  console.log('Schema generated successfully to full_schema_postgres_clean.sql');
  process.exit(0);
}

run().catch(console.error);
