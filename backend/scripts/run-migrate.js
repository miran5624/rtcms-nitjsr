import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');
const sql = readFileSync(join(migrationsDir, '001_initial_schema.sql'), 'utf8');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query(sql);
  console.log('migration 001_initial_schema applied');
} finally {
  client.release();
  await pool.end();
}
