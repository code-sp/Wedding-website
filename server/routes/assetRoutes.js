import express from 'express';
import { authenticate, requireProfileComplete } from '../middleware/auth.js';
import { uploadAsset, getAsset, deleteAsset } from '../controllers/assetController.js';

const router = express.Router();

router.get('/assets/:id', getAsset);
router.post('/assets', authenticate, requireProfileComplete, uploadAsset);
router.delete('/assets/:id', authenticate, requireProfileComplete, deleteAsset);

export default router;
