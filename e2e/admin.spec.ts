import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5174');
    
    // Check if already logged in, if not login
    const loginButton = page.locator('text=Login').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('input[type="email"]', 'admin@forum.com');
      await page.fill('input[type="password"]', 'Admin@123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('**/');
    }
  });

  test('should view admin dashboard', async ({ page }) => {
    // Navigate to admin
    await page.goto('http://localhost:5174/dashboard');
    
    // Should see dashboard title
    await page.waitForSelector('text=Dashboard');
    
    // Should see stats cards
    await page.waitForSelector('[data-testid="stats-card"]');
  });

  test('should manage categories', async ({ page }) => {
    // Navigate to categories
    await page.goto('http://localhost:5174/categories');
    
    // Should see categories list
    await page.waitForSelector('[data-testid="category-list"]');
    
    // Create new category
    await page.click('button:has-text("Add Category")');
    await page.fill('input[placeholder="Category Name"]', 'Test Category');
    await page.fill('textarea[placeholder="Description"]', 'Test category description');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should see success
    await page.waitForSelector('text=Category created');
  });

  test('should manage tags', async ({ page }) => {
    // Navigate to tags
    await page.goto('http://localhost:5174/tags');
    
    // Should see tags list
    await page.waitForSelector('[data-testid="tag-list"]');
    
    // Create new tag
    await page.click('button:has-text("Add Tag")');
    await page.fill('input[placeholder="Tag Name"]', 'test-tag');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should see success
    await page.waitForSelector('text=Tag created');
  });

  test('should manage users', async ({ page }) => {
    // Navigate to users
    await page.goto('http://localhost:5174/users');
    
    // Should see users list
    await page.waitForSelector('[data-testid="user-list"]');
    
    // Search for user
    await page.fill('input[placeholder="Search users"]', 'john');
    await page.waitForSelector('[data-testid="user-item"]');
  });

  test('should ban a user', async ({ page }) => {
    // Navigate to users
    await page.goto('http://localhost:5174/users');
    
    // Find a user to ban
    await page.click('[data-testid="user-menu"]:first-child');
    await page.click('text=BAN USER');
    
    // Confirm ban
    await page.click('button:has-text("Confirm")');
    
    // Should see success
    await page.waitForSelector('text=User banned');
  });

  test('should change user role', async ({ page }) => {
    // Navigate to users
    await page.goto('http://localhost:5174/users');
    
    // Click on a user
    await page.click('[data-testid="user-item"]:first-child');
    await page.waitForSelector('[data-testid="user-detail"]');
    
    // Change role
    await page.click('[data-testid="role-select"]');
    await page.click('text=Moderator');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Should see success
    await page.waitForSelector('text=Role updated');
  });

  test('should view audit logs', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('http://localhost:5174/audit-logs');
    
    // Should see logs list
    await page.waitForSelector('[data-testid="audit-log-item"]');
    
    // Should be able to filter
    await page.click('[data-testid="action-filter"]');
    await page.click('text=CREATE');
  });

  test('should resolve reports', async ({ page }) => {
    // Navigate to reports
    await page.goto('http://localhost:5174/reports');
    
    // Should see reports list
    await page.waitForSelector('[data-testid="report-item"]');
    
    // Click first report
    await page.click('[data-testid="report-item"]:first-child');
    await page.waitForSelector('[data-testid="report-detail"]');
    
    // Resolve report
    await page.click('[data-testid="action-select"]');
    await page.click('text=Delete Content');
    await page.click('button:has-text("Resolve")');
    
    // Should see success
    await page.waitForSelector('text=Report resolved');
  });
});
