import { test, expect } from '@playwright/test';

const LEGACY = 'http://127.0.0.1:5173';
const NEXT = 'http://127.0.0.1:3001';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z5J8AAAAASUVORK5CYII=',
  'base64'
);

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function loginNextAdmin(page) {
  await page.goto(`${NEXT}/login`);
  await page.getByLabel('Invitation token or access code').fill('admin123');
  await page.getByRole('button', { name: 'Enter wedding' }).click();
  await page.waitForURL(`${NEXT}/`, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'A wedding world you can step into.' })).toBeVisible();
}

async function loginLegacyAdmin(page) {
  await page.goto(`${LEGACY}/`);
  const input = page.getByPlaceholder('Enter Access Code');
  await input.fill('admin123');
  await input.press('Enter');
  await page.waitForURL(/master-directory|\/$/, { timeout: 20_000 });
}

test.describe.configure({ mode: 'serial' });

test('Next.js routes, carousel and mobile navigation stay stable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await loginNextAdmin(page);
  await assertNoHorizontalOverflow(page);

  const track = page.locator('.carousel-track');
  const before = await track.evaluate((element) => element.scrollLeft);
  await page.getByRole('button', { name: 'Next event' }).click();
  await page.waitForTimeout(500);
  const after = await track.evaluate((element) => element.scrollLeft);
  expect(after).toBeGreaterThan(before);

  for (const path of ['/rsvp', '/rooms', '/seating']) {
    const response = await page.goto(`${NEXT}${path}`);
    expect(response?.status()).toBeLessThan(400);
    await assertNoHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${NEXT}/`);
  await assertNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.locator('#mobile-wedding-navigation')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-wedding-navigation')).toHaveAttribute('aria-hidden', 'true');

  await page.setViewportSize({ width: 414, height: 896 });
  await page.reload();
  await assertNoHorizontalOverflow(page);

  expect(pageErrors).toEqual([]);
  await context.close();
});

test('legacy editor saves contact edits and gallery uploads persist after reload', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await loginLegacyAdmin(page);

  await page.goto(`${LEGACY}/contact`);
  await expect(page.getByText('Get In')).toBeVisible();
  await page.getByRole('button', { name: /Edit Contact/i }).click();
  const labelInput = page.getByPlaceholder('Label').first();
  await expect(labelInput).toBeVisible();
  await labelInput.fill('QA Contact Label');

  const contactSave = page.waitForResponse(
    response => response.url().includes('/api/content/contact_data') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByRole('button', { name: /Save Changes/i }).click();
  await contactSave;
  await page.reload();
  await expect(page.getByText('QA Contact Label')).toBeVisible();

  await page.goto(`${LEGACY}/gallery`);
  await expect(page.getByRole('heading', { name: /Photo/i })).toBeVisible();

  const assetSave = page.waitForResponse(
    response => response.url().includes('/api/assets') &&
      response.request().method() === 'POST' && response.ok()
  );
  const gallerySave = page.waitForResponse(
    response => response.url().includes('/api/content/gallery') &&
      response.request().method() === 'POST' && response.ok()
  );

  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'runtime-qa.png',
    mimeType: 'image/png',
    buffer: tinyPng
  });
  await assetSave;
  await gallerySave;

  await expect(page.locator('img[alt="Uploaded Photo"]').first()).toBeVisible();
  await page.reload();

  const persisted = page.locator('img[alt="Uploaded Photo"]').first();
  await expect(persisted).toBeVisible();
  await expect(persisted).toHaveAttribute('src', /\/api\/assets\/asset_/);

  await persisted.click();
  const closePreview = page.getByRole('button', { name: 'Close photo preview' });
  await expect(closePreview).toBeVisible();
  await closePreview.click();
  await expect(closePreview).toBeHidden();

  const deleteSave = page.waitForResponse(
    response => response.url().includes('/api/content/gallery') &&
      response.request().method() === 'POST' && response.ok()
  );
  await page.getByTitle('Delete').first().click({ force: true });
  await deleteSave;
  await page.reload();
  await expect(page.locator('img[alt="Uploaded Photo"]')).toHaveCount(0);

  await assertNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
  await context.close();
});

test('single-use invitation completes onboarding and RSVP end to end', async ({ browser }) => {
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();
  await loginNextAdmin(adminPage);

  const invitation = await adminPage.evaluate(async () => {
    const cookie = document.cookie
      .split('; ')
      .find(entry => entry.startsWith('csrf_token='));
    const csrf = cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';

    const response = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      },
      body: JSON.stringify({
        role: 'user',
        name: 'Runtime QA Guest',
        clientId: 'default_client'
      })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  });

  expect(invitation.invitation?.token).toBeTruthy();
  await adminContext.close();

  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestPage = await guestContext.newPage();
  const guestErrors = [];
  guestPage.on('pageerror', error => guestErrors.push(error.message));

  await guestPage.goto(`${NEXT}/login#invite=${encodeURIComponent(invitation.invitation.token)}`);
  await guestPage.waitForURL(`${NEXT}/onboarding`, { timeout: 20_000 });
  expect(guestPage.url()).not.toContain('invite=');
  await assertNoHorizontalOverflow(guestPage);

  await guestPage.getByLabel('Full name').fill('Runtime QA Guest');
  await guestPage.getByLabel('Relation to the couple').fill('Friend');
  await guestPage.getByLabel('Dietary preference').selectOption('vegetarian');
  await guestPage.getByLabel('Phone').fill('+91 9876543210');
  await guestPage.getByRole('button', { name: 'Continue' }).click();
  await guestPage.waitForURL(`${NEXT}/`, { timeout: 20_000 });

  await guestPage.goto(`${NEXT}/rsvp`);
  await guestPage.getByLabel('Email').fill('runtime.qa@example.com');
  await guestPage.getByLabel('Mobile').fill('+91 9876543210');
  await guestPage.getByRole('button', { name: 'Increase party size' }).click();
  await guestPage.getByLabel('Meal preference').selectOption('vegetarian');
  await guestPage.getByLabel('Accommodation preference').selectOption('required');
  await guestPage.getByLabel('Anything you would like us to know?').fill('Runtime regression RSVP.');

  const rsvpSave = guestPage.waitForResponse(
    response => response.url().includes('/api/rsvp') &&
      response.request().method() === 'POST' && response.ok()
  );
  await guestPage.getByRole('button', { name: 'Submit RSVP' }).click();
  await rsvpSave;
  await expect(guestPage.getByText('RSVP saved')).toBeVisible();

  await guestPage.reload();
  await expect(guestPage.getByText('RSVP saved')).toBeVisible();
  await expect(guestPage.locator('output')).toHaveText('2');
  await assertNoHorizontalOverflow(guestPage);

  const persisted = await guestPage.evaluate(async () => {
    const response = await fetch('/api/rsvp', { credentials: 'include' });
    return response.json();
  });
  expect(persisted.rsvp?.email).toBe('runtime.qa@example.com');
  expect(persisted.rsvp?.guests).toBe(2);
  expect(persisted.rsvp?.accommodation).toBe('required');

  expect(guestErrors).toEqual([]);
  await guestContext.close();
});
