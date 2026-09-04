import crypto from 'crypto';
import { env } from '../config/env.js';

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

const cookieOptions = () => ({
  httpOnly: false,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
});

export const createCsrfToken = () => crypto.randomBytes(32).toString('base64url');

export const issueCsrfToken = (res) => {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, cookieOptions());
  return token;
};

export const clearCsrfToken = (res) => {
  res.clearCookie(CSRF_COOKIE, cookieOptions());
};

export const csrfTokensMatch = (cookieToken, headerToken) => {
  if (!cookieToken || !headerToken) return false;
  const left = Buffer.from(String(cookieToken));
  const right = Buffer.from(String(headerToken));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};
