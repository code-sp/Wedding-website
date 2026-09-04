import mongoose from 'mongoose';

const GuestProfileSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  relationToCouple: { type: String, trim: true },
  dietaryPreference: {
    type: String,
    enum: ['vegetarian', 'vegan', 'jain', 'non-vegetarian', 'other', ''],
    default: ''
  },
  phone: { type: String, trim: true }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  _id: String,
  role: { type: String, enum: ['admin', 'client', 'user'], default: 'user' },
  clientId: { type: String, default: 'default_client', index: true },
  name: { type: String, trim: true },
  access_code: { type: String, unique: true, sparse: true },
  old_access_code: { type: String, default: null },
  is_registered: { type: Boolean, default: false },
  profile_complete: { type: Boolean, default: false },
  profile: { type: GuestProfileSchema, default: () => ({}) },
  rsvp_data: { type: Object, default: null }
}, { _id: false, timestamps: true });

const SessionSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
  rotatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  userAgent: { type: String, default: '' }
}, { _id: false });

const InvitationTokenSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, ref: 'User', required: true, index: true },
  clientId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ['invite', 'magic_link', 'portal-invite'], default: 'invite' },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null }
}, { _id: false });
InvitationTokenSchema.index({ userId: 1, purpose: 1, revokedAt: 1, usedAt: 1 });

const RSVPSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, ref: 'User', required: true, index: true },
  clientId: { type: String, required: true, default: 'default_client', index: true },
  data: Object,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });
RSVPSchema.index({ userId: 1, clientId: 1 }, { unique: true });

const SeatReservationSchema = new mongoose.Schema({
  _id: String,
  clientId: { type: String, required: true, index: true },
  userId: { type: String, ref: 'User', required: true, index: true },
  seatNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
SeatReservationSchema.index({ clientId: 1, seatNumber: 1 }, { unique: true });
SeatReservationSchema.index({ clientId: 1, userId: 1 });

const RoomReservationSchema = new mongoose.Schema({
  _id: String,
  clientId: { type: String, required: true, index: true },
  userId: { type: String, ref: 'User', required: true, index: true },
  roomId: { type: String, required: true },
  slot: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });
RoomReservationSchema.index({ clientId: 1, userId: 1 }, { unique: true });
RoomReservationSchema.index({ clientId: 1, roomId: 1, slot: 1 }, { unique: true });

const ClientSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  occasion: { type: String, default: 'wedding' },
  brideName: String,
  groomName: String,
  personName: String,
  contactDetail: String,
  address: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const AssetSchema = new mongoose.Schema({
  _id: String,
  clientId: { type: String, required: true, index: true },
  uploadedBy: { type: String, ref: 'User', required: true, index: true },
  mimeType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  key: { type: String, required: true },
  clientId: { type: String, required: true, default: 'default_client' },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});
ContentSchema.index({ key: 1, clientId: 1 }, { unique: true });

const AllowedGuestSchema = new mongoose.Schema({
  clientId: { type: String, required: true, default: 'default_client', index: true },
  name: { type: String, required: true, trim: true },
  isClaimed: { type: Boolean, default: false },
  claimedBy: { type: String, default: null }
});
AllowedGuestSchema.index({ clientId: 1, name: 1 });

export const User = mongoose.model('User', UserSchema);
export const Session = mongoose.model('Session', SessionSchema);
export const InvitationToken = mongoose.model('InvitationToken', InvitationTokenSchema);
export const RSVP = mongoose.model('RSVP', RSVPSchema);
export const SeatReservation = mongoose.model('SeatReservation', SeatReservationSchema);
export const RoomReservation = mongoose.model('RoomReservation', RoomReservationSchema);
export const Asset = mongoose.model('Asset', AssetSchema);
export const Content = mongoose.model('Content', ContentSchema);
export const AllowedGuest = mongoose.model('AllowedGuest', AllowedGuestSchema);
export const Client = mongoose.model('Client', ClientSchema);
