import express from 'express';
import { login, createUser, getUsers, registerGuest, deleteUser, completeClientRegistration } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Legacy access-code endpoints kept temporarily during migration.
router.post('/login', login);
router.post('/register', registerGuest);

router.post('/users', authenticate, authorize('admin', 'client'), createUser);
router.get('/users', authenticate, authorize('admin', 'client'), getUsers);
router.delete('/users/:id', authenticate, authorize('admin', 'client'), deleteUser);
router.post('/complete-client-registration', authenticate, authorize('client'), completeClientRegistration);

export default router;
