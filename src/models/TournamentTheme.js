import pool from '../config/db.js';

/**
 * Return all tournament themes ordered by category and name.
 * @returns {Promise<object[]>}
 */
export async function findAll() {
  const [rows] = await pool.query(
    'SELECT * FROM tournament_themes ORDER BY category, theme_name',
  );
  return rows;
}

/**
 * Find a single tournament theme by primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM tournament_themes WHERE id = ?', [id]);
  return rows[0] ?? null;
}
