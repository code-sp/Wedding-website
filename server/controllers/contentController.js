import { Content } from '../models.js';

const resolveClientId = (req, allowPublic = false) => {
  if (req.auth?.role === 'admin') return req.query.clientId || req.body?.clientId;
  if (req.auth?.clientId) return req.auth.clientId;
  if (allowPublic) return req.query.clientId;
  return null;
};

export const getContent = async (req, res) => {
  try {
    const { key } = req.params;
    const clientId = resolveClientId(req, true);
    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const doc = await Content.findOne({ key, clientId });
    return res.json(doc ? doc.value : null);
  } catch (error) {
    console.error('Content read failed', error);
    return res.status(500).json({ error: 'Unable to load content' });
  }
};

export const updateContent = async (req, res) => {
  try {
    const { key } = req.params;
    const clientId = resolveClientId(req);
    const value = req.body;

    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    await Content.findOneAndUpdate(
      { key, clientId },
      { value },
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({ success: true, value });
  } catch (error) {
    console.error('Content update failed', error);
    return res.status(500).json({ error: 'Unable to update content' });
  }
};
