import crypto from 'crypto';
import { Content, RoomReservation, SeatReservation } from '../models.js';

const conflict = (message, code) => {
  const error = new Error(message);
  error.status = 409;
  error.code = code;
  return error;
};

const badRequest = (message, code) => {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
};

const getSettings = async (clientId) => {
  const doc = await Content.findOne({ key: 'client_settings', clientId }).select('value');
  return doc?.value || {};
};

const configuredSeatIds = (settings) => {
  const ids = new Set();
  let idCounter = 1;
  let currentRow = 0;
  const config = Array.isArray(settings?.seatingConfig) ? settings.seatingConfig : [];

  for (const section of config) {
    const rows = Math.max(1, Number.parseInt(section?.rows, 10) || 1);
    const cols = Math.max(1, Number.parseInt(section?.colsPerSide, 10) || 1);
    const name = String(section?.name || section?.id || 'Section').trim();

    for (let row = currentRow; row < currentRow + rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        ids.add(`${name}-L-${idCounter}`);
        idCounter += 1;
      }
      for (let col = 0; col < cols; col += 1) {
        ids.add(`${name}-R-${idCounter}`);
        idCounter += 1;
      }
    }
    currentRow += rows;
  }
  return ids;
};

export const getSeatOccupancy = async (clientId, userId) => {
  const reservations = await SeatReservation.find({ clientId })
    .select('seatNumber userId')
    .sort({ seatNumber: 1 });

  return reservations.map((reservation) => ({
    seatNumber: reservation.seatNumber,
    mine: reservation.userId === userId
  }));
};

export const stageSeatReservations = async ({ clientId, userId, seatNumbers }) => {
  const requested = [...new Set((seatNumbers || []).map(String).map((seat) => seat.trim()).filter(Boolean))];
  const settings = await getSettings(clientId);
  const validSeats = configuredSeatIds(settings);

  for (const seat of requested) {
    if (!validSeats.has(seat)) {
      throw badRequest(`Seat "${seat}" is not part of the configured layout`, 'SEAT_INVALID');
    }
  }

  const current = await SeatReservation.find({ clientId, userId }).select('_id seatNumber');
  const currentSet = new Set(current.map((reservation) => reservation.seatNumber));
  const requestedSet = new Set(requested);
  const toAcquire = requested.filter((seat) => !currentSet.has(seat));
  const toRelease = current.filter((reservation) => !requestedSet.has(reservation.seatNumber));
  const acquiredIds = [];

  try {
    for (const seatNumber of toAcquire) {
      const id = `seat_${crypto.randomUUID()}`;
      try {
        await SeatReservation.create({
          _id: id,
          clientId,
          userId,
          seatNumber
        });
        acquiredIds.push(id);
      } catch (error) {
        if (error?.code === 11000) {
          throw conflict(`Seat "${seatNumber}" was just reserved by another guest`, 'SEAT_TAKEN');
        }
        throw error;
      }
    }
  } catch (error) {
    if (acquiredIds.length) await SeatReservation.deleteMany({ _id: { $in: acquiredIds }, userId });
    throw error;
  }

  return {
    async finalize() {
      if (toRelease.length) {
        await SeatReservation.deleteMany({
          _id: { $in: toRelease.map((reservation) => reservation._id) },
          userId
        });
      }
    },
    async rollback() {
      if (acquiredIds.length) await SeatReservation.deleteMany({ _id: { $in: acquiredIds }, userId });
    }
  };
};

export const stageRoomReservation = async ({ clientId, userId, requestedRoomId }) => {
  const settings = await getSettings(clientId);
  const rooms = Array.isArray(settings?.rooms) ? settings.rooms : [];
  const requested = requestedRoomId == null ? '' : String(requestedRoomId).trim();
  const room = rooms.find((candidate) => String(candidate?.id) === requested);
  const current = await RoomReservation.findOne({ clientId, userId });

  if (!room) {
    return {
      assignmentLabel: '',
      async finalize() {
        if (current) await RoomReservation.deleteOne({ _id: current._id, userId });
      },
      async rollback() {}
    };
  }

  if (current && String(current.roomId) === requested) {
    return {
      assignmentLabel: `${room.name || 'Room'} #${current.slot}`,
      async finalize() {},
      async rollback() {}
    };
  }

  const available = Math.max(0, Math.min(500, Number.parseInt(room.available, 10) || 0));
  if (!available) throw conflict('The selected room is no longer available', 'ROOM_UNAVAILABLE');

  if (current) {
    const previous = {
      roomId: current.roomId,
      slot: current.slot
    };
    let assignedSlot = null;

    for (let slot = 1; slot <= available; slot += 1) {
      try {
        const result = await RoomReservation.updateOne(
          { _id: current._id, clientId, userId },
          { $set: { roomId: requested, slot } }
        );
        if (result.matchedCount === 1) {
          assignedSlot = slot;
          break;
        }
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }

    if (!assignedSlot) {
      throw conflict('The selected room is no longer available', 'ROOM_UNAVAILABLE');
    }

    return {
      assignmentLabel: `${room.name || 'Room'} #${assignedSlot}`,
      async finalize() {},
      async rollback() {
        await RoomReservation.updateOne(
          { _id: current._id, clientId, userId },
          { $set: previous }
        );
      }
    };
  }

  let acquired = null;
  for (let slot = 1; slot <= available; slot += 1) {
    try {
      acquired = await RoomReservation.create({
        _id: `room_${crypto.randomUUID()}`,
        clientId,
        userId,
        roomId: requested,
        slot
      });
      break;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }

  if (!acquired) throw conflict('The selected room is no longer available', 'ROOM_UNAVAILABLE');

  return {
    assignmentLabel: `${room.name || 'Room'} #${acquired.slot}`,
    async finalize() {},
    async rollback() {
      await RoomReservation.deleteOne({ _id: acquired._id, userId });
    }
  };
};
