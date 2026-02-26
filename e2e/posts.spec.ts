import { test, expect } from '@playwright/test';

test.describe('Post Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'Member@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/');
  });

  test('should create a new post', async ({ page }) => {
    // Click create post button
    await page.click('button:has-text("Create Post")');
    
    // Wait for dialog/form
    await page.waitForSelector('[data-testid="post-form"]');
    
    // Fill form
    await page.fill('input[placeholder="Post Title"]', 'Test Post Title');
    await page.fill('textarea', 'This is a test post content');
    
    // Select category
    await page.click('[data-testid="category-select"]');
    await page.click('text=General Discussion');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should see success notification
    await page.waitForSelector('text=Post created successfully');
  });

  test('should view post details', async ({ page }) => {
    // Navigate to posts list
    await page.goto('/posts');
    
    // Click on first post
    await page.click('[data-testid="post-item"]:first-child');
    
    // Wait for post detail page
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Check post content is visible
    const title = await page.locator('[data-testid="post-title"]').textContent();
    expect(title).toBeTruthy();
  });

  test('should edit a post', async ({ page }) => {
    // Navigate to own posts
    await page.goto('/profile/posts');
    
    // Click edit on first post
    await page.click('[data-testid="post-edit"]:first-child');
    
    // Update content
    await page.fill('textarea', 'Updated post content');
    
    // Submit
    await page.click('button:has-text("Save")');
    
    // Should see success
    await page.waitForSelector('text=Post updated successfully');
  });

  test('should delete a post', async ({ page }) => {
    // Navigate to own posts
    await page.goto('/profile/posts');
    
    // Click delete on first post
    await page.click('[data-testid="post-delete"]:first-child');
    
    // Confirm delete
    await page.click('button:has-text("Confirm")');
    
    // Should see success
    await page.waitForSelector('text=Post deleted successfully');
  });

  test('should filter posts by category', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts');
    
    // Click category filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=General Discussion');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-item"]');
    
    // Should show filtered results message
    await page.waitForSelector('text=Showing posts in General Discussion');
  });

  test('should sort posts', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts');
    
    // Click sort dropdown
    await page.click('[data-testid="sort-select"]');
    await page.click('text=Most Recent');
    
    // Posts should refresh
    await page.waitForSelector('[data-testid="post-item"]');
  });
});
