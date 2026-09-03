import express from 'express';
import { submitRSVP, getAllRSVPs, deleteRSVP } from '../controllers/rsvpController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();

router.post('/rsvp', authenticate, submitRSVP);
router.get('/rsvps', authenticate, requireProfileComplete, authorize('admin', 'client'), getAllRSVPs);
router.delete('/rsvp/:id', authenticate, requireProfileComplete, authorize('admin', 'client'), deleteRSVP);

export default router;
