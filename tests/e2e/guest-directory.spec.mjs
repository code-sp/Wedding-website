import { test, expect } from '@playwright/test';
import { LEGACY, loginLegacyAdmin } from './helpers.mjs';

test('Guest Directory add, invite, rename and remove work securely', async ({ page }) => {
  await loginLegacyAdmin(page);
  await page.goto(`${LEGACY}/rsvp-list`);

  const addGuest = page.waitForResponse(
    response => response.url().includes('/api/guests') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByPlaceholder('Add new guest...').fill('Runtime Directory Guest');
  await page.getByTitle('Add Guest').click();
  await addGuest;
  await expect(page.getByText('Runtime Directory Guest')).toBeVisible();

  const createInvite = page.waitForResponse(
    response => response.url().includes('/api/users') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByRole('button', { name: 'Issue Invite' }).click();
  await createInvite;
  await expect(page.getByText('Single-use invitation')).toBeVisible();
  await expect(page.getByText(/\/login#invite=/)).toBeVisible();
  await page.getByRole('button', { name: 'Close invitation' }).click();

  await expect(page.getByRole('button', { name: 'Reissue Invite' })).toBeVisible();

  await page.getByTitle('Edit Guest Name').click({ force: true });
  const renameModal = page.getByRole('heading', { name: 'Rename Guest' }).locator('..').locator('..');
  await renameModal.locator('input').fill('Runtime Directory Guest Updated');

  const renameGuest = page.waitForResponse(
    response => response.url().includes('/api/guests/') &&
      response.request().method() === 'PUT' && response.ok()
  );
  await renameModal.getByRole('button', { name: 'Save' }).click();
  await renameGuest;
  await expect(page.getByText('Runtime Directory Guest Updated')).toBeVisible();

  const deleteUser = page.waitForResponse(
    response => response.url().includes('/api/users/') &&
      response.request().method() === 'DELETE' && response.ok()
  );
  const deleteGuest = page.waitForResponse(
    response => response.url().includes('/api/guests/') &&
      response.request().method() === 'DELETE' && response.ok()
  );

  const removeGuest = page.getByTitle('Remove Guest');
  await removeGuest.click({ force: true });
  await removeGuest.click({ force: true });
  await Promise.all([deleteUser, deleteGuest]);

  await page.getByTitle('Refresh').click();
  await expect(page.getByText('Runtime Directory Guest Updated')).toHaveCount(0);
});
