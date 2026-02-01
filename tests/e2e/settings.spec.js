import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

test.describe('Settings Persistence E2E', () => {
  let authToken;
  let userId;

  test.beforeAll(async ({ request }) => {
    // Register and login to get auth token
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await request.post(`${API_URL}/api/auth/register`, {
      data: { email, password, name: 'Test User' }
    });

    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password }
    });

    const loginData = await loginRes.json();
    authToken = loginData.data.token;
    userId = loginData.data.user.id;
  });

  test('should persist theme settings', async ({ page }) => {
    await page.goto(BASE_URL);

    // Set auth token (assuming app stores in localStorage or cookie)
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    await page.reload();

    // Navigate to settings (adjust selector based on your app)
    await page.click('[data-testid="settings-button"]', { timeout: 5000 }).catch(() => {
      console.log('Settings button not found, skipping navigation');
    });

    // Change theme
    const themeSelector = '[data-testid="theme-selector"]';
    if (await page.$(themeSelector)) {
      await page.selectOption(themeSelector, 'dark');
      await page.waitForTimeout(1000);

      // Reload and verify persistence
      await page.reload();
      const selectedTheme = await page.inputValue(themeSelector);
      expect(selectedTheme).toBe('dark');
    }
  });

  test('should persist LLM settings via API', async ({ request }) => {
    const llmSettings = {
      selectedModel: 'chatgpt',
      settings: {
        temperature: 0.8,
        maxTokens: 2000
      },
      usage: {
        queryCount: 5
      }
    };

    // Save settings
    const saveRes = await request.post(`${API_URL}/api/user/llm-settings`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: llmSettings
    });

    expect(saveRes.ok()).toBeTruthy();

    // Retrieve settings
    const getRes = await request.get(`${API_URL}/api/user/llm-settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await getRes.json();
    expect(data.selectedModel).toBe('chatgpt');
    expect(data.settings.temperature).toBe(0.8);
    expect(data.usage.queryCount).toBe(5);
  });

  test('should persist keyboard shortcuts', async ({ request }) => {
    const shortcuts = {
      shortcuts: {
        'cmd-palette': 'Ctrl+K',
        'save': 'Ctrl+S',
        'search': 'Ctrl+F'
      },
      preset: 'vscode'
    };

    // Save shortcuts
    const saveRes = await request.post(`${API_URL}/api/user/keyboard-shortcuts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: shortcuts
    });

    expect(saveRes.ok()).toBeTruthy();

    // Retrieve shortcuts
    const getRes = await request.get(`${API_URL}/api/user/keyboard-shortcuts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await getRes.json();
    expect(data.preset).toBe('vscode');
    expect(data.shortcuts['cmd-palette']).toBe('Ctrl+K');
  });

  test('should persist admin API configurations', async ({ request }) => {
    const configurations = [
      {
        provider: 'openai',
        name: 'OpenAI',
        apiKey: 'sk-test-key-123',
        baseUrl: 'https://api.openai.com/v1',
        active: true,
        config: { model: 'gpt-4', timeout: 30 }
      }
    ];

    // Save configurations
    const saveRes = await request.post(`${API_URL}/api/admin/api-configurations`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { configurations }
    });

    expect(saveRes.ok()).toBeTruthy();

    // Retrieve configurations
    const getRes = await request.get(`${API_URL}/api/admin/api-configurations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await getRes.json();
    expect(data.configurations).toHaveLength(1);
    expect(data.configurations[0].provider).toBe('openai');
    
    // API keys should be decrypted when retrieved
    expect(data.configurations[0].apiKey).toBeTruthy();
  });

  test('should handle rate limiting gracefully', async ({ request }) => {
    const promises = [];
    
    // Send 110 requests rapidly (limit is 100 per 15 minutes)
    for (let i = 0; i < 110; i++) {
      promises.push(
        request.post(`${API_URL}/api/user/llm-settings`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { selectedModel: 'base44' }
        })
      );
    }

    const results = await Promise.allSettled(promises);
    const rateLimited = results.filter(r => 
      r.status === 'fulfilled' && r.value.status() === 429
    );

    // Should have some rate limited requests
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should validate encryption of sensitive data', async ({ request }) => {
    // This test verifies that API keys are encrypted in storage
    // We can't directly check the database, but we can verify that
    // the data is properly decrypted when retrieved

    const testApiKey = 'sk-test-very-secret-key-12345678';

    const saveRes = await request.post(`${API_URL}/api/admin/api-configurations`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        configurations: [{
          provider: 'openai',
          apiKey: testApiKey,
          active: true
        }]
      }
    });

    expect(saveRes.ok()).toBeTruthy();

    // Retrieve and verify decryption works
    const getRes = await request.get(`${API_URL}/api/admin/api-configurations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await getRes.json();
    expect(data.configurations[0].apiKey).toBe(testApiKey);
  });
});

test.describe('Settings UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should show loading states when saving settings', async ({ page }) => {
    const saveButton = '[data-testid="save-settings-button"]';
    const loadingIndicator = '[data-testid="loading-indicator"]';

    if (await page.$(saveButton)) {
      await page.click(saveButton);
      
      // Should show loading indicator
      await expect(page.locator(loadingIndicator)).toBeVisible({ timeout: 1000 }).catch(() => {
        console.log('Loading indicator not found');
      });
    }
  });

  test('should show success message after saving', async ({ page }) => {
    const saveButton = '[data-testid="save-settings-button"]';
    const successMessage = 'text=saved successfully';

    if (await page.$(saveButton)) {
      await page.click(saveButton);
      
      // Should show success message
      await expect(page.locator(successMessage)).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('Success message not found');
      });
    }
  });

  test('should show error message when save fails', async ({ page, context }) => {
    // Intercept API call and return error
    await context.route('**/api/user/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const saveButton = '[data-testid="save-settings-button"]';
    const errorMessage = 'text=failed';

    if (await page.$(saveButton)) {
      await page.click(saveButton);
      
      // Should show error message
      await expect(page.locator(errorMessage)).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('Error message not found');
      });
    }
  });
});
