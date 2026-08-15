import { User, RSVP, AllowedGuest } from '../models.js';

export const submitRSVP = async (req, res) => {
    try {
        let { userId, data, accessToken, clientId } = req.body;

        // Lookup User by Token if needed
        if (!userId && accessToken) {
            const user = await User.findOne({ access_code: accessToken });
            if (user) userId = user._id;
        }

        if (!userId || !data) return res.status(400).json({ error: 'Missing data or invalid token' });

        // Upsert RSVP
        const existing = await RSVP.findOne({ userId });

        if (existing) {
            existing.data = { ...data, id: existing._id }; // Ensure ID consistency
            existing.clientId = clientId || existing.clientId || 'default_client';
            existing.timestamp = new Date();
            await existing.save();
            res.json({ success: true, id: existing._id });
        } else {
            const newId = `rsvp_${Date.now()}`;
            
            // Upgrade temporary guest token to permanent code (SP_ + 6 Alphanum)
            let finalAccessCode = undefined;
            const userDoc = await User.findById(userId);
            if (userDoc && userDoc.access_code && (userDoc.access_code.startsWith('REQ') || userDoc.access_code.startsWith('guest_'))) {
                finalAccessCode = 'SP_' + Math.random().toString(36).substring(2, 8).toUpperCase();
                await User.updateOne({ _id: userId }, { 
                    is_registered: true, 
                    access_code: finalAccessCode,
                    old_access_code: userDoc.access_code 
                });
                data.accessToken = finalAccessCode; // Sync RSVP payload
            } else {
                await User.updateOne({ _id: userId }, { is_registered: true });
            }

            const cleanData = { ...data, id: newId };

            await RSVP.create({
                _id: newId,
                userId,
                clientId: clientId || userDoc?.clientId || 'default_client',
                data: cleanData
            });

            res.json({ success: true, id: newId, newAccessCode: finalAccessCode });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const deleteRSVP = async (req, res) => {
    try {
        const { id } = req.params;
        const rsvp = await RSVP.findById(id);

        if (rsvp) {
            // Cleanup User and AllowedGuest
            if (rsvp.userId) {
                const user = await User.findById(rsvp.userId);
                if (user) {
                    await AllowedGuest.updateOne(
                        { claimedBy: user._id },
                        { $set: { isClaimed: false, claimedBy: null } }
                    );
                    await User.findByIdAndDelete(rsvp.userId);
                }
            }
            await RSVP.findByIdAndDelete(id);
        }

        // Also try to find by User ID just in case the ID passed was a User ID (fallback)
        const user = await User.findById(id);
        if (user) {
            await RSVP.findOneAndDelete({ userId: id });
            await AllowedGuest.updateOne(
                { claimedBy: id },
                { $set: { isClaimed: false, claimedBy: null } }
            );
            await User.findByIdAndDelete(id);
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Delete failed", e);
        res.status(500).json({ error: 'Delete failed' });
    }
};

export const getAllRSVPs = async (req, res) => {
    try {
        const { clientId } = req.query;
        if (!clientId) return res.status(400).json({ error: 'clientId required' });
        const query = { clientId };
        
        // Populate User details
        const rsvps = await RSVP.find(query).populate('userId', 'name access_code');

        const parsed = rsvps.map(r => {
            return {
                ...r.data,
                id: r._id, // Enforce correct ID
                userId: r.userId?._id || r.userId, // Return User ID for updates
                _userName: r.userId?.name || 'Unknown',
                _code: r.userId?.access_code || '-'
            };
        });

        res.json(parsed);
    } catch (e) {
        console.error(e);
        res.status(500).json([]);
    }
};
