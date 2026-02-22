import { test, expect } from '@playwright/test';

test('verifies Select Wallet', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('text=Select Wallet').first()).toBeVisible({ timeout: 15000 });
});
