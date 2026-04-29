import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

dotenv.config();

async function main() {
  console.log('Starting migration...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: 'src/db/migrations' });

  console.log('Migrations completed successfully!');

  await pool.end();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
