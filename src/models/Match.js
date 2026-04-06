import pool from '../config/db.js';

/**
 * Find a match by primary key (includes team name joins).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT m.*,
       ht.name AS home_team_name, ht.status AS home_team_status,
       at.name AS away_team_name, at.status AS away_team_status,
       wt.name AS winner_team_name
     FROM matches m
     LEFT JOIN teams ht ON m.home_team_id = ht.id
     LEFT JOIN teams at ON m.away_team_id = at.id
     LEFT JOIN teams wt ON m.winner_team_id = wt.id
     WHERE m.id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * Get all matches in a tournament ordered by round then match number.
 * @param {number} tournament_id
 * @returns {Promise<object[]>}
 */
export async function findByTournament(tournament_id) {
  const [rows] = await pool.query(
    `SELECT m.*,
       ht.name AS home_team_name, ht.status AS home_team_status,
       at.name AS away_team_name, at.status AS away_team_status,
       wt.name AS winner_team_name
     FROM matches m
     LEFT JOIN teams ht ON m.home_team_id = ht.id
     LEFT JOIN teams at ON m.away_team_id = at.id
     LEFT JOIN teams wt ON m.winner_team_id = wt.id
     WHERE m.tournament_id = ?
     ORDER BY m.round_number ASC, m.match_number ASC`,
    [tournament_id],
  );
  return rows;
}

/**
 * Get all matches in a specific round of a tournament.
 * @param {number} tournament_id
 * @param {number} round_number
 * @returns {Promise<object[]>}
 */
export async function findByRound(tournament_id, round_number) {
  const [rows] = await pool.query(
    `SELECT * FROM matches
     WHERE tournament_id = ? AND round_number = ?
     ORDER BY match_number ASC`,
    [tournament_id, round_number],
  );
  return rows;
}

/**
 * Insert a new match.
 * @param {object} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({
  tournament_id, round_number, match_number,
  home_team_id, away_team_id,
  is_bye = 0, location, scheduled_start, score_report_deadline,
}) {
  const [result] = await pool.query(
    `INSERT INTO matches
      (tournament_id, round_number, match_number, home_team_id, away_team_id,
       status, is_bye, location, scheduled_start, score_report_deadline,
       referee_override, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, 0, NOW(), NOW())`,
    [
      tournament_id, round_number, match_number,
      home_team_id ?? null, away_team_id ?? null,
      is_bye, location ?? null, scheduled_start, score_report_deadline,
    ],
  );
  return result.insertId;
}

/**
 * Update match fields (location, scheduled_start).
 * @param {number} id
 * @param {{ location?: string, scheduled_start?: Date, score_report_deadline?: Date }} fields
 * @returns {Promise<void>}
 */
export async function update(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.location !== undefined)             { sets.push('location = ?');             vals.push(fields.location); }
  if (fields.scheduled_start !== undefined)      { sets.push('scheduled_start = ?');      vals.push(fields.scheduled_start); }
  if (fields.score_report_deadline !== undefined){ sets.push('score_report_deadline = ?'); vals.push(fields.score_report_deadline); }
  if (!sets.length) return;
  sets.push('updated_at = NOW()');
  vals.push(id);
  await pool.query(`UPDATE matches SET ${sets.join(', ')} WHERE id = ?`, vals);
}

/**
 * Transition a match status.
 * @param {number} id
 * @param {'scheduled'|'active'|'completed'|'disputed'} status
 * @returns {Promise<void>}
 */
export async function updateStatus(id, status) {
  await pool.query('UPDATE matches SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
}

/**
 * Set the winning team for a match and mark it completed.
 * @param {number} id
 * @param {number} winner_team_id
 * @param {boolean} [refereeOverride=false]
 * @returns {Promise<void>}
 */
export async function setWinner(id, winner_team_id, refereeOverride = false) {
  await pool.query(
    `UPDATE matches SET winner_team_id = ?, status = 'completed', referee_override = ?, updated_at = NOW()
     WHERE id = ?`,
    [winner_team_id, refereeOverride ? 1 : 0, id],
  );
}

/**
 * Assign home and away teams to a match (used when advancing winners to later rounds).
 * @param {number} id
 * @param {{ home_team_id?: number, away_team_id?: number }} fields
 * @returns {Promise<void>}
 */
export async function assignTeams(id, { home_team_id, away_team_id }) {
  const sets = [];
  const vals = [];
  if (home_team_id !== undefined) { sets.push('home_team_id = ?'); vals.push(home_team_id); }
  if (away_team_id !== undefined) { sets.push('away_team_id = ?'); vals.push(away_team_id); }
  if (!sets.length) return;
  sets.push('updated_at = NOW()');
  vals.push(id);
  await pool.query(`UPDATE matches SET ${sets.join(', ')} WHERE id = ?`, vals);
}
