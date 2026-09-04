import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models.js';

export const authenticate = async (req, res, next) => {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, env.sessionSecret, {
      issuer: 'wedding-platform',
      audience: 'wedding-web'
    });

    if (!payload.sid) return res.status(401).json({ error: 'Session binding missing' });

    const session = await Session.findOne({
      _id: payload.sid,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).select('_id userId');

    if (!session) return res.status(401).json({ error: 'Session revoked or expired' });

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      role: payload.role,
      clientId: payload.clientId,
      profileComplete: Boolean(payload.profileComplete)
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

export const requireProfileComplete = (req, res, next) => {
  if (!req.auth?.profileComplete) {
    return res.status(428).json({ error: 'Profile completion required', code: 'PROFILE_INCOMPLETE' });
  }
  next();
};
