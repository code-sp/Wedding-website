import { test, expect } from '@playwright/test';
import { LEGACY, loginLegacyAdmin } from './helpers.mjs';

test('Story edit/save/delete and Settings autosave work', async ({ page }) => {
  await loginLegacyAdmin(page);

  await page.goto(`${LEGACY}/story`);
  await page.getByTitle('Edit Chapter').first().click({ force: true });
  await page.getByPlaceholder('Chapter Title').fill('Runtime QA Story');
  await page.getByPlaceholder('Describe this beautiful moment...').fill('Runtime story editor regression.');
  await page.getByPlaceholder('MM / YYYY').fill('082026');

  const storySave = page.waitForResponse(
    response => response.url().includes('/api/content/stories') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByRole('button', { name: /Save Changes/i }).click();
  await storySave;
  await expect(page.getByRole('heading', { name: 'Runtime QA Story' })).toBeVisible();

  const storyDelete = page.waitForResponse(
    response => response.url().includes('/api/content/stories') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByTitle('Delete Chapter').first().click({ force: true });
  await storyDelete;
  await expect(page.getByRole('heading', { name: 'Runtime QA Story' })).toHaveCount(0);

  await page.goto(`${LEGACY}/settings`);
  const settingsSave = page.waitForResponse(
    response => response.url().includes('/api/content/client_settings') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByRole('button', { name: 'Gallery' }).click();
  await settingsSave;

  const settings = await page.evaluate(async () => {
    const response = await fetch('/api/content/client_settings?clientId=default_client', { credentials: 'include' });
    return response.json();
  });
  expect(settings.enabledTabs).not.toContain('gallery');

  const restore = page.waitForResponse(
    response => response.url().includes('/api/content/client_settings') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByRole('button', { name: 'Gallery' }).click();
  await restore;
});
