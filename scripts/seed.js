import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, `../.env.${process.env.NODE_ENV || 'local'}`) });

const SEEDS_DIR = join(__dirname, '../seeds');

/**
 * Open a MySQL connection with multipleStatements enabled.
 * @returns {Promise<import('mysql2/promise').Connection>}
 */
async function getConnection() {
  return createConnection({
    host:               process.env.DB_HOST,
    port:               Number(process.env.DB_PORT) || 3306,
    database:           process.env.DB_NAME,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    multipleStatements: true,
  });
}

/**
 * Run all .sql files in a seed directory in sorted filename order.
 * @param {import('mysql2/promise').Connection} conn
 * @param {string} dir - absolute path to seed subdirectory
 * @param {string} label - human-readable label for logging
 */
async function runSeedDir(conn, dir, label) {
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    console.log(`No seed files found in ${label}.`);
    return;
  }

  for (const filename of files) {
    const sql = await readFile(join(dir, filename), 'utf8');
    console.log(`Seeding: ${label}/${filename}`);
    await conn.query(sql);
    console.log(`  ✓ ${filename}`);
  }

  console.log(`\n${label} seed complete. ${files.length} file(s) applied.`);
}

/**
 * Clear all seed data by deleting rows from every application table in
 * reverse FK dependency order. Does NOT drop tables or touch schema_migrations.
 * Safe to run repeatedly.
 * @param {import('mysql2/promise').Connection} conn
 */
async function clearSeeds(conn) {
  // Disable FK checks so we can truncate in any order
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

  const tables = [
    'score_reports',
    'match_players',
    'matches',
    'players',
    'teams',
    'tournaments',
    'ai_logs',
    'otp_codes',
    'sms_opt_outs',
    'users',
    'prize_types',
    'mascots',
    'tournament_themes',
  ];

  for (const table of tables) {
    await conn.execute(`TRUNCATE TABLE \`${table}\``);
    console.log(`  Cleared: ${table}`);
  }

  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('\nAll seed data cleared.');
}

// ── Main ──────────────────────────────────────────────────────────────────────
const isStatic = process.argv.includes('--static');
const isSample = process.argv.includes('--sample');
const isClear  = process.argv.includes('--clear');

if (!isStatic && !isSample && !isClear) {
  console.error('Usage: node scripts/seed.js [--static | --sample | --clear]');
  process.exit(1);
}

let conn;
try {
  conn = await getConnection();

  if (isClear) {
    await clearSeeds(conn);
  } else if (isStatic) {
    await runSeedDir(conn, join(SEEDS_DIR, 'static'), 'static');
  } else if (isSample) {
    await runSeedDir(conn, join(SEEDS_DIR, 'sample'), 'sample');
  }
} catch (err) {
  console.error('Seed error:', err.message);
  process.exit(1);
} finally {
  if (conn) await conn.end();
}
