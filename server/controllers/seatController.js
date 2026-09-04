import { getSeatOccupancy } from '../services/reservationService.js';

export const occupiedSeats = async (req, res) => {
  try {
    const clientId = req.auth.clientId || 'default_client';
    const seats = await getSeatOccupancy(clientId, req.auth.userId);
    return res.json({ seats });
  } catch (error) {
    console.error('Seat occupancy failed', error);
    return res.status(500).json({ error: 'Unable to load seat availability' });
  }
};
