import { AppDataSource } from './data-source';

async function run() {
  try {
    console.log('Initializing DB connection for migrations...');
    await AppDataSource.initialize();
    console.log('Connected. Running migrations...');
    const applied = await AppDataSource.runMigrations();
    console.log(`Migrations applied: ${applied.length}`);
    await AppDataSource.destroy();
    console.log('Migrations finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration execution failed:', err);
    // ensure a non-zero exit so callers detect failure
    process.exit(1);
  }
}

run();
