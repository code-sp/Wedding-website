import crypto from 'crypto';
import { User, RSVP, AllowedGuest, Session, InvitationToken } from '../models.js';
import { issueInvitationToken } from '../security/invitation.js';

const cleanName = (value) => String(value ?? '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 100);

const generateClientAccessCode = () =>
  `CL_${crypto.randomBytes(12).toString('base64url').toUpperCase()}`;

const resolveTenant = (req) => {
  if (req.auth.role === 'admin') return String(req.body.clientId || req.query.clientId || '').trim();
  return req.auth.clientId;
};

export const createUser = async (req, res) => {
  try {
    const requestedRole = String(req.body.role || 'user');
    const role = req.auth.role === 'admin'
      ? (requestedRole === 'client' ? 'client' : 'user')
      : 'user';

    const clientId = resolveTenant(req);
    const name = cleanName(req.body.name) || 'Invited Guest';
    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const newUser = await User.create({
      _id: `user_${crypto.randomUUID()}`,
      role,
      clientId,
      name,
      is_registered: false,
      profile_complete: false
    });

    let invitation = null;
    try {
      const { rawToken, record } = await issueInvitationToken({
        user: newUser,
        createdBy: req.auth.userId,
        purpose: role === 'client' ? 'portal-invite' : 'invite',
        expiresInHours: req.body.expiresInHours
      });
      invitation = {
        token: rawToken,
        expiresAt: record.expiresAt,
        loginFragment: `/login#invite=${encodeURIComponent(rawToken)}`
      };
    } catch (error) {
      await User.deleteOne({ _id: newUser._id });
      throw error;
    }

    if (req.body.guestId) {
      await AllowedGuest.findOneAndUpdate(
        { _id: req.body.guestId, clientId },
        { isClaimed: true, claimedBy: newUser._id }
      );
    }

    return res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        clientId: newUser.clientId
      },
      ...(invitation ? { invitation } : {})
    });
  } catch (error) {
    console.error('User provisioning failed', error);
    return res.status(500).json({ error: 'Unable to create user' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const clientId = req.auth.role === 'admin'
      ? String(req.query.clientId || '').trim()
      : req.auth.clientId;

    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const users = await User.find({ clientId })
      .select('_id name role access_code is_registered profile_complete')
      .sort({ name: 1 });

    return res.json(users.map((user) => ({
      id: user._id,
      name: user.name,
      role: user.role,
      hasLegacyAccessCode: Boolean(user.access_code),
      rsvpComplete: Boolean(user.is_registered),
      profileComplete: Boolean(user.profile_complete)
    })));
  } catch (error) {
    console.error('User list failed', error);
    return res.status(500).json({ error: 'Unable to load users' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (req.auth.role !== 'admin' && target.clientId !== req.auth.clientId) {
      return res.status(403).json({ error: 'User belongs to another wedding' });
    }
    if (target.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted here' });
    }

    await Promise.all([
      RSVP.deleteMany({ userId: target._id }),
      Session.deleteMany({ userId: target._id }),
      InvitationToken.deleteMany({ userId: target._id }),
      AllowedGuest.updateMany(
        { claimedBy: target._id },
        { $set: { isClaimed: false, claimedBy: null } }
      )
    ]);
    await User.findByIdAndDelete(target._id);

    return res.json({ success: true });
  } catch (error) {
    console.error('User deletion failed', error);
    return res.status(500).json({ error: 'Unable to delete user' });
  }
};
