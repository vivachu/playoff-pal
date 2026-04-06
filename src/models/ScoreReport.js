import pool from '../config/db.js';

/**
 * Get all score reports for a match.
 * @param {number} match_id
 * @returns {Promise<object[]>}
 */
export async function findByMatch(match_id) {
  const [rows] = await pool.query(
    'SELECT * FROM score_reports WHERE match_id = ? ORDER BY created_at ASC',
    [match_id],
  );
  return rows;
}

/**
 * Get the score report submitted by a specific team for a match (at most one per team).
 * @param {number} match_id
 * @param {number} reporting_team_id
 * @returns {Promise<object|null>}
 */
export async function findByMatchAndTeam(match_id, reporting_team_id) {
  const [rows] = await pool.query(
    'SELECT * FROM score_reports WHERE match_id = ? AND reporting_team_id = ? LIMIT 1',
    [match_id, reporting_team_id],
  );
  return rows[0] ?? null;
}

/**
 * Insert a new score report.
 * @param {{ match_id: number, reporting_team_id: number, reported_by_user_id: number, home_score: number, away_score: number, reported_winner_team_id: number }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({
  match_id, reporting_team_id, reported_by_user_id,
  home_score, away_score, reported_winner_team_id,
}) {
  const [result] = await pool.query(
    `INSERT INTO score_reports
      (match_id, reporting_team_id, reported_by_user_id,
       home_score, away_score, reported_winner_team_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [match_id, reporting_team_id, reported_by_user_id,
     home_score, away_score, reported_winner_team_id],
  );
  return result.insertId;
}
