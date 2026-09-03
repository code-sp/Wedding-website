import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth.js';
import { createInvitation, exchangeInvitation } from '../controllers/invitationController.js';

const router = express.Router();

const exchangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many invitation attempts. Try again later.' }
});

router.post('/invitations', authenticate, authorize('admin', 'client'), createInvitation);
router.post('/session/exchange', exchangeLimiter, exchangeInvitation);

export default router;
