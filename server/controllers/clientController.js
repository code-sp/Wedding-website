import { Client, Content, User, AllowedGuest } from '../models.js';
import * as defaults from '../defaults.js';

export const getClients = async (req, res) => {
    try {
        const clients = await Client.find({});
        const clientsWithTokens = await Promise.all(clients.map(async (client) => {
            const owner = await User.findOne({ clientId: client._id, role: 'client' });
            return {
                ...client.toObject(),
                ownerToken: owner ? owner.access_code : null,
                ownerName: owner && owner.is_registered ? owner.name : null,
                isRegistered: owner ? owner.is_registered : false
            };
        }));
        res.json(clientsWithTokens);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

export const getGlobalStats = async (req, res) => {
    try {
        const { Client, RSVP, User } = await import('../models.js');
        const [clientCount, rsvpCount, userCount] = await Promise.all([
            Client.countDocuments(),
            RSVP.countDocuments(),
            User.countDocuments({ role: 'user' })
        ]);
        res.json({
            portals: clientCount,
            totalRSVPs: rsvpCount,
            totalUsers: userCount
        });
    } catch (e) {
        res.status(500).json({ portals: 0, totalRSVPs: 0, totalUsers: 0 });
    }
};

export const createClient = async (req, res) => {
    try {
        const { id, name, occasion, brideName, groomName, personName, contactDetail, address } = req.body;
        if (!id || !name) return res.status(400).json({ error: 'ID and Name required' });

        // 1. Check if exists
        const exists = await Client.exists({ _id: id });
        if (exists) return res.status(400).json({ error: 'Client ID already exists' });

        // 2. Generate Permanent CL_ Token for Client Owner (CL_ + 5 Alphanum)
        let token = '';
        let isUnique = false;
        while (!isUnique) {
            const random = Math.random().toString(36).substring(2, 7).toUpperCase();
            token = `CL_${random}`;
            const collision = await User.exists({ access_code: token });
            if (!collision) isUnique = true;
        }

        // 3. Create Client record
        const newClient = await Client.create({ 
            _id: id, 
            name,
            occasion: occasion || 'wedding',
            brideName,
            groomName,
            personName,
            contactDetail,
            address
        });

        // 4. Create Client Owner User with CL token (Registered by default)
        const owner = await User.create({
            _id: `user_${id}_owner`,
            role: 'client',
            clientId: id,
            name: personName || brideName || `${name} Owner`,
            access_code: token,
            is_registered: true
        });

        // 5. Store client details in Client Directory (Guest List) of the new portal
        await AllowedGuest.create({
             clientId: id,
             name: `${name} Owner`,
             isClaimed: true,
             claimedBy: `user_${id}_owner`
        });

        // 6. Seed Default Content for this new client
        const contentToSeed = [
            { key: 'events', value: [] },
            { key: 'gallery', value: [] },
            { key: 'stories', value: [] },
            { key: 'home_data', value: defaults.defaultHomeData },
            { key: 'contact_data', value: { 
                contactCards: [
                    { title: "Bride's Family", name: "Client Contact", phone: "+91 xxxxx xxxxx", email: "support@example.com" },
                    { title: "Groom's Family", name: "Client Contact", phone: "+91 xxxxx xxxxx", email: "support@example.com" }
                ],
                venueName: "Your Grand Venue",
                venueAddress: "City, State, 12345",
                venueMapsLink: "https://maps.google.com",
                faqs: []
            }},
            { key: 'client_settings', value: { 
                enabledTabs: ['home', 'story', 'events', 'moments', 'gallery', 'rsvp', 'contact', 'family_tree'],
                customTabs: [],
                rooms: [
                    { id: 1, name: 'Deluxe Suite', type: 'King Bed', capacity: 2, price: '$200', available: 3 },
                    { id: 2, name: 'Garden View', type: 'Queen Bed', capacity: 2, price: '$150', available: 5 },
                    { id: 3, name: 'Family Room', type: '2 Queen Beds', capacity: 4, price: '$250', available: 2 }
                ],
                seatingConfig: [
                    { id: "vip", name: "VIP Section", type: "sofa", rows: 3, colsPerSide: 9, price: 100 },
                    { id: "general", name: "General Section", type: "chair", rows: 10, colsPerSide: 10, price: 50 }
                ]
            }},
            { key: 'family_people', value: [] },
            { key: 'groom_family_people', value: [] }
        ];

        for (const item of contentToSeed) {
            await Content.create({ key: item.key, clientId: id, value: item.value });
        }

        res.json({ success: true, client: newClient, ownerToken: token });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'default_client') return res.status(403).json({ error: 'Cannot delete primary client' });

        await Client.findByIdAndDelete(id);
        await Content.deleteMany({ clientId: id });
        await User.deleteMany({ clientId: id });
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
