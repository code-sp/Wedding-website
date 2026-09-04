import crypto from 'crypto';
import { InvitationToken } from '../models.js';

const clampHours = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 72;
  return Math.min(168, Math.max(1, Math.round(parsed)));
};

export const hashInvitationToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const issueInvitationToken = async ({
  user,
  createdBy = null,
  purpose = 'invite',
  expiresInHours = 72
}) => {
  const now = new Date();
  const hours = clampHours(expiresInHours);
  const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

  await InvitationToken.updateMany(
    {
      userId: user._id,
      purpose,
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: now }
    },
    { $set: { revokedAt: now } }
  );

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const record = await InvitationToken.create({
    _id: `invite_${crypto.randomUUID()}`,
    userId: user._id,
    clientId: user.clientId || 'default_client',
    tokenHash: hashInvitationToken(rawToken),
    purpose,
    createdBy,
    expiresAt
  });

  return { rawToken, record };
};

export const redeemInvitationToken = async (rawToken) => {
  if (typeof rawToken !== 'string' || rawToken.length < 32 || rawToken.length > 256) return null;

  const now = new Date();
  return InvitationToken.findOneAndUpdate(
    {
      tokenHash: hashInvitationToken(rawToken.trim()),
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: now }
    },
    { $set: { usedAt: now } },
    { new: true }
  );
};
