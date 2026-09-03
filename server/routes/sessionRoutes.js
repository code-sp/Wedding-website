import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { sessionLogin, refreshSession, getSession, sessionLogout } from '../controllers/sessionController.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Try again shortly.' }
});

router.post('/session/login', loginLimiter, sessionLogin);
router.post('/session/refresh', refreshLimiter, refreshSession);
router.get('/session', authenticate, getSession);
router.post('/session/logout', sessionLogout);

export default router;
