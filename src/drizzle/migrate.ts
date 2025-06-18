import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { env } from '@/data/env/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

const db = drizzle(pool);

async function main() {
  console.log('Running migrations...');
  
  await migrate(db, {
    migrationsFolder: 'src/drizzle/migrations'
  });
  
  console.log('Migrations completed!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed!', err);
  process.exit(1);
}); 