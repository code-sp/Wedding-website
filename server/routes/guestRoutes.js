import express from 'express';
import { getGuests, addGuest, deleteGuest, updateGuest } from '../controllers/guestController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';
import { scopeTenant, requireTargetGuestInTenant } from '../middleware/tenant.js';

const router = express.Router();
const protectedGuestRoute = [authenticate, requireProfileComplete, authorize('admin', 'client')];

router.get('/guests', ...protectedGuestRoute, scopeTenant, getGuests);
router.post('/guests', ...protectedGuestRoute, scopeTenant, addGuest);
router.put('/guests/:id', ...protectedGuestRoute, requireTargetGuestInTenant, scopeTenant, updateGuest);
router.delete('/guests/:id', ...protectedGuestRoute, requireTargetGuestInTenant, deleteGuest);

export default router;
