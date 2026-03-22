/**
 * Global Express error handler middleware.
 * Must be mounted last (after all routes).
 *
 * @param {Error} err - Error object; may include .status and .code properties
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  res.status(status).json({
    success: false,
    error: message,
    code,
  });
}
