import { User } from '../models.js';
import { issueInvitationToken, redeemInvitationToken } from '../security/invitation.js';
import { createRefreshSession, issueAccessToken } from '../security/session.js';
import { issueCsrfToken } from '../security/csrf.js';

const toSessionUser = (user) => ({
  id: user._id,
  name: user.name,
  role: user.role,
  clientId: user.clientId || 'default_client',
  isProfileComplete: Boolean(user.profile_complete ?? user.is_registered),
  isRegistered: Boolean(user.is_registered),
  rsvpData: user.rsvp_data || null
});

export const createInvitation = async (req, res) => {
  try {
    const userId = String(req.body.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await User.findById(userId);
    if (!user || !['user', 'client'].includes(user.role)) {
      return res.status(404).json({ error: 'Invitable account not found' });
    }

    if (req.auth.role === 'client' && (user.role !== 'user' || user.clientId !== req.auth.clientId)) {
      return res.status(403).json({ error: 'Account cannot be invited by this organiser' });
    }

    const purpose = user.role === 'client' ? 'portal-invite' : 'invite';
    const { rawToken, record } = await issueInvitationToken({
      user,
      createdBy: req.auth.userId,
      purpose,
      expiresInHours: req.body.expiresInHours
    });

    return res.status(201).json({
      invitation: {
        token: rawToken,
        expiresAt: record.expiresAt,
        loginFragment: `/login#invite=${encodeURIComponent(rawToken)}`
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create invitation' });
  }
};

export const exchangeInvitation = async (req, res) => {
  try {
    const record = await redeemInvitationToken(req.body?.token);
    if (!record) {
      return res.status(401).json({ error: 'Invitation expired, already used, or invalid' });
    }

    const user = await User.findById(record.userId);
    if (!user || !['user', 'client'].includes(user.role) || user.clientId !== record.clientId) {
      return res.status(401).json({ error: 'Invitation account is no longer available' });
    }

    const session = await createRefreshSession(res, user, req.get('user-agent') || '');
    issueAccessToken(res, user, session._id);
    issueCsrfToken(res);

    // Invitation exchange retires any reusable legacy credential for the account.
    await User.updateOne(
      { _id: user._id },
      { $unset: { access_code: 1, old_access_code: 1 } }
    );

    return res.json({ user: toSessionUser(user) });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to exchange invitation' });
  }
};
