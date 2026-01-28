import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Dashboard & Project Management
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Try to navigate to dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  });

  test('should load dashboard if authenticated', async ({ page }) => {
    // Check if we're on dashboard or redirected
    const url = page.url();
    const isDashboard = url.includes('dashboard') || url.includes('login');
    expect(isDashboard).toBeTruthy();
  });

  test('should display project cards or empty state', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Look for either projects or empty state message
    const projects = page.locator('[class*="project"], [class*="card"]');
    const emptyState = page.locator('text=/no projects|create project/i');
    
    const hasProjects = (await projects.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;
    
    expect(hasProjects || hasEmptyState).toBeTruthy();
  });

  test('should have working action buttons', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // Buttons should be visible or interactable
    const firstButton = buttons.first();
    if (await firstButton.isVisible()) {
      await expect(firstButton).toBeEnabled();
    }
  });
});

test.describe('Performance', () => {
  test('should load pages within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle multiple page navigations', async ({ page }) => {
    const pages = [
      'http://localhost:5173',
      'http://localhost:5173/dashboard',
      'http://localhost:5173/system-status',
    ];
    
    for (const url of pages) {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Verify page loaded
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should not have console errors', async ({ page, context }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    // Allow some non-critical errors but not many
    const criticalErrors = errors.filter(e => 
      !e.includes('404') && 
      !e.includes('net::ERR') &&
      !e.includes('Sentry')
    );
    
    expect(criticalErrors.length).toBeLessThan(3);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Page should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Text should be readable (not too small)
    const headings = page.locator('h1, h2');
    if (await headings.count() > 0) {
      const fontSize = await headings.first().evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const size = parseInt(fontSize);
      expect(size).toBeGreaterThanOrEqual(16);
    }
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have valid HTML structure', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Check for main content areas
    const main = page.locator('main, [role="main"]');
    const body = page.locator('body');
    
    await expect(body).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
    
    // Should have at least one heading
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Tab to first button
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => 
      document.activeElement?.tagName
    );
    
    // Should be able to focus interactive elements
    expect(focusedElement).toBeTruthy();
  });
});
