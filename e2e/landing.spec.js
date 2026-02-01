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

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Allow time for any async errors
    await page.waitForTimeout(1000);
    
    // Filter out expected errors in test env
    const criticalErrors = errors.filter(err => {
      const errorText = err.toLowerCase();
      return !errorText.includes('401') && 
             !errorText.includes('404') &&
             !errorText.includes('authentication') &&
             !errorText.includes('base44') &&
             !errorText.includes('auth check failed') &&
             !errorText.includes('authcontext') &&
             !errorText.includes('app state check failed') &&
             !errorText.includes('error captured') &&
             !errorText.includes('failed to load resource') &&
             !errorText.includes('[base44 sdk error]') &&
             !errorText.includes('failed to save llm settings') &&
             !errorText.includes('failed to load llm settings') &&
             !errorText.includes('llm settings') &&
             !errorText.includes('buildapierror') &&
             !errorText.includes('unexpected token') &&
             !errorText.includes('string did not match the expected pattern');
    });
    
    expect(criticalErrors).toHaveLength(0);
  });
});
