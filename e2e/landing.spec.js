/**
 * E2E Test: Landing Page
 * Tests the main landing/dashboard page functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Should show main heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('displays navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should be visible on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Allow time for any async errors
    await page.waitForTimeout(2000);
    
    // Filter out expected errors (like auth redirects)
    const criticalErrors = errors.filter(err => 
      !err.includes('401') && 
      !err.includes('authentication')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
