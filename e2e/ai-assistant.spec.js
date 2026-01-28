/**
 * E2E Test: AI Assistant
 * Tests the AI Assistant page and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-assistant');
  });

  test('loads AI Assistant page', async ({ page }) => {
    await expect(page).toHaveURL(/ai-assistant/);
    
    // Should show AI Assistant heading or chat interface
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('displays chat input', async ({ page }) => {
    // Look for textarea or input for chat
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible();
  });

  test('can type in chat input', async ({ page }) => {
    const input = page.locator('textarea').first();
    
    await input.fill('Create a new entity');
    await expect(input).toHaveValue('Create a new entity');
  });

  test('displays quick actions', async ({ page }) => {
    // Check for quick action buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
