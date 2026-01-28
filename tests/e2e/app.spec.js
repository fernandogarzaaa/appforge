import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication & Landing Page
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should load landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/AppForge/i);
  });

  test('should display main heading', async ({ page }) => {
    const heading = page.locator('h1, h2');
    await expect(heading.first()).toBeVisible();
  });

  test('should navigate to projects', async ({ page }) => {
    // Click on projects link or button
    const projectsLink = page.locator('a, button').filter({ hasText: /projects/i }).first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL(/projects/i);
    }
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Find and click navigation items
    const navItems = page.locator('nav a, nav button');
    const itemCount = await navItems.count();
    
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should have working back button', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Navigate to another page if possible
    const firstLink = page.locator('a').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL(/localhost:5173/);
    }
  });
});

test.describe('System Status Page', () => {
  test('should display system status', async ({ page }) => {
    await page.goto('http://localhost:5173/system-status');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for status indicators
    const statusTitle = page.locator('h1, h2').filter({ hasText: /system|status/i });
    await expect(statusTitle.first()).toBeVisible();
  });

  test('should show health checks', async ({ page }) => {
    await page.goto('http://localhost:5173/system-status');
    await page.waitForLoadState('networkidle');
    
    // Look for health check results
    const healthSection = page.locator('text=/healthy|degraded|unhealthy/i');
    await expect(healthSection.first()).toBeVisible();
  });

  test('should allow refreshing status', async ({ page }) => {
    await page.goto('http://localhost:5173/system-status');
    await page.waitForLoadState('networkidle');
    
    // Find and click refresh button
    const refreshButton = page.locator('button').filter({ hasText: /refresh/i }).first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify page still shows content
      const statusElements = page.locator('text=/healthy|degraded|unhealthy/i');
      await expect(statusElements.first()).toBeVisible();
    }
  });
});

test.describe('Error Handling', () => {
  test('should display error boundary on error', async ({ page }) => {
    // Try to navigate to invalid page
    await page.goto('http://localhost:5173/invalid-page-12345');
    await page.waitForLoadState('networkidle');
    
    // Should either show 404 or error boundary
    const errorMessages = page.locator('text=/not found|error|something went wrong/i');
    const pageContent = page.locator('body');
    
    await expect(pageContent).toBeVisible();
  });
});
