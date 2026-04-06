import pool from '../config/db.js';

const JOINS = `
  LEFT JOIN tournament_themes tt ON t.theme_id = tt.id
  LEFT JOIN prize_types pt ON t.prize_type_id = pt.id
`;

const SELECT = `
  t.*,
  tt.theme_name, tt.category, tt.format,
  tt.active_players_per_side, tt.icon_path AS theme_icon_path,
  pt.name AS prize_name, pt.slug AS prize_slug, pt.icon_path AS prize_icon_path
`;

/**
 * Find a tournament by primary key (includes theme and prize joins).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query(`SELECT ${SELECT} FROM tournaments t ${JOINS} WHERE t.id = ?`, [id]);
  return rows[0] ?? null;
}

/**
 * Find a tournament by its hashids share code.
 * @param {string} share_code
 * @returns {Promise<object|null>}
 */
export async function findByShareCode(share_code) {
  const [rows] = await pool.query(
    `SELECT ${SELECT} FROM tournaments t ${JOINS} WHERE t.share_code = ?`,
    [share_code],
  );
  return rows[0] ?? null;
}

/**
 * Get all tournaments created by a user, newest first.
 * @param {number} user_id
 * @returns {Promise<object[]>}
 */
export async function findByCreator(user_id) {
  const [rows] = await pool.query(
    `SELECT ${SELECT} FROM tournaments t ${JOINS} WHERE t.creator_user_id = ? ORDER BY t.created_at DESC`,
    [user_id],
  );
  return rows;
}

/**
 * Get public tournaments (signup/gameplay/ended), newest first, capped at 50.
 * @returns {Promise<object[]>}
 */
export async function findPublic() {
  const [rows] = await pool.query(
    `SELECT ${SELECT} FROM tournaments t ${JOINS}
     WHERE t.status IN ('signup', 'gameplay', 'ended')
     ORDER BY t.created_at DESC LIMIT 50`,
  );
  return rows;
}

/**
 * Insert a new tournament in draft state (without share_code — set after insert via updateShareCode).
 * @param {object} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({
  creator_user_id, title, description, theme_id, game_rules,
  prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
}) {
  const [result] = await pool.query(
    `INSERT INTO tournaments
      (creator_user_id, title, description, theme_id, game_rules, status,
       prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      creator_user_id, title, description, theme_id, game_rules,
      prize_type_id ?? null, prize_description ?? null,
      location, start_datetime, timezone, num_teams,
    ],
  );
  return result.insertId;
}

/**
 * Set the share code on a tournament after insert.
 * @param {number} id
 * @param {string} share_code
 * @returns {Promise<void>}
 */
export async function updateShareCode(id, share_code) {
  await pool.query('UPDATE tournaments SET share_code = ?, updated_at = NOW() WHERE id = ?', [share_code, id]);
}

/**
 * Update editable fields on a draft tournament.
 * @param {number} id
 * @param {object} fields
 * @returns {Promise<void>}
 */
export async function update(id, {
  title, description, theme_id, game_rules,
  prize_type_id, prize_description, location, start_datetime, timezone, num_teams,
}) {
  await pool.query(
    `UPDATE tournaments SET
      title = ?, description = ?, theme_id = ?, game_rules = ?,
      prize_type_id = ?, prize_description = ?,
      location = ?, start_datetime = ?, timezone = ?, num_teams = ?,
      updated_at = NOW()
     WHERE id = ?`,
    [
      title, description, theme_id, game_rules,
      prize_type_id ?? null, prize_description ?? null,
      location, start_datetime, timezone, num_teams, id,
    ],
  );
}

/**
 * Transition a tournament to a new status.
 * @param {number} id
 * @param {'draft'|'signup'|'gameplay'|'ended'} status
 * @returns {Promise<void>}
 */
export async function updateStatus(id, status) {
  await pool.query(
    'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id],
  );
}
