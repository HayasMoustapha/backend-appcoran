import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';
import env from './env.js';
import { pool, query } from './database.js';

const { Client } = pg;

function getDbName() {
  const url = new URL(env.databaseUrl);
  return url.pathname.replace('/', '');
}

function getAdminDatabaseUrl() {
  const url = new URL(env.databaseUrl);
  url.pathname = `/${env.dbAdminDatabase}`;
  return url.toString();
}

/**
 * Ensure target database exists by connecting to an admin database.
 */
export async function ensureDatabaseExists() {
  const dbName = getDbName();
  const adminClient = new Client({ connectionString: getAdminDatabaseUrl() });
  await adminClient.connect();

  const result = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName]
  );

  if (result.rows.length === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
  }

  await adminClient.end();
}

/**
 * Apply SQL migrations in sql/migrations.
 */
export async function runMigrations() {
  await query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, run_at TIMESTAMP NOT NULL DEFAULT NOW())'
  );

  const applied = await query('SELECT name FROM schema_migrations');
  const appliedNames = new Set(applied.rows.map((r) => r.name));

  const migrationsDir = path.resolve('sql/migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedNames.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
