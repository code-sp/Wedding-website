import { test, expect } from '@playwright/test';
import { loginNextAdmin } from './helpers.mjs';

test('room changes succeed and a second guest cannot double-book a seat', async ({ page }) => {
  await loginNextAdmin(page);

  const result = await page.evaluate(async () => {
    const cookie = document.cookie
      .split('; ')
      .find(entry => entry.startsWith('csrf_token='));
    const csrf = cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

    const postRsvp = async (body) => {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(body)
      });
      return { status: response.status, payload: await response.json() };
    };

    const first = await postRsvp({
      clientId: 'default_client',
      data: {
        name: 'Reservation QA One',
        attending: 'yes',
        guests: 1,
        seatNumbers: ['VIP Section-L-1'],
        accommodation: '1'
      }
    });

    const listResponse = await fetch('/api/rsvps?clientId=default_client', { credentials: 'include' });
    const list = await listResponse.json();
    const firstRow = list.find(item => item.name === 'Reservation QA One');

    const changedRoom = await postRsvp({
      userId: firstRow?.userId,
      clientId: 'default_client',
      data: {
        name: 'Reservation QA One',
        attending: 'yes',
        guests: 1,
        seatNumbers: ['VIP Section-L-1'],
        accommodation: '2'
      }
    });

    const conflict = await postRsvp({
      clientId: 'default_client',
      data: {
        name: 'Reservation QA Two',
        attending: 'yes',
        guests: 1,
        seatNumbers: ['VIP Section-L-1'],
        accommodation: ''
      }
    });

    return { first, changedRoom, conflict };
  });

  expect(result.first.status).toBeLessThan(300);
  expect(result.first.payload.rsvp?.roomNumber).toMatch(/Deluxe Suite/);

  expect(result.changedRoom.status).toBeLessThan(300);
  expect(result.changedRoom.payload.rsvp?.roomNumber).toMatch(/Garden View/);

  expect(result.conflict.status).toBe(409);
  expect(result.conflict.payload.code).toBe('SEAT_TAKEN');
});
