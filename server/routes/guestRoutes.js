import express from 'express';
import { getGuests, addGuest, deleteGuest, updateGuest } from '../controllers/guestController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireProfileComplete, authorize('admin', 'client'));
router.get('/guests', getGuests);
router.post('/guests', addGuest);
router.put('/guests/:id', updateGuest);
router.delete('/guests/:id', deleteGuest);

export default router;
