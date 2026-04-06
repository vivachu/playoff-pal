import pool from '../config/db.js';

/**
 * Find a team by primary key (includes mascot join).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT t.*, m.name AS mascot_name, m.slug AS mascot_slug, m.icon_path AS mascot_icon_path
     FROM teams t LEFT JOIN mascots m ON t.mascot_id = m.id
     WHERE t.id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Get all teams in a tournament (includes mascot join).
 * @param {number} tournament_id
 * @returns {Promise<object[]>}
 */
export async function findByTournament(tournament_id) {
  const [rows] = await pool.query(
    `SELECT t.*, m.name AS mascot_name, m.slug AS mascot_slug, m.icon_path AS mascot_icon_path
     FROM teams t LEFT JOIN mascots m ON t.mascot_id = m.id
     WHERE t.tournament_id = ?
     ORDER BY t.seed ASC, t.id ASC`,
    [tournament_id],
  );
  return rows;
}

/**
 * Insert a new team.
 * @param {{ tournament_id: number, name: string, mascot_id: number }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({ tournament_id, name, mascot_id }) {
  const [result] = await pool.query(
    `INSERT INTO teams (tournament_id, name, mascot_id, status, created_at)
     VALUES (?, ?, ?, 'active', NOW())`,
    [tournament_id, name, mascot_id],
  );
  return result.insertId;
}

/**
 * Update a team's name or mascot.
 * @param {number} id
 * @param {{ name?: string, mascot_id?: number, seed?: number }} fields
 * @returns {Promise<void>}
 */
export async function update(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.name !== undefined)     { sets.push('name = ?');     vals.push(fields.name); }
  if (fields.mascot_id !== undefined) { sets.push('mascot_id = ?'); vals.push(fields.mascot_id); }
  if (fields.seed !== undefined)      { sets.push('seed = ?');      vals.push(fields.seed); }
  if (!sets.length) return;
  vals.push(id);
  await pool.query(`UPDATE teams SET ${sets.join(', ')} WHERE id = ?`, vals);
}

/**
 * Transition a team's status.
 * @param {number} id
 * @param {'active'|'eliminated'|'winner'} status
 * @returns {Promise<void>}
 */
export async function updateStatus(id, status) {
  await pool.query('UPDATE teams SET status = ? WHERE id = ?', [status, id]);
}
