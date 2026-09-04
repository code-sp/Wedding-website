import { test, expect } from '@playwright/test';

const LEGACY = 'http://127.0.0.1:5173';

test('admin CRUD regression placeholder', async ({ page }) => {
  await page.goto(LEGACY);
  await expect(page).toHaveURL(/5173/);
});
