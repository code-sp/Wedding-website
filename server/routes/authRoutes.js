import express from 'express';
import { createUser, getUsers, deleteUser, completeClientRegistration } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Authentication for the rebuilt clients is handled by /api/session/*.
// Legacy public /login and /register endpoints are intentionally not mounted.
router.post('/users', authenticate, authorize('admin', 'client'), createUser);
router.get('/users', authenticate, authorize('admin', 'client'), getUsers);
router.delete('/users/:id', authenticate, authorize('admin', 'client'), deleteUser);
router.post('/complete-client-registration', authenticate, authorize('client'), completeClientRegistration);

export default router;
