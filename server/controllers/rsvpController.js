import crypto from 'crypto';
import { User, RSVP, AllowedGuest, SeatReservation, RoomReservation } from '../models.js';
import { stageSeatReservations, stageRoomReservation } from '../services/reservationService.js';

const makeId = (prefix) => `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const cleanText = (value, max = 200) => String(value ?? '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{7,18}$/;
const MEALS = new Set(['', 'vegetarian', 'vegan', 'jain', 'non-vegetarian', 'other']);

const normalizeRSVP = (data, fallbackName, requireContact) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('RSVP data required');
    error.status = 400;
    throw error;
  }

  const attending = data.attending === 'no' || data.attendance === 'not-attending' ? 'no' : 'yes';
  const requestedGuests = Number.parseInt(data.guests ?? data.guestCount ?? 1, 10);
  const guests = attending === 'yes'
    ? Math.min(10, Math.max(1, Number.isFinite(requestedGuests) ? requestedGuests : 1))
    : 0;

  const name = cleanText(data.name || fallbackName, 100);
  const email = cleanText(data.email, 160).toLowerCase();
  const mobile = cleanText(data.mobile || data.phone, 20).replace(/[^+\d -]/g, '');
  const mealPreference = cleanText(data.mealPreference || data.dietaryPreference, 30).toLowerCase();

  if (!name) {
    const error = new Error('Guest name is required');
    error.status = 400;
    throw error;
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    const error = new Error('Invalid email address');
    error.status = 400;
    throw error;
  }
  if (mobile && !PHONE_PATTERN.test(mobile)) {
    const error = new Error('Invalid mobile number');
    error.status = 400;
    throw error;
  }
  if (requireContact && attending === 'yes' && (!email || !mobile)) {
    const error = new Error('Email and mobile are required when attending');
    error.status = 400;
    throw error;
  }
  if (!MEALS.has(mealPreference)) {
    const error = new Error('Invalid meal preference');
    error.status = 400;
    throw error;
  }

  const guestDetails = attending === 'yes'
    ? (Array.isArray(data.guestDetails) ? data.guestDetails : [])
        .slice(0, guests)
        .map((guest) => ({
          name: cleanText(guest?.name, 100),
          age: cleanText(guest?.age, 3).replace(/[^0-9]/g, ''),
          gender: cleanText(guest?.gender, 20)
        }))
    : [];

  const seatNumbers = attending === 'yes'
    ? [...new Set((Array.isArray(data.seatNumbers) ? data.seatNumbers : [])
        .map((seat) => cleanText(seat, 40))
        .filter(Boolean))]
        .slice(0, guests)
    : [];

  return {
    name,
    email,
    mobile,
    attending,
    guests,
    guestDetails,
    seatNumbers,
    accommodation: cleanText(data.accommodation, 80),
    roomNumber: cleanText(data.roomNumber, 80),
    mealPreference,
    message: cleanText(data.message, 500)
  };
};

const resolveTargetUser = async (req, data) => {
  if (req.auth.role === 'user') {
    return { user: await User.findById(req.auth.userId), created: false };
  }

  const requestedUserId = req.body.userId;
  if (requestedUserId) {
    const user = await User.findById(requestedUserId);
    if (!user) return null;
    if (req.auth.role === 'client' && user.clientId !== req.auth.clientId) return null;
    return { user, created: false };
  }

  const clientId = req.auth.role === 'admin'
    ? cleanText(req.body.clientId || req.auth.clientId || 'default_client', 120)
    : req.auth.clientId;

  if (!clientId) return null;

  const user = await User.create({
    _id: `user_manual_${crypto.randomUUID()}`,
    role: 'user',
    clientId,
    name: cleanText(data?.name, 100) || 'Manual Guest',
    profile_complete: true,
    is_registered: false
  });
  return { user, created: true };
};

export const getMyRSVP = async (req, res) => {
  try {
    if (req.auth.role !== 'user') {
      return res.json({ rsvp: null, organizer: true });
    }

    const rsvp = await RSVP.findOne({
      userId: req.auth.userId,
      clientId: req.auth.clientId || 'default_client'
    });

    return res.json({ rsvp: rsvp ? { ...rsvp.data, id: rsvp._id } : null });
  } catch (error) {
    console.error('RSVP read failed', error);
    return res.status(500).json({ error: 'Unable to load RSVP' });
  }
};

export const submitRSVP = async (req, res) => {
  let seatStage = null;
  let roomStage = null;
  let persisted = false;
  let targetUser = null;
  let createdManualUser = false;

  try {
    const resolved = await resolveTargetUser(req, req.body?.data);
    targetUser = resolved?.user || null;
    createdManualUser = Boolean(resolved?.created);
    const user = targetUser;
    if (!user) return res.status(403).json({ error: 'RSVP identity could not be verified' });

    const data = normalizeRSVP(req.body.data, user.name, req.auth.role === 'user');
    const clientId = user.clientId || req.auth.clientId || 'default_client';

    seatStage = await stageSeatReservations({
      clientId,
      userId: user._id,
      seatNumbers: data.seatNumbers
    });
    roomStage = await stageRoomReservation({
      clientId,
      userId: user._id,
      requestedRoomId: data.accommodation
    });

    if (roomStage.assignmentLabel) data.roomNumber = roomStage.assignmentLabel;
    else if (!data.accommodation || ['required', 'confirmed-elsewhere'].includes(String(data.accommodation))) data.roomNumber = '';

    const existing = await RSVP.findOne({ userId: user._id, clientId });

    if (existing) {
      existing.data = { ...data, id: existing._id };
      existing.timestamp = new Date();
      await existing.save();
      await User.updateOne({ _id: user._id }, { is_registered: true, rsvp_data: existing.data });
      persisted = true;
      await Promise.all([seatStage.finalize(), roomStage.finalize()]);
      return res.json({ success: true, id: existing._id, rsvp: existing.data });
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

    persisted = true;
    await Promise.all([seatStage.finalize(), roomStage.finalize()]);
    return res.status(201).json({ success: true, id: newId, rsvp: cleanData });
  } catch (error) {
    if (!persisted) {
      await Promise.allSettled([
        seatStage?.rollback?.(),
        roomStage?.rollback?.()
      ]);
      if (createdManualUser && targetUser?._id) {
        await User.deleteOne({ _id: targetUser._id, is_registered: false });
      }
    }
    if (error?.status) return res.status(error.status).json({ error: error.message, code: error.code });
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
      await Promise.all([
        SeatReservation.deleteMany({ clientId: rsvp.clientId, userId: rsvp.userId }),
        RoomReservation.deleteMany({ clientId: rsvp.clientId, userId: rsvp.userId })
      ]);
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
