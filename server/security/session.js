import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const issueAccessToken = (res, user) => {
  const profileComplete = Boolean(user.profile_complete ?? user.is_registered);
  const token = jwt.sign(
    {
      role: user.role,
      clientId: user.clientId || 'default_client',
      profileComplete
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
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: env.accessTokenTtlMinutes * 60 * 1000,
    path: '/'
  });
};

export const clearSession = (res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/'
  });
};
