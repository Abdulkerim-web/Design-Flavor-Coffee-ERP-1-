import { DataSource } from 'typeorm';
import { AllEntities } from './src/entities';
import * as fs from 'fs';

const dataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:postgres@localhost:5432/dummy',
  entities: AllEntities,
  synchronize: false,
});

async function run() {
  const anyDs = dataSource as any;
  anyDs.driver.connect = async () => {};
  anyDs.isInitialized = true;
  
  const queryRunner = anyDs.driver.createQueryRunner('master');
  queryRunner.connect = async () => {};
  queryRunner.release = async () => {};
  queryRunner.getTables = async () => [];
  queryRunner.getViews = async () => [];
  queryRunner.getCurrentDatabase = async () => 'postgres';
  queryRunner.getCurrentSchema = async () => 'public';
  
  queryRunner.query = async () => [];

  anyDs.buildMetadatas();

  const builder = anyDs.driver.createSchemaBuilder();
  builder.queryRunner = queryRunner;

  try {
    const sqlInMemory = await builder.log();
    const sqls = sqlInMemory.upQueries.map((q: any) => q.query + ';').join('\n\n');
    fs.writeFileSync('full_schema_mock.sql', sqls);
    console.log('Schema generated to full_schema_mock.sql');
  } catch (e) {
    console.error(e);
  }
}

run().catch(console.error);
