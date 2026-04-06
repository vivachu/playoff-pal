import Hashids from 'hashids';

const hashids = new Hashids(
  process.env.HASHIDS_SALT || 'playoff-pal-dev',
  parseInt(process.env.HASHIDS_MIN_LENGTH, 10) || 6,
);

/**
 * Encode a numeric tournament id into a lowercase share code slug.
 * @param {number} id
 * @returns {string} 6-char lowercase alphanumeric slug
 */
export function encodeId(id) {
  return hashids.encode(id).toLowerCase();
}

/**
 * Decode a share code slug back to a numeric tournament id.
 * @param {string} code
 * @returns {number|null} Numeric id, or null if the code is invalid
 */
export function decodeCode(code) {
  const decoded = hashids.decode(code.toUpperCase());
  return decoded.length > 0 ? decoded[0] : null;
}
