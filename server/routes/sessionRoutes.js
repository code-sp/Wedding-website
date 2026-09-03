import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { sessionLogin, getSession, sessionLogout } from '../controllers/sessionController.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

router.post('/session/login', loginLimiter, sessionLogin);
router.get('/session', authenticate, getSession);
router.post('/session/logout', authenticate, sessionLogout);

export default router;
