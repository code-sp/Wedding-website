import { CSRF_COOKIE, CSRF_HEADER, csrfTokensMatch } from '../security/csrf.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = new Set(['/api/session/login']);

export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method) || EXEMPT_PATHS.has(req.path)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'CSRF validation failed', code: 'CSRF_INVALID' });
  }

  return next();
};
