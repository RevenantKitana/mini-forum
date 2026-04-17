import { test, expect } from '@playwright/test';

/**
 * Smoke tests – verify the forum app shell loads correctly.
 * These tests do NOT require a fully functional backend; they only
 * check that the React application bootstraps and renders basic UI.
 */

test.describe('Smoke: App loads', () => {
  test('homepage responds with 200 and renders HTML', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // The React root should be mounted
    const root = page.locator('#root');
    await expect(root).toBeAttached();
  });

  test('page has a document title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });

  test('navigating to /login renders a page (no crash)', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);

    const root = page.locator('#root');
    await expect(root).toBeAttached();
    // Wait for at least one DOM node inside root (app shell rendered)
    await expect(root.locator('*').first()).toBeAttached({ timeout: 10000 });
  });
});
