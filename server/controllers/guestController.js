import { AllowedGuest } from '../models.js';

export const getGuests = async (req, res) => {
    try {
        const { clientId } = req.query;
        if (!clientId) return res.status(400).json({ error: 'clientId required' });
        const query = { clientId };
        const guests = await AllowedGuest.find(query).sort({ name: 1 });
        res.json(guests);
    } catch (e) {
        res.status(500).json([]);
    }
};

export const addGuest = async (req, res) => {
    try {
        const { name, clientId } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        const newGuest = await AllowedGuest.create({ name, clientId: clientId || 'default_client' });
        res.json({ success: true, guest: newGuest });
    } catch (e) {
        if (e.code === 11000) { // Duplicate key error? Not strictly enforced by schema unique but good to handle
            return res.status(400).json({ error: 'Guest already exists' });
        }
        res.status(500).json({ error: 'Failed to add guest' });
    }
};

export const deleteGuest = async (req, res) => {
    try {
        const { id } = req.params;
        await AllowedGuest.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete guest' });
    }
};

export const updateGuest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        const updated = await AllowedGuest.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Guest not found' });

        res.json({ success: true, guest: updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update guest' });
    }
};
