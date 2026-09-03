import { User } from '../models.js';
import {
  issueAccessToken,
  createRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
  clearSession
} from '../security/session.js';

const toSessionUser = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  clientId: user.clientId || 'default_client',
  isProfileComplete: Boolean(user.profile_complete ?? user.is_registered)
});

export const sessionLogin = async (req, res) => {
  try {
    const { code, clientId = 'default_client' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Access code required' });
    }

    const normalizedCode = code.trim();
    if (normalizedCode.length < 6 || normalizedCode.length > 128) {
      return res.status(400).json({ error: 'Invalid credential format' });
    }

    const user = await User.findOne({ access_code: normalizedCode });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role !== 'admin' && user.clientId && clientId !== 'default_client' && user.clientId !== clientId) {
      return res.status(403).json({ error: 'Account does not belong to this wedding' });
    }

    issueAccessToken(res, user);
    await createRefreshSession(res, user, req.get('user-agent') || '');
    return res.json({ user: toSessionUser(user) });
  } catch (error) {
    console.error('Session login failed', error);
    return res.status(500).json({ error: 'Unable to create session' });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const rotated = await rotateRefreshSession(
      res,
      req.cookies?.refresh_token,
      req.get('user-agent') || ''
    );
    if (!rotated) {
      clearSession(res);
      return res.status(401).json({ error: 'Refresh session expired or invalid' });
    }

    const user = await User.findById(rotated.userId);
    if (!user) {
      clearSession(res);
      return res.status(401).json({ error: 'Session user no longer exists' });
    }

    issueAccessToken(res, user);
    return res.json({ user: toSessionUser(user) });
  } catch (error) {
    console.error('Session refresh failed', error);
    clearSession(res);
    return res.status(401).json({ error: 'Unable to refresh session' });
  }
};

export const getSession = async (req, res) => {
  const user = await User.findById(req.auth.userId)
    .select('_id name role clientId is_registered profile_complete');
  if (!user) return res.status(401).json({ error: 'Session user no longer exists' });

  return res.json({ user: toSessionUser(user) });
};

export const sessionLogout = async (req, res) => {
  await revokeRefreshSession(req.cookies?.refresh_token);
  clearSession(res);
  return res.status(204).end();
};
