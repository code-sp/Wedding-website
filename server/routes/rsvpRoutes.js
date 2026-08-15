import express from 'express';
import { submitRSVP, getAllRSVPs, deleteRSVP } from '../controllers/rsvpController.js';

const router = express.Router();

router.post('/rsvp', submitRSVP);
router.get('/rsvps', getAllRSVPs);
router.delete('/rsvp/:id', deleteRSVP);

export default router;
