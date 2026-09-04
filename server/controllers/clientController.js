import crypto from 'crypto';
import {
  Client,
  Content,
  User,
  AllowedGuest,
  RSVP,
  Session,
  InvitationToken,
  Asset,
  SeatReservation,
  RoomReservation
} from '../models.js';
import * as defaults from '../defaults.js';
import { issueInvitationToken } from '../security/invitation.js';

const cleanText = (value, max = 120) => String(value ?? '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const cleanClientId = (value) => cleanText(value, 80)
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^[-_]+|[-_]+$/g, '');

export const getClients = async (_req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    const owners = await User.find({
      clientId: { $in: clients.map((client) => client._id) },
      role: 'client'
    }).select('_id clientId name is_registered profile_complete access_code');

    const ownerByClient = new Map(owners.map((owner) => [owner.clientId, owner]));

    return res.json(clients.map((client) => {
      const owner = ownerByClient.get(client._id);
      return {
        ...client.toObject(),
        ownerId: owner?._id || null,
        ownerName: owner?.name || null,
        isRegistered: Boolean(owner?.is_registered),
        profileComplete: Boolean(owner?.profile_complete),
        hasLegacyCredential: Boolean(owner?.access_code)
      };
    }));
  } catch (error) {
    console.error('Client list failed', error);
    return res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const getGlobalStats = async (_req, res) => {
  try {
    const [clientCount, rsvpCount, userCount] = await Promise.all([
      Client.countDocuments(),
      RSVP.countDocuments(),
      User.countDocuments({ role: 'user' })
    ]);
    return res.json({
      portals: clientCount,
      totalRSVPs: rsvpCount,
      totalUsers: userCount
    });
  } catch {
    return res.status(500).json({ portals: 0, totalRSVPs: 0, totalUsers: 0 });
  }
};

export const createClient = async (req, res) => {
  let clientId = '';
  try {
    clientId = cleanClientId(req.body.id);
    const name = cleanText(req.body.name, 120);
    if (!clientId || !name) return res.status(400).json({ error: 'Valid ID and name are required' });
    if (clientId === 'default_client') return res.status(409).json({ error: 'Reserved client ID' });

    const exists = await Client.exists({ _id: clientId });
    if (exists) return res.status(409).json({ error: 'Client ID already exists' });

    const newClient = await Client.create({
      _id: clientId,
      name,
      occasion: cleanText(req.body.occasion, 40) || 'wedding',
      brideName: cleanText(req.body.brideName, 100),
      groomName: cleanText(req.body.groomName, 100),
      personName: cleanText(req.body.personName, 100),
      contactDetail: cleanText(req.body.contactDetail, 160),
      address: cleanText(req.body.address, 300)
    });

    const owner = await User.create({
      _id: `user_${crypto.randomUUID()}`,
      role: 'client',
      clientId,
      name: cleanText(req.body.personName || req.body.brideName, 100) || `${name} Organiser`,
      is_registered: false,
      profile_complete: false
    });

    const { rawToken, record } = await issueInvitationToken({
      user: owner,
      createdBy: req.auth.userId,
      purpose: 'portal-invite',
      expiresInHours: req.body.expiresInHours || 72
    });

    await AllowedGuest.create({
      clientId,
      name: owner.name,
      isClaimed: true,
      claimedBy: owner._id
    });

    const contentToSeed = [
      { key: 'events', value: [] },
      { key: 'gallery', value: [] },
      { key: 'moments', value: [] },
      { key: 'stories', value: [] },
      { key: 'home_data', value: defaults.defaultHomeData },
      { key: 'contact_data', value: {
        contactCards: [
          { title: "Bride's Family", name: 'Client Contact', phone: '', email: '' },
          { title: "Groom's Family", name: 'Client Contact', phone: '', email: '' }
        ],
        venueName: 'Your Venue',
        venueAddress: '',
        venueMapsLink: '',
        faqs: []
      }},
      { key: 'client_settings', value: {
        enabledTabs: ['home', 'story', 'events', 'moments', 'gallery', 'rsvp', 'contact', 'family_tree'],
        customTabs: [],
        rooms: [],
        seatingConfig: []
      }},
      { key: 'family_people', value: [] },
      { key: 'family_families', value: [] },
      { key: 'family_links', value: [] },
      { key: 'groom_family_people', value: [] },
      { key: 'groom_family_families', value: [] },
      { key: 'groom_family_links', value: [] }
    ];

    await Content.insertMany(contentToSeed.map((item) => ({
      ...item,
      clientId
    })));

    return res.status(201).json({
      success: true,
      client: newClient,
      owner: {
        id: owner._id,
        name: owner.name
      },
      ownerInvitation: {
        token: rawToken,
        expiresAt: record.expiresAt,
        loginFragment: `/login#invite=${encodeURIComponent(rawToken)}`
      }
    });
  } catch (error) {
    console.error('Client creation failed', error);

    if (clientId) {
      const rollbackUsers = await User.find({ clientId }).select('_id');
      const rollbackUserIds = rollbackUsers.map((user) => user._id);
      await Promise.allSettled([
        Client.deleteOne({ _id: clientId }),
        Content.deleteMany({ clientId }),
        AllowedGuest.deleteMany({ clientId }),
        RSVP.deleteMany({ clientId }),
        Session.deleteMany({ userId: { $in: rollbackUserIds } }),
        InvitationToken.deleteMany({ clientId }),
        Asset.deleteMany({ clientId }),
        SeatReservation.deleteMany({ clientId }),
        RoomReservation.deleteMany({ clientId }),
        User.deleteMany({ clientId })
      ]);
    }

    return res.status(500).json({ error: 'Failed to create client' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const clientId = cleanClientId(req.params.id);
    if (!clientId) return res.status(400).json({ error: 'Invalid client ID' });
    if (clientId === 'default_client') {
      return res.status(403).json({ error: 'Cannot delete primary client' });
    }

    const exists = await Client.exists({ _id: clientId });
    if (!exists) return res.status(404).json({ error: 'Client not found' });

    const users = await User.find({ clientId }).select('_id');
    const userIds = users.map((user) => user._id);

    await Promise.all([
      Content.deleteMany({ clientId }),
      RSVP.deleteMany({ clientId }),
      AllowedGuest.deleteMany({ clientId }),
      InvitationToken.deleteMany({ clientId }),
      Asset.deleteMany({ clientId }),
      SeatReservation.deleteMany({ clientId }),
      RoomReservation.deleteMany({ clientId }),
      Session.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ clientId })
    ]);
    await Client.deleteOne({ _id: clientId });

    return res.json({ success: true });
  } catch (error) {
    console.error('Client deletion failed', error);
    return res.status(500).json({ error: 'Failed to delete client' });
  }
};
