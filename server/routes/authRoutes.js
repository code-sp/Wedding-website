import express from 'express';
import { createUser, getUsers, deleteUser, completeClientRegistration } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeTenant, requireTargetUserInTenant, forceSelfUserId } from '../middleware/tenant.js';

const router = express.Router();

router.post('/users', authenticate, authorize('admin', 'client'), scopeTenant, createUser);
router.get('/users', authenticate, authorize('admin', 'client'), scopeTenant, getUsers);
router.delete('/users/:id', authenticate, authorize('admin', 'client'), requireTargetUserInTenant, deleteUser);
router.post('/complete-client-registration', authenticate, authorize('client'), forceSelfUserId, completeClientRegistration);

export default router;
