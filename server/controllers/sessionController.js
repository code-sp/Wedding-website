import { User } from '../models.js';
import { issueAccessToken, clearSession } from '../security/session.js';

export const sessionLogin = async (req, res) => {
  try {
    const { code, clientId = 'default_client' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Access code required' });
    }

    const user = await User.findOne({ access_code: code.trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role !== 'admin' && user.clientId && clientId !== 'default_client' && user.clientId !== clientId) {
      return res.status(403).json({ error: 'Account does not belong to this wedding' });
    }

    issueAccessToken(res, user);
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        clientId: user.clientId || 'default_client',
        isProfileComplete: Boolean(user.is_registered)
      }
    });
  } catch (error) {
    console.error('Session login failed', error);
    return res.status(500).json({ error: 'Unable to create session' });
  }
};

export const getSession = async (req, res) => {
  const user = await User.findById(req.auth.userId).select('_id name role clientId is_registered');
  if (!user) return res.status(401).json({ error: 'Session user no longer exists' });

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      clientId: user.clientId || 'default_client',
      isProfileComplete: Boolean(user.is_registered)
    }
  });
};

export const sessionLogout = async (_req, res) => {
  clearSession(res);
  return res.status(204).end();
};
