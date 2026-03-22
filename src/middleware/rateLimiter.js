/** @type {Map<string, number[]>} phone number → array of request timestamps */
const otpRequests = new Map();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = 5;

/**
 * Rate limiter for OTP send endpoint.
 * Allows max 5 requests per phone number per hour.
 *
 * @param {import('express').Request} req - expects req.body.phone_number
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function otpRateLimiter(req, res, next) {
  const phone = req.body.phone_number;
  const now = Date.now();

  const timestamps = (otpRequests.get(phone) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= LIMIT) {
    return res.status(429).json({
      success: false,
      error: 'Too many OTP requests. Try again in 1 hour.',
      code: 'OTP_RATE_LIMITED',
    });
  }

  timestamps.push(now);
  otpRequests.set(phone, timestamps);
  next();
}
