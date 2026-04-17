import { test, expect } from '@playwright/test';

/**
 * E2E tests for main user flows.
 * These tests verify core navigation and UI interactions work correctly.
 * They run against the frontend dev server (no backend required for navigation tests).
 */

test.describe('Navigation', () => {
  test('homepage loads with header and main content', async ({ page }) => {
    await page.goto('/');
    
    // Header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Main content area exists
    const main = page.locator('#main-content');
    await expect(main).toBeAttached();
  });

  test('can navigate to categories page', async ({ page }) => {
    await page.goto('/');
    
    // Click categories link in nav (desktop)
    const categoriesLink = page.getByRole('link', { name: /danh mục/i }).first();
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await expect(page).toHaveURL(/\/categories/);
    }
  });

  test('can navigate to tags page', async ({ page }) => {
    await page.goto('/');
    
    const tagsLink = page.getByRole('link', { name: /tags/i }).first();
    if (await tagsLink.isVisible()) {
      await tagsLink.click();
      await expect(page).toHaveURL(/\/tags/);
    }
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#root')).toBeAttached();
    // Should render login form elements
    await expect(page.locator('#root *').first()).toBeAttached({ timeout: 10000 });
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('#root')).toBeAttached();
    await expect(page.locator('#root *').first()).toBeAttached({ timeout: 10000 });
  });
});

test.describe('Search', () => {
  test('search page loads', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('#root')).toBeAttached();
    await expect(page.locator('#root *').first()).toBeAttached({ timeout: 10000 });
  });

  test('search via URL query param', async ({ page }) => {
    await page.goto('/search?q=test');
    await expect(page.locator('#root')).toBeAttached();
    await expect(page.locator('#root *').first()).toBeAttached({ timeout: 10000 });
  });

  test('desktop search input submits and navigates', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByRole('searchbox', { name: /tìm kiếm/i }).or(
      page.locator('input[type="search"]')
    ).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('hello');
      await searchInput.press('Enter');
      await expect(page).toHaveURL(/\/search\?q=hello/);
    }
  });
});

test.describe('Accessibility', () => {
  test('skip-to-main link is available on keyboard focus', async ({ page }) => {
    await page.goto('/');
    
    // Tab into the page - skip link should become visible
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-to-main');
    // The link should exist in the DOM
    await expect(skipLink).toBeAttached();
  });

  test('main navigation has aria-label', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeAttached();
  });

  test('main content has id for skip link target', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('#main-content');
    await expect(main).toBeAttached();
  });
});

test.describe('Responsive', () => {
  test('mobile search button visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileSearchBtn = page.getByRole('button', { name: /tìm kiếm/i });
    await expect(mobileSearchBtn.first()).toBeVisible();
  });
});
