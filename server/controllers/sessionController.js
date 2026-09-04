import { User } from '../models.js';
import {
  issueAccessToken,
  createRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
  revokeSessionById,
  clearSession
} from '../security/session.js';
import { issueCsrfToken, clearCsrfToken } from '../security/csrf.js';

const toSessionUser = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  clientId: user.clientId || 'default_client',
  isProfileComplete: Boolean(user.profile_complete ?? user.is_registered),
  isRegistered: Boolean(user.is_registered),
  rsvpData: user.rsvp_data || null
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

    let user = await User.findOne({ access_code: normalizedCode });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role !== 'admin' && user.clientId && clientId !== 'default_client' && user.clientId !== clientId) {
      return res.status(403).json({ error: 'Account does not belong to this wedding' });
    }

    // Migration fallback: old guest codes are consumed atomically on first successful use.
    if (user.role === 'user') {
      user = await User.findOneAndUpdate(
        { _id: user._id, access_code: normalizedCode },
        { $unset: { access_code: 1, old_access_code: 1 } },
        { new: true }
      );
      if (!user) return res.status(401).json({ error: 'Invitation code has already been used' });
    }

    const session = await createRefreshSession(res, user, req.get('user-agent') || '');
    issueAccessToken(res, user, session._id);
    issueCsrfToken(res);

    // The first successful use of a legacy organiser credential retires it.
    if (user.role === 'client' && user.access_code) {
      await User.updateOne({ _id: user._id }, { $unset: { access_code: 1, old_access_code: 1 } });
    }

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
      clearCsrfToken(res);
      return res.status(401).json({ error: 'Refresh session expired or invalid' });
    }

    const user = await User.findById(rotated.userId);
    if (!user) {
      clearSession(res);
      clearCsrfToken(res);
      return res.status(401).json({ error: 'Session user no longer exists' });
    }

    issueAccessToken(res, user, rotated._id);
    issueCsrfToken(res);
    return res.json({ user: toSessionUser(user) });
  } catch (error) {
    console.error('Session refresh failed', error);
    clearSession(res);
    clearCsrfToken(res);
    return res.status(401).json({ error: 'Unable to refresh session' });
  }
};

export const getSession = async (req, res) => {
  const user = await User.findById(req.auth.userId)
    .select('_id name role clientId is_registered profile_complete rsvp_data');
  if (!user) return res.status(401).json({ error: 'Session user no longer exists' });

  if (!req.cookies?.csrf_token) issueCsrfToken(res);
  return res.json({ user: toSessionUser(user) });
};

export const sessionLogout = async (req, res) => {
  await Promise.all([
    revokeRefreshSession(req.cookies?.refresh_token),
    revokeSessionById(req.auth?.sessionId)
  ]);
  clearSession(res);
  clearCsrfToken(res);
  return res.status(204).end();
};
