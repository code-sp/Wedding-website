import express from 'express';
import { getClients, createClient, deleteClient, getGlobalStats } from '../controllers/clientController.js';

const router = express.Router();

router.get('/clients', getClients);
router.get('/clients/stats', getGlobalStats);
router.post('/clients', createClient);
router.delete('/clients/:id', deleteClient);

export default router;
