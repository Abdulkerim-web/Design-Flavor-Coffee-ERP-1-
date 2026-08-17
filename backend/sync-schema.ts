import { DataSource } from 'typeorm';
import { AllEntities } from './src/entities';
import { SeederService } from './src/database/seeder.service';

const dataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
  entities: AllEntities,
  synchronize: true, // Force sync!
  logging: true
});

async function run() {
  try {
    console.log('Initializing DataSource...');
    await dataSource.initialize();
    console.log('DataSource Initialized! Schema synced!');
    
    // Now seed
    console.log('Seeding demo data...');
    const seeder = new SeederService(
      dataSource.getRepository('Customer'),
      dataSource.getRepository('Order'),
      dataSource.getRepository('Lot'),
      dataSource.getRepository('RoastingBatch'),
      dataSource.getRepository('User'),
      dataSource.getRepository('Role')
    );
    await seeder.onApplicationBootstrap();
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during sync:', err);
    process.exit(1);
  }
}

run();
