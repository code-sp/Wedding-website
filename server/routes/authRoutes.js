import express from 'express';
import { login, createUser, getUsers, registerGuest, deleteUser, completeClientRegistration } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', registerGuest); // New Route
router.post('/users', createUser);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.post('/complete-client-registration', completeClientRegistration);

export default router;
