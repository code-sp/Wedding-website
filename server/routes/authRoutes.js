import express from 'express';
import { createUser, getUsers, deleteUser } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeTenant, requireTargetUserInTenant } from '../middleware/tenant.js';

const router = express.Router();

router.post('/users', authenticate, authorize('admin', 'client'), scopeTenant, createUser);
router.get('/users', authenticate, authorize('admin', 'client'), scopeTenant, getUsers);
router.delete('/users/:id', authenticate, authorize('admin', 'client'), requireTargetUserInTenant, deleteUser);

export default router;
