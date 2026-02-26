import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to login
    await page.click('text=Login');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]');
    
    // Fill login form
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'Member@123');
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('login');
  });

  test('should logout successfully', async ({ page, context }) => {
    // First login
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'Member@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/');

    // Then logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to home
    await page.waitForURL('**/');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Wait for error message
    await page.waitForSelector('text=Invalid credentials');
  });
});
