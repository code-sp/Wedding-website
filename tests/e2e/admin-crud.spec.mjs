import { test, expect } from '@playwright/test';
import { LEGACY, loginLegacyAdmin, tinyPng } from './helpers.mjs';

test('Events create, upload, edit and delete persist', async ({ page }) => {
  await loginLegacyAdmin(page);
  await page.goto(`${LEGACY}/events`);

  await page.getByRole('button', { name: /Add Event/i }).click();
  await page.getByPlaceholder('e.g. Sangeet Night').fill('Runtime QA Ceremony');
  await page.locator('input[type="date"]').fill('2026-08-20');
  await page.locator('input[type="time"]').fill('18:30');
  await page.getByPlaceholder('e.g. Grand Ballroom').fill('Runtime QA Venue');
  await page.getByPlaceholder('Tell guests about this ceremony…').fill('Runtime event editor regression.');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'runtime-event.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });

  const assetSave = page.waitForResponse(
    response => response.url().includes('/api/assets') &&
      response.request().method() === 'POST' && response.ok()
  );
  const createSave = page.waitForResponse(
    response => response.url().includes('/api/content/events') &&
      response.request().method() === 'POST' && response.ok()
  );

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await Promise.all([assetSave, createSave]);
  await expect(page.getByText('Runtime QA Ceremony')).toBeVisible();

  await page.getByTitle('Edit Event').click({ force: true });
  await page.getByPlaceholder('e.g. Sangeet Night').fill('Runtime QA Ceremony Updated');

  const updateSave = page.waitForResponse(
    response => response.url().includes('/api/content/events') &&
      response.request().method() === 'POST' && response.ok()
  );

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await updateSave;
  await expect(page.getByText('Runtime QA Ceremony Updated')).toBeVisible();

  const deleteSave = page.waitForResponse(
    response => response.url().includes('/api/content/events') &&
      response.request().method() === 'POST' && response.ok()
  );

  await page.getByTitle('Delete').first().click({ force: true });
  await deleteSave;
  await expect(page.getByText('Runtime QA Ceremony Updated')).toHaveCount(0);
});
