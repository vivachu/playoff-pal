/**
 * Session guard — require a logged-in user.
 * Stores the originally requested URL in session so we can redirect after login.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
}
