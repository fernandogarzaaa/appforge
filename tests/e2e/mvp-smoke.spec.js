import { test, expect } from '@playwright/test';

test.describe('@mvp MVP smoke flow', () => {
  test.setTimeout(120000);

  test('home loads and core CTAs navigate', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Build apps at the speed of thought')).toBeVisible();

    const ideaInput = page.getByPlaceholder('Describe your idea...');
    await expect(ideaInput).toBeVisible();
    await ideaInput.fill('Build a simple task tracker with login');

    const generateButton = page.getByRole('button', { name: 'Generate App' });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    const newProjectLink = page.getByRole('link', { name: /New Project/i });
    await expect(newProjectLink).toBeVisible();
    await newProjectLink.click();

    await expect(page).toHaveURL(/\/Projects\?new=true/);
    expect(pageErrors, `Unexpected runtime page errors: ${pageErrors.map(e => e.message).join('; ')}`).toHaveLength(0);
  });
});
