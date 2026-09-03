import express from 'express';
import { getGuests, addGuest, deleteGuest, updateGuest } from '../controllers/guestController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';
import { scopeTenant, requireTargetGuestInTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate, requireProfileComplete, authorize('admin', 'client'));
router.get('/guests', scopeTenant, getGuests);
router.post('/guests', scopeTenant, addGuest);
router.put('/guests/:id', requireTargetGuestInTenant, scopeTenant, updateGuest);
router.delete('/guests/:id', requireTargetGuestInTenant, deleteGuest);

export default router;
