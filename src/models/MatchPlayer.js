import pool from '../config/db.js';

/**
 * Get all active player assignments for a match (includes player display_name).
 * @param {number} match_id
 * @returns {Promise<object[]>}
 */
export async function findByMatch(match_id) {
  const [rows] = await pool.query(
    `SELECT mp.*, p.display_name, p.phone_number, p.is_captain
     FROM match_players mp
     JOIN players p ON mp.player_id = p.id
     WHERE mp.match_id = ?
     ORDER BY mp.team_id ASC, mp.rotation_slot ASC`,
    [match_id],
  );
  return rows;
}

/**
 * Get active players for one team in a specific match.
 * @param {number} match_id
 * @param {number} team_id
 * @returns {Promise<object[]>}
 */
export async function findByMatchAndTeam(match_id, team_id) {
  const [rows] = await pool.query(
    `SELECT mp.*, p.display_name, p.phone_number, p.is_captain
     FROM match_players mp
     JOIN players p ON mp.player_id = p.id
     WHERE mp.match_id = ? AND mp.team_id = ?
     ORDER BY mp.rotation_slot ASC`,
    [match_id, team_id],
  );
  return rows;
}

/**
 * Insert a single match player assignment.
 * @param {{ match_id: number, player_id: number, team_id: number, rotation_slot: number }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({ match_id, player_id, team_id, rotation_slot }) {
  const [result] = await pool.query(
    `INSERT INTO match_players (match_id, player_id, team_id, rotation_slot, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [match_id, player_id, team_id, rotation_slot],
  );
  return result.insertId;
}

/**
 * Delete all player assignments for a match (used before re-assigning).
 * @param {number} match_id
 * @returns {Promise<void>}
 */
export async function deleteByMatch(match_id) {
  await pool.query('DELETE FROM match_players WHERE match_id = ?', [match_id]);
}

/**
 * Delete assignments for one team in a match (captain override).
 * @param {number} match_id
 * @param {number} team_id
 * @returns {Promise<void>}
 */
export async function deleteByMatchAndTeam(match_id, team_id) {
  await pool.query('DELETE FROM match_players WHERE match_id = ? AND team_id = ?', [match_id, team_id]);
}
