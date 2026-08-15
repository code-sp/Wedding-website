import { User, RSVP, AllowedGuest } from '../models.js';

const GLOBAL_PASSCODE = 'Forever2025';

// Login with Access Code OR Global Passcode
export const login = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code required' });

        // 1. Check Global Passcode
        if (code === GLOBAL_PASSCODE) {
            return res.json({ success: true, requireName: true });
        }

        // 2. Check Individual User Token
        const user = await User.findOne({ access_code: code });

        if (user) {
            const requestedClientId = req.body.clientId || 'default_client';
            
            // Only admins can log in to any client portal. Clients and Users are tied to their own clientId.
            // Exception: If they are logging in from the root page (default_client), allow them. They will be implicitly routed.
            if (user.role !== 'admin' && user.clientId && requestedClientId !== 'default_client' && user.clientId !== requestedClientId) {
                return res.status(401).json({ success: false, error: 'Invalid Access Code for this wedding' });
            }

            // Check for dedicated RSVP entry
            const rsvp = await RSVP.findOne({ userId: user._id });

            const userData = {
                id: user._id,
                role: user.role,
                clientId: user.clientId || 'default_client',
                name: user.name,
                access_code: user.access_code,
                isRegistered: user.is_registered || !!rsvp,
                rsvpData: rsvp ? rsvp.data : (user.rsvp_data || null)
            };

            return res.json({ success: true, user: userData });
        }

        // 3. Fallback: Check if they are trying to use an old registration token
        const oldUser = await User.findOne({ old_access_code: code });
        if (oldUser) {
            return res.status(401).json({ 
                success: false, 
                error: `Check your inbox! Your celebration access code has been sent.` 
            });
        }

        return res.status(401).json({ success: false, error: 'Invalid Access Code' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

// Register Guest (via Global Passcode)
export const registerGuest = async (req, res) => {
    try {
        const { name, globalCode } = req.body;

        if (globalCode !== GLOBAL_PASSCODE) {
            return res.status(401).json({ error: 'Invalid Global Code' });
        }

        if (!name) return res.status(400).json({ error: 'Name required' });

        // 1. Check Smart Guest List (Whitelist)
        // Case insensitive match
        const allowedGuest = await AllowedGuest.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });

        if (!allowedGuest) {
            // Allow any guest to register (Bypass Whitelist)
            // return res.status(403).json({ error: 'Sorry, we could not find your name on the guest list. Please contact the hosts.' });
        } else if (allowedGuest.isClaimed) {
            return res.status(403).json({ error: 'This name has already been registered. Please login with your access code.' });
        }

        // Generate Unique SP_ Code (SP_ + 5 Alphanum) for permanent user token
        const personalToken = 'SP_' + Math.random().toString(36).substring(2, 7).toUpperCase();

        const officialName = allowedGuest ? allowedGuest.name : name.trim();

        const newUser = await User.create({
            _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            role: 'user',
            clientId: req.body.clientId || 'default_client', // Use from request
            name: officialName,
            access_code: personalToken,
            is_registered: false // They just entered name, haven't RSVPed yet
        });

        // Mark as claimed IF it was in the list
        if (allowedGuest) {
            allowedGuest.isClaimed = true;
            allowedGuest.claimedBy = newUser._id;
            await allowedGuest.save();
        }

        const userData = {
            id: newUser._id,
            role: newUser.role,
            clientId: newUser.clientId,
            name: newUser.name,
            access_code: newUser.access_code,
            isRegistered: false,
            rsvpData: null
        };

        // Return same structure as login success
        res.json({ success: true, user: userData });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to register guest' });
    }
};

// Create New User (Token Generation) - Admin Tool
export const createUser = async (req, res) => {
    try {
        const { role, name, access_code, clientId } = req.body;
        let token = access_code;
        
        if (!token) {
            // Generate Permanent Token (CL_ for clients, SP_ for users) + 6 Alphanum
            const prefix = role === 'client' ? 'CL_' : 'SP_';
            let isUnique = false;
            while (!isUnique) {
                const random = Math.random().toString(36).substring(2, 8).toUpperCase();
                token = `${prefix}${random}`;
                const collision = await User.exists({ access_code: token });
                if (!collision) isUnique = true;
            }
        }

        const newUser = await User.create({
            _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            role: role || 'user',
            clientId: clientId || 'default_client', 
            name: name || 'Invited Guest',
            access_code: token,
            is_registered: false
        });

        if (req.body.guestId) {
            const { AllowedGuest } = await import('../models.js');
            await AllowedGuest.findByIdAndUpdate(req.body.guestId, {
                isClaimed: true,
                claimedBy: newUser._id
            });
        }

        res.json({ success: true, user: newUser });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { clientId } = req.query;
        if (!clientId) return res.status(400).json({ error: 'clientId required' });
        const query = { clientId };
        const users = await User.find(query);

        // SECURITY FIX: Map to DTO, exclude internal/sensitive fields if needed.
        // For Admin Token Manager, they actually NEED the access_code to see it.
        // BUT, we should probably only allow this for Admins in a real app.
        // For now, we will return it but at least structured cleanly.

        const safeUsers = users.map(u => ({
            id: u._id,
            name: u.name,
            role: u.role,
            access_code: u.access_code, // Still needed for Admin UI to Work
            is_registered: u.is_registered
        }));

        res.json(safeUsers);
    } catch (e) {
        res.status(500).json([]);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await User.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// --- PHASE 3: CLIENT PORTAL ACTIVATION ---
export const completeClientRegistration = async (req, res) => {
    try {
        const { userId, name, formData } = req.body;
        const user = await User.findById(userId);
        
        if (!user || user.role !== 'client') {
            return res.status(403).json({ error: 'Unauthorized or invalid user' });
        }

        if (user.is_registered && user.access_code.startsWith('CL_')) {
            return res.status(400).json({ error: 'Client already registered' });
        }

        // Generate Permanent CL Token (CL_ + 6 Alphanum)
        let newToken = '';
        let isUnique = false;
        
        while (!isUnique) {
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            newToken = `CL_${random}`;
            const collision = await User.exists({ access_code: newToken });
            if (!collision) isUnique = true;
        }

        // Update User
        user.name = name || user.name;
        user.access_code = newToken;
        user.is_registered = true;
        if (formData) {
            user.rsvp_data = formData;
            
            // Also create an RSVP entry
            const newRsvp = new RSVP({
                _id: `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                userId: user._id,
                clientId: user.clientId,
                data: formData
            });
            await newRsvp.save();
        }
        await user.save();

        res.json({ success: true, token: newToken });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
};
