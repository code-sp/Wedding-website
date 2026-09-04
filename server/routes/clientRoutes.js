import express from 'express';
import { getClients, createClient, deleteClient, getGlobalStats } from '../controllers/clientController.js';
import { authenticate, authorize, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();
const adminRoute = [authenticate, requireProfileComplete, authorize('admin')];

router.get('/clients', ...adminRoute, getClients);
router.get('/clients/stats', ...adminRoute, getGlobalStats);
router.post('/clients', ...adminRoute, createClient);
router.delete('/clients/:id', ...adminRoute, deleteClient);

export default router;
