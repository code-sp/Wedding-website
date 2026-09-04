import express from 'express';
import { authenticate, requireProfileComplete } from '../middleware/auth.js';
import { occupiedSeats } from '../controllers/seatController.js';

const router = express.Router();

router.get('/seats/occupied', authenticate, requireProfileComplete, occupiedSeats);

export default router;
