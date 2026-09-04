import { test, expect } from '@playwright/test';
import { LEGACY, loginLegacyAdmin } from './helpers.mjs';

test('Family first member persists after reload', async ({ page }) => {
  await loginLegacyAdmin(page);
  await page.goto(`${LEGACY}/family-tree`);

  const familySave = page.waitForResponse(
    response => response.url().includes('/api/content/family_people') &&
      response.request().method() === 'POST' && response.ok()
  );

  await page.getByRole('button', { name: 'Add First Member' }).click();
  await familySave;
  await page.reload();

  await expect(page.getByText('New Member')).toBeVisible();
});
