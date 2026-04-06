import pool from '../config/db.js';

/**
 * Find a player by primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM players WHERE id = ?', [id]);
  return rows[0] ?? null;
}

/**
 * Get all players on a team.
 * @param {number} team_id
 * @returns {Promise<object[]>}
 */
export async function findByTeam(team_id) {
  const [rows] = await pool.query(
    'SELECT * FROM players WHERE team_id = ? ORDER BY is_captain DESC, created_at ASC',
    [team_id],
  );
  return rows;
}

/**
 * Find a player by user id within a specific tournament (across all teams).
 * @param {number} user_id
 * @param {number} tournament_id
 * @returns {Promise<object|null>}
 */
export async function findByUserAndTournament(user_id, tournament_id) {
  const [rows] = await pool.query(
    `SELECT p.* FROM players p
     JOIN teams t ON p.team_id = t.id
     WHERE p.user_id = ? AND t.tournament_id = ?
     LIMIT 1`,
    [user_id, tournament_id],
  );
  return rows[0] ?? null;
}

/**
 * Get the most recent pending player in a tournament (for YES/NO SMS approval).
 * @param {number} tournament_id
 * @returns {Promise<object|null>}
 */
export async function findLatestPendingByTournament(tournament_id) {
  const [rows] = await pool.query(
    `SELECT p.* FROM players p
     JOIN teams t ON p.team_id = t.id
     WHERE t.tournament_id = ? AND p.status = 'pending'
     ORDER BY p.created_at DESC LIMIT 1`,
    [tournament_id],
  );
  return rows[0] ?? null;
}

/**
 * Get the most recent pending player on a specific team (captain approval).
 * @param {number} team_id
 * @returns {Promise<object|null>}
 */
export async function findLatestPendingByTeam(team_id) {
  const [rows] = await pool.query(
    `SELECT * FROM players WHERE team_id = ? AND status = 'pending'
     ORDER BY created_at DESC LIMIT 1`,
    [team_id],
  );
  return rows[0] ?? null;
}

/**
 * Get all approved players across every team in a tournament.
 * @param {number} tournament_id
 * @returns {Promise<object[]>}
 */
export async function findApprovedByTournament(tournament_id) {
  const [rows] = await pool.query(
    `SELECT p.* FROM players p
     JOIN teams t ON p.team_id = t.id
     WHERE t.tournament_id = ? AND p.status = 'approved'`,
    [tournament_id],
  );
  return rows;
}

/**
 * Insert a new player signup.
 * @param {{ team_id: number, user_id: number|null, display_name: string, phone_number: string, is_captain?: number }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({ team_id, user_id, display_name, phone_number, is_captain = 0 }) {
  const [result] = await pool.query(
    `INSERT INTO players (team_id, user_id, display_name, phone_number, is_captain, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
    [team_id, user_id ?? null, display_name, phone_number, is_captain],
  );
  return result.insertId;
}

/**
 * Approve or deny a player.
 * @param {number} id
 * @param {'approved'|'denied'} status
 * @returns {Promise<void>}
 */
export async function updateStatus(id, status) {
  await pool.query('UPDATE players SET status = ? WHERE id = ?', [status, id]);
}

/**
 * Count approved players on a team.
 * @param {number} team_id
 * @returns {Promise<number>}
 */
export async function countApprovedByTeam(team_id) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM players WHERE team_id = ? AND status = 'approved'",
    [team_id],
  );
  return rows[0].cnt;
}
