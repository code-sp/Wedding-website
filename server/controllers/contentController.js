import { Content } from '../models.js';

export const getContent = async (req, res) => {
    try {
        const { key } = req.params;
        const { clientId } = req.query; // Pass clientId via query for now

        if (!clientId) return res.status(400).json({ error: 'clientId required' });

        const doc = await Content.findOne({ key, clientId });
        res.json(doc ? doc.value : null);
    } catch (e) {
        res.status(500).json(null);
    }
};

export const updateContent = async (req, res) => {
    try {
        const { key } = req.params;
        const { clientId } = req.query;
        const value = req.body;

        if (!clientId) return res.status(400).json({ error: 'clientId required' });

        await Content.findOneAndUpdate(
            { key, clientId },
            { value },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};
