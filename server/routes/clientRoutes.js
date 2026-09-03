import express from 'express';
import { getClients, createClient, deleteClient, getGlobalStats } from '../controllers/clientController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, requireProfileComplete, authorize('admin'));
router.get('/clients', getClients);
router.get('/clients/stats', getGlobalStats);
router.post('/clients', createClient);
router.delete('/clients/:id', deleteClient);

export default router;
