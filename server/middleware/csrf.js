const crypto = require('crypto');

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADERS = ['x-xsrf-token', 'x-csrf-token'];

/** POST bodies that must work before any GET (no CSRF cookie yet). */
const CSRF_EXEMPT_PATHS = new Set(['/api/auth/login', '/api/auth/register']);

function pathKey(req) {
  return req.originalUrl.split('?')[0];
}

/**
 * On GET/HEAD to /api, ensure a readable CSRF cookie exists so the SPA can echo it on writes.
 */
function ensureCsrfCookie(req, res, next) {
  const m = req.method?.toUpperCase();
  if (m !== 'GET' && m !== 'HEAD') return next();
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 * 1000,
    });
  }
  next();
}

/**
 * Double-submit cookie CSRF check for mutating requests (cookie + matching header).
 */
function verifyCsrf(req, res, next) {
  const m = req.method?.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return next();

  const p = pathKey(req);
  if (m === 'POST' && CSRF_EXEMPT_PATHS.has(p)) return next();

  const cookie = req.cookies?.[CSRF_COOKIE];
  let header = '';
  for (const h of CSRF_HEADERS) {
    const v = req.get(h);
    if (v) {
      header = v.trim();
      break;
    }
  }

  if (!cookie || !header || header !== cookie) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }
  next();
}

module.exports = {
  CSRF_COOKIE,
  ensureCsrfCookie,
  verifyCsrf,
};
