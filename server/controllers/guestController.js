import { AllowedGuest } from '../models.js';

const cleanName = (value) => String(value ?? '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 100);

const resolveClientId = (req) => {
  if (req.auth?.role === 'admin') return req.query.clientId || req.body?.clientId;
  return req.auth?.clientId || null;
};

export const getGuests = async (req, res) => {
  try {
    const clientId = resolveClientId(req);
    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const guests = await AllowedGuest.find({ clientId }).sort({ name: 1 });
    return res.json(guests);
  } catch (error) {
    console.error('Guest list failed', error);
    return res.status(500).json({ error: 'Unable to load guests' });
  }
};

export const addGuest = async (req, res) => {
  try {
    const name = cleanName(req.body.name);
    const clientId = resolveClientId(req);
    if (!name) return res.status(400).json({ error: 'Name required' });
    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const duplicate = await AllowedGuest.exists({
      clientId,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    if (duplicate) return res.status(409).json({ error: 'Guest already exists' });

    const newGuest = await AllowedGuest.create({ name, clientId });
    return res.status(201).json({ success: true, guest: newGuest });
  } catch (error) {
    console.error('Guest creation failed', error);
    return res.status(500).json({ error: 'Unable to add guest' });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const clientId = resolveClientId(req);
    if (!clientId) return res.status(400).json({ error: 'clientId required' });

    const deleted = await AllowedGuest.findOneAndDelete({ _id: req.params.id, clientId });
    if (!deleted) return res.status(404).json({ error: 'Guest not found' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Guest deletion failed', error);
    return res.status(500).json({ error: 'Unable to delete guest' });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const clientId = resolveClientId(req);
    const name = cleanName(req.body.name);
    if (!clientId) return res.status(400).json({ error: 'clientId required' });
    if (!name) return res.status(400).json({ error: 'Name required' });

    const updated = await AllowedGuest.findOneAndUpdate(
      { _id: req.params.id, clientId },
      { name },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Guest not found' });
    return res.json({ success: true, guest: updated });
  } catch (error) {
    console.error('Guest update failed', error);
    return res.status(500).json({ error: 'Unable to update guest' });
  }
};
