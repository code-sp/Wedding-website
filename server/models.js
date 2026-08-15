import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    _id: String, // Custom ID to match 'admin', 'user_01'
    role: { type: String, default: 'user' }, // admin, client, user
    clientId: { type: String, default: 'default_client' }, // "default_client" or "all"
    name: String,
    access_code: { type: String, unique: true },
    old_access_code: { type: String, default: null },
    is_registered: { type: Boolean, default: false },
    rsvp_data: { type: Object, default: null } // JSON blob equivalent
}, { _id: false }); // We handle _id manually to match existing strings

// RSVP Schema
const RSVPSchema = new mongoose.Schema({
    _id: String, // "rsvp_timestamp"
    userId: { type: String, ref: 'User' },
    clientId: { type: String, required: true, default: 'default_client' }, // Direct link to client
    data: Object, // The full form data
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Client Schema (Multi-Portals)
const ClientSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    occasion: { type: String, default: 'wedding' },
    brideName: { type: String },
    groomName: { type: String },
    personName: { type: String },
    contactDetail: { type: String },
    address: { type: String },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Content Schema (Multi-Tenant Key-Value Store)
const ContentSchema = new mongoose.Schema({
    key: { type: String, required: true }, // e.g., 'home', 'events'
    clientId: { type: String, required: true, default: 'default_client' },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
});

// Compound index for multi-tenancy
ContentSchema.index({ key: 1, clientId: 1 }, { unique: true });

const AllowedGuestSchema = new mongoose.Schema({
    clientId: { type: String, required: true, default: 'default_client' },
    name: { type: String, required: true },
    isClaimed: { type: Boolean, default: false },
    claimedBy: { type: String, default: null } // User ID
});

export const User = mongoose.model('User', UserSchema);
export const RSVP = mongoose.model('RSVP', RSVPSchema);
export const Content = mongoose.model('Content', ContentSchema);
export const AllowedGuest = mongoose.model('AllowedGuest', AllowedGuestSchema);
export const Client = mongoose.model('Client', ClientSchema);
