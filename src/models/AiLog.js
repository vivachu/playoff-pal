import pool from '../config/db.js';

/**
 * Insert a new AI call log entry.
 * @param {{ user_id: number|null, task_type: string, prompt: string, response: string, model: string, input_tokens: number, output_tokens: number }} fields
 * @returns {Promise<number>} Inserted row id
 */
export async function create({
  user_id, task_type, prompt, response, model, input_tokens, output_tokens,
}) {
  const [result] = await pool.query(
    `INSERT INTO ai_logs
      (user_id, task_type, prompt, response, model, input_tokens, output_tokens, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [user_id ?? null, task_type, prompt, response, model, input_tokens, output_tokens],
  );
  return result.insertId;
}
