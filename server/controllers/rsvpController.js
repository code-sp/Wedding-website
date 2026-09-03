import crypto from 'crypto';
import { User, RSVP, AllowedGuest } from '../models.js';

const makeId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

const resolveTargetUser = async (req) => {
  if (req.auth.role === 'user') {
    return User.findById(req.auth.userId);
  }

  const requestedUserId = req.body.userId;
  if (!requestedUserId) return null;

  const user = await User.findById(requestedUserId);
  if (!user) return null;

  if (req.auth.role === 'client' && user.clientId !== req.auth.clientId) {
    return null;
  }

  return user;
};

export const submitRSVP = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'RSVP data required' });
    }

    const user = await resolveTargetUser(req);
    if (!user) return res.status(403).json({ error: 'RSVP identity could not be verified' });

    const clientId = user.clientId || req.auth.clientId || 'default_client';
    const existing = await RSVP.findOne({ userId: user._id, clientId });

    if (existing) {
      existing.data = { ...data, id: existing._id };
      existing.timestamp = new Date();
      await existing.save();
      await User.updateOne({ _id: user._id }, { is_registered: true, rsvp_data: existing.data });
      return res.json({ success: true, id: existing._id });
    }

    const newId = makeId('rsvp');
    const cleanData = { ...data, id: newId };

    await RSVP.create({
      _id: newId,
      userId: user._id,
      clientId,
      data: cleanData
    });

    await User.updateOne(
      { _id: user._id },
      { is_registered: true, rsvp_data: cleanData }
    );

    return res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('RSVP submission failed', error);
    return res.status(500).json({ error: 'Unable to save RSVP' });
  }
};

export const deleteRSVP = async (req, res) => {
  try {
    const { id } = req.params;
    const rsvp = await RSVP.findById(id);
    if (!rsvp) return res.status(404).json({ error: 'RSVP not found' });

    if (req.auth.role === 'client' && rsvp.clientId !== req.auth.clientId) {
      return res.status(403).json({ error: 'RSVP belongs to another wedding' });
    }

    await RSVP.findByIdAndDelete(id);

    if (rsvp.userId) {
      await User.updateOne(
        { _id: rsvp.userId },
        { is_registered: false, rsvp_data: null }
      );
      await AllowedGuest.updateOne(
        { claimedBy: rsvp.userId },
        { $set: { isClaimed: false, claimedBy: null } }
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('RSVP deletion failed', error);
    return res.status(500).json({ error: 'Unable to delete RSVP' });
  }
};

export const getAllRSVPs = async (req, res) => {
  try {
    const requestedClientId = req.query.clientId;
    const clientId = req.auth.role === 'admin' ? requestedClientId : req.auth.clientId;

    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const rsvps = await RSVP.find({ clientId }).populate('userId', 'name');
    const parsed = rsvps.map((rsvp) => ({
      ...rsvp.data,
      id: rsvp._id,
      userId: rsvp.userId?._id || rsvp.userId,
      _userName: rsvp.userId?.name || 'Unknown'
    }));

    return res.json(parsed);
  } catch (error) {
    console.error('RSVP list failed', error);
    return res.status(500).json({ error: 'Unable to load RSVPs' });
  }
};
