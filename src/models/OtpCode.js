import pool from '../config/db.js';

/**
 * Create a new OTP code record.
 * @param {{ user_id: number, code: string, expires_at: Date }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({ user_id, code, expires_at }) {
  const [result] = await pool.query(
    'INSERT INTO otp_codes (user_id, code, expires_at, used, attempts, created_at) VALUES (?, ?, ?, 0, 0, NOW())',
    [user_id, code, expires_at],
  );
  return result.insertId;
}

/**
 * Find the most recent unused, unexpired OTP for a user.
 * @param {number} user_id
 * @returns {Promise<object|null>}
 */
export async function findLatestByUserId(user_id) {
  const [rows] = await pool.query(
    'SELECT * FROM otp_codes WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [user_id],
  );
  return rows[0] ?? null;
}

/**
 * Mark an OTP code as consumed.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function markUsed(id) {
  await pool.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [id]);
}

/**
 * Increment the failed-attempt counter for an OTP code.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function incrementAttempts(id) {
  await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [id]);
}

/**
 * Count OTP codes sent for a user since a given date (rate-limit check).
 * @param {number} user_id
 * @param {Date} since
 * @returns {Promise<number>}
 */
export async function countSentSince(user_id, since) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM otp_codes WHERE user_id = ? AND created_at >= ?',
    [user_id, since],
  );
  return rows[0].cnt;
}
