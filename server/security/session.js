import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models.js';

const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(48).toString('base64url');
const randomId = (prefix) => `${prefix}_${crypto.randomBytes(12).toString('hex')}`;

const cookieBase = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/'
});

export const issueAccessToken = (res, user, sessionId) => {
  const profileComplete = Boolean(user.profile_complete ?? user.is_registered);
  const token = jwt.sign(
    {
      role: user.role,
      clientId: user.clientId || 'default_client',
      profileComplete,
      sid: sessionId
    },
    env.sessionSecret,
    {
      subject: String(user._id),
      expiresIn: `${env.accessTokenTtlMinutes}m`,
      issuer: 'wedding-platform',
      audience: 'wedding-web'
    }
  );

  res.cookie('access_token', token, {
    ...cookieBase(),
    maxAge: env.accessTokenTtlMinutes * 60 * 1000
  });
};

export const createRefreshSession = async (res, user, userAgent = '') => {
  const rawToken = randomToken();
  const familyId = randomId('family');
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    _id: randomId('session'),
    userId: user._id,
    tokenHash: hashToken(rawToken),
    familyId,
    expiresAt,
    userAgent: String(userAgent).slice(0, 300)
  });

  res.cookie('refresh_token', rawToken, {
    ...cookieBase(),
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  });

  return session;
};

export const rotateRefreshSession = async (res, rawToken, userAgent = '') => {
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const current = await Session.findOne({ tokenHash });
  if (!current || current.expiresAt <= new Date()) return null;

  if (current.revokedAt) {
    await Session.updateMany(
      { familyId: current.familyId, revokedAt: null },
      { revokedAt: new Date() }
    );
    return null;
  }

  const replacementToken = randomToken();
  const replacement = await Session.create({
    _id: randomId('session'),
    userId: current.userId,
    tokenHash: hashToken(replacementToken),
    familyId: current.familyId,
    expiresAt: current.expiresAt,
    userAgent: String(userAgent).slice(0, 300)
  });

  current.revokedAt = new Date();
  current.rotatedAt = new Date();
  current.lastUsedAt = new Date();
  await current.save();

  res.cookie('refresh_token', replacementToken, {
    ...cookieBase(),
    maxAge: Math.max(0, replacement.expiresAt.getTime() - Date.now())
  });

  return replacement;
};

export const revokeRefreshSession = async (rawToken) => {
  if (!rawToken) return;
  await Session.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { revokedAt: new Date(), lastUsedAt: new Date() }
  );
};

export const revokeSessionById = async (sessionId) => {
  if (!sessionId) return;
  await Session.updateOne(
    { _id: sessionId, revokedAt: null },
    { revokedAt: new Date(), lastUsedAt: new Date() }
  );
};

export const clearSession = (res) => {
  res.clearCookie('access_token', cookieBase());
  res.clearCookie('refresh_token', cookieBase());
};
