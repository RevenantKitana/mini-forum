import { test, expect } from '@playwright/test';

test.describe('Comments and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'john@example.com');
    await page.fill('input[type="password"]', 'Member@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/');
  });

  test('should create and view comments', async ({ page }) => {
    // Open a post
    await page.goto('/posts');
    await page.click('[data-testid="post-item"]:first-child');
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Scroll to comments section
    await page.click('text=Add Comment');
    await page.waitForSelector('[data-testid="comment-form"]');
    
    // Write comment
    await page.fill('textarea[placeholder="Your comment"]', 'This is a test comment');
    
    // Submit
    await page.click('button:has-text("Post Comment")');
    
    // Should see success
    await page.waitForSelector('text=Comment added successfully');
  });

  test('should vote on a post', async ({ page }) => {
    // Open a post
    await page.goto('/posts');
    await page.click('[data-testid="post-item"]:first-child');
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Upvote
    await page.click('[data-testid="upvote-button"]');
    
    // Check vote count increased
    const voteCount = await page.locator('[data-testid="vote-count"]').textContent();
    expect(parseInt(voteCount || '0')).toBeGreaterThan(0);
  });

  test('should change vote', async ({ page }) => {
    // Open a post
    await page.goto('/posts');
    await page.click('[data-testid="post-item"]:first-child');
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Upvote
    await page.click('[data-testid="upvote-button"]');
    await page.waitForTimeout(300);
    
    const upvoteCount = await page.locator('[data-testid="vote-count"]').textContent();
    
    // Change to downvote
    await page.click('[data-testid="downvote-button"]');
    
    const newCount = await page.locator('[data-testid="vote-count"]').textContent();
    expect(newCount).not.toBe(upvoteCount);
  });

  test('should bookmark a post', async ({ page }) => {
    // Open a post
    await page.goto('/posts');
    await page.click('[data-testid="post-item"]:first-child');
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Bookmark
    await page.click('[data-testid="bookmark-button"]');
    
    // Check bookmark icon is filled
    const bookmarkBtn = page.locator('[data-testid="bookmark-button"]');
    const isFilled = await bookmarkBtn.evaluate(el => 
      el.classList.contains('filled')
    );
    expect(isFilled).toBeTruthy();
  });

  test('should report content', async ({ page }) => {
    // Open a post
    await page.goto('/posts');
    await page.click('[data-testid="post-item"]:first-child');
    await page.waitForSelector('[data-testid="post-detail"]');
    
    // Click report button
    await page.click('[data-testid="report-button"]');
    
    // Wait for report dialog
    await page.waitForSelector('[data-testid="report-dialog"]');
    
    // Select reason
    await page.click('[data-testid="reason-select"]');
    await page.click('text=Offensive Content');
    
    // Add description
    await page.fill('textarea[placeholder="Additional details"]', 'This content is offensive');
    
    // Submit report
    await page.click('button:has-text("Report")');
    
    // Should see success
    await page.waitForSelector('text=Report submitted');
  });
});
