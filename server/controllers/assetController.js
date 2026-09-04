import crypto from 'crypto';
import { Asset } from '../models.js';

const MAX_ASSET_BYTES = 1_800_000;
const IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export const uploadAsset = async (req, res) => {
  try {
    const dataUrl = String(req.body?.dataUrl || '');
    const match = dataUrl.match(IMAGE_DATA_URL);
    if (!match) {
      return res.status(400).json({ error: 'Only JPEG, PNG and WebP images are supported' });
    }

    const [, mimeType, encoded] = match;
    const data = Buffer.from(encoded, 'base64');
    if (!data.length || data.length > MAX_ASSET_BYTES) {
      return res.status(413).json({ error: 'Image must be smaller than 1.8 MB after compression' });
    }

    const id = `asset_${crypto.randomUUID()}`;
    const asset = await Asset.create({
      _id: id,
      clientId: req.auth.clientId || 'default_client',
      uploadedBy: req.auth.userId,
      mimeType,
      data,
      size: data.length
    });

    return res.status(201).json({
      success: true,
      id: asset._id,
      url: `/api/assets/${asset._id}`,
      mimeType: asset.mimeType,
      size: asset.size
    });
  } catch (error) {
    console.error('Asset upload failed', error);
    return res.status(500).json({ error: 'Unable to store image' });
  }
};

export const getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).select('mimeType data size');
    if (!asset) return res.status(404).end();

    res.set({
      'Content-Type': asset.mimeType,
      'Content-Length': String(asset.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.send(asset.data);
  } catch {
    return res.status(404).end();
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).select('clientId uploadedBy');
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const allowed =
      req.auth.role === 'admin' ||
      (req.auth.role === 'client' && asset.clientId === req.auth.clientId) ||
      (req.auth.role === 'user' && asset.uploadedBy === req.auth.userId);

    if (!allowed) return res.status(403).json({ error: 'Asset belongs to another account' });

    await Asset.deleteOne({ _id: asset._id });
    return res.status(204).end();
  } catch (error) {
    console.error('Asset deletion failed', error);
    return res.status(500).json({ error: 'Unable to delete image' });
  }
};
