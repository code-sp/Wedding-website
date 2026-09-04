import { expect } from '@playwright/test';

export const LEGACY = 'http://127.0.0.1:5173';
export const NEXT = 'http://127.0.0.1:3001';

export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z5J8AAAAASUVORK5CYII=',
  'base64'
);

export async function loginLegacyAdmin(page) {
  await page.goto(`${LEGACY}/`);
  const input = page.getByPlaceholder('Enter Access Code');
  await input.fill(process.env.RUNTIME_ADMIN_CODE || 'admin123');
  await input.press('Enter');
  await page.waitForURL(/master-directory|\/$/, { timeout: 20_000 });
}

export async function loginNextAdmin(page) {
  await page.goto(`${NEXT}/login`);
  await page.getByLabel('Invitation token or access code').fill(process.env.RUNTIME_ADMIN_CODE || 'admin123');
  await page.getByRole('button', { name: 'Enter wedding' }).click();
  await page.waitForURL(`${NEXT}/`, { timeout: 20_000 });
}

export async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}
