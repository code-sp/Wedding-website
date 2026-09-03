import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getProfile, completeProfile } from '../controllers/profileController.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, completeProfile);

export default router;
