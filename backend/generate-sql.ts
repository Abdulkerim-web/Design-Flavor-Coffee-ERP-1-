import { DataSource } from 'typeorm';
import { AllEntities } from './src/entities';

const dataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:postgres@localhost:5432/dummy', // Just for generation
  entities: AllEntities,
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  
  const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
  
  let sqlString = '';
  for (const query of sqlInMemory.upQueries) {
    sqlString += query.query + ';\n\n';
  }
  
  const fs = require('fs');
  fs.writeFileSync('schema.sql', sqlString);
  console.log('Schema generated to schema.sql');
  process.exit(0);
}

run().catch(console.error);
