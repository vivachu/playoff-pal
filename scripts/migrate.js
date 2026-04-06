import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envName = process.env.NODE_ENV === 'development' ? 'local' : (process.env.NODE_ENV || 'local');
dotenv.config({ path: join(__dirname, `../.env.${envName}`) });

const MIGRATIONS_DIR = join(__dirname, '../migrations');

/**
 * Get or create a DB connection and ensure the schema_migrations tracking
 * table exists.
 * @returns {Promise<import('mysql2/promise').Connection>}
 */
async function getConnection() {
  const conn = await createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          INT          NOT NULL AUTO_INCREMENT,
      filename    VARCHAR(255) NOT NULL,
      executed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  return conn;
}

/**
 * Return a sorted list of all .sql filenames in the migrations directory.
 * @returns {Promise<string[]>}
 */
async function allMigrationFiles() {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter(f => f.endsWith('.sql')).sort();
}

/**
 * Return the set of filenames that have already been executed.
 * @param {import('mysql2/promise').Connection} conn
 * @returns {Promise<Set<string>>}
 */
async function executedMigrations(conn) {
  const [rows] = await conn.execute('SELECT filename FROM schema_migrations ORDER BY id');
  return new Set(rows.map(r => r.filename));
}

/**
 * Run all pending migrations in ascending filename order.
 * @param {import('mysql2/promise').Connection} conn
 */
async function runMigrations(conn) {
  const all      = await allMigrationFiles();
  const executed = await executedMigrations(conn);
  const pending  = all.filter(f => !executed.has(f));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const filename of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, filename), 'utf8');
    console.log(`Running migration: ${filename}`);
    await conn.query(sql);
    await conn.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
    console.log(`  ✓ ${filename}`);
  }

  console.log(`\nMigrations complete. ${pending.length} migration(s) applied.`);
}

/**
 * Roll back the most recently executed migration by removing its record from
 * schema_migrations. The SQL table is NOT dropped — re-run the migration file
 * to re-apply it. Down migrations are not supported in MVP.
 * @param {import('mysql2/promise').Connection} conn
 */
async function rollbackMigration(conn) {
  const [rows] = await conn.execute(
    'SELECT id, filename FROM schema_migrations ORDER BY id DESC LIMIT 1'
  );

  if (rows.length === 0) {
    console.log('Nothing to roll back.');
    return;
  }

  const { id, filename } = rows[0];
  await conn.execute('DELETE FROM schema_migrations WHERE id = ?', [id]);
  console.log(`Rolled back: ${filename}`);
  console.log('Note: the table itself was NOT dropped. Re-run migrate to re-apply.');
}

// ── Main ──────────────────────────────────────────────────────────────────────
const isRollback = process.argv.includes('--rollback');

let conn;
try {
  conn = await getConnection();
  if (isRollback) {
    await rollbackMigration(conn);
  } else {
    await runMigrations(conn);
  }
} catch (err) {
  console.error('Migration error:', err.message);
  process.exit(1);
} finally {
  if (conn) await conn.end();
}
