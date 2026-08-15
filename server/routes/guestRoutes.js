import express from 'express';
import { getGuests, addGuest, deleteGuest, updateGuest } from '../controllers/guestController.js';

const router = express.Router();

router.get('/guests', getGuests);
router.post('/guests', addGuest);
router.put('/guests/:id', updateGuest);
router.delete('/guests/:id', deleteGuest);

export default router;
