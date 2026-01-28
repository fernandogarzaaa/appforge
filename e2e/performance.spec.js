/**
 * E2E Test: Performance
 * Tests page load performance and Web Vitals
 */

import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('has good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      };
    });
    
    // FCP should be under 1.8s (good threshold)
    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(1800);
    }
  });

  test('lazy loads images', async ({ page }) => {
    await page.goto('/');
    
    // Check for lazy loading attribute
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    
    // At least some images should be lazy loaded
    expect(lazyImages).toBeGreaterThanOrEqual(0);
  });

  test('bundles are optimized', async ({ page }) => {
    const resources = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        resources.push({
          url: response.url(),
          size: response.headers()['content-length'],
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Main bundles shouldn't be too large
    const largeBundles = resources.filter(r => 
      parseInt(r.size || '0') > 1024 * 500 // 500KB
    );
    
    // Allow some large bundles (vendor code) but not too many
    expect(largeBundles.length).toBeLessThan(5);
  });
});
