import pool from '../config/db.js';

/**
 * Find a user by primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] ?? null;
}

/**
 * Find a user by E.164 phone number.
 * @param {string} phone
 * @returns {Promise<object|null>}
 */
export async function findByPhone(phone) {
  const [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phone]);
  return rows[0] ?? null;
}

/**
 * Create a new user record.
 * @param {{ phone_number: string, first_name: string, last_name: string }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({ phone_number, first_name, last_name }) {
  const [result] = await pool.query(
    'INSERT INTO users (phone_number, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [phone_number, first_name, last_name],
  );
  return result.insertId;
}

/**
 * Update a user's first and last name.
 * @param {number} id
 * @param {{ first_name: string, last_name: string }} fields
 * @returns {Promise<void>}
 */
export async function update(id, { first_name, last_name }) {
  await pool.query(
    'UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?',
    [first_name, last_name, id],
  );
}

/**
 * Update a user's phone number.
 * @param {number} id
 * @param {string} phone_number E.164 format
 * @returns {Promise<void>}
 */
export async function updatePhone(id, phone_number) {
  await pool.query(
    'UPDATE users SET phone_number = ?, updated_at = NOW() WHERE id = ?',
    [phone_number, id],
  );
}
