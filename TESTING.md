# Testing Guide

## 🧪 Testing Stack

AppForge uses a comprehensive testing setup:

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Accessibility**: Axe-core
- **Coverage**: V8 coverage provider

## Quick Start

```bash
# Run all unit tests
npm run test

# Watch mode (re-runs on file changes)
npm run test:watch

# UI mode (interactive test runner)
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

## 📁 Test Structure

```
src/
├── components/
│   └── ui/
│       └── __tests__/
│           ├── button.test.jsx
│           └── card.test.jsx
├── utils/
│   └── __tests__/
│       ├── env.test.js
│       ├── errorTracking.test.js
│       └── performance.test.js
└── test/
    ├── setup.js          # Global test configuration
    └── utils.jsx         # Test utilities and helpers

e2e/
├── landing.spec.js       # Landing page tests
├── ai-assistant.spec.js  # AI Assistant flow
├── accessibility.spec.js # A11y compliance
└── performance.spec.js   # Performance metrics
```

## Writing Unit Tests

### Basic Component Test

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing with Providers

```javascript
import { renderWithProviders } from '@/test/utils';

it('renders with all providers', () => {
  renderWithProviders(<MyComponent />);
  // Component has access to Router, Theme, Query Client
});
```

### Mocking API Calls

```javascript
import { vi } from 'vitest';

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);

global.fetch = mockFetch;
```

## Writing E2E Tests

### Basic Page Test

```javascript
import { test, expect } from '@playwright/test';

test('loads homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

### User Interaction

```javascript
test('fills form and submits', async ({ page }) => {
  await page.goto('/contact');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Hello!');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.success')).toBeVisible();
});
```

### Accessibility Testing

```javascript
import AxeBuilder from '@axe-core/playwright';

test('has no a11y violations', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
    
  expect(results.violations).toEqual([]);
});
```

## Test Utilities

### Available Helpers

```javascript
import {
  render,
  screen,
  waitFor,
  renderWithProviders,
  userEvent,
  mockUser,
  mockProject,
  mockEntity,
  createMockResponse,
  mockBase44,
  setupLocalStorageMock,
} from '@/test/utils';
```

### Mock Data

```javascript
// Mock user
const user = mockUser;
// { id: 1, username: 'testuser', email: 'test@example.com' }

// Mock project
const project = mockProject;
// { id: 1, name: 'Test Project', stats: {...} }

// Create custom response
const response = createMockResponse(
  { success: true },
  { status: 200 }
);
```

## Coverage Reports

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.js`:

```javascript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  }
}
```

## Best Practices

### ✅ Do's

- **Test behavior, not implementation**
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test from user's perspective
- Keep tests simple and focused
- Use descriptive test names
- Clean up after tests
- Mock external dependencies

### ❌ Don'ts

- Don't test implementation details
- Avoid testing library internals
- Don't rely on CSS classes for queries
- Avoid brittle selectors
- Don't test third-party libraries

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run tests
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test"
    }
  }
}
```

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens interactive UI to explore and debug tests.

### Playwright Debug

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Tests fail with "Cannot find module"

Make sure path aliases in `vitest.config.js` match `vite.config.js`:

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### DOM elements not found

Use `waitFor` for async operations:

```javascript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### E2E tests timeout

Increase timeout in `playwright.config.js`:

```javascript
use: {
  timeout: 60000, // 60 seconds
}
```

## Test Examples

See comprehensive test examples:

- [Button Tests](../src/components/ui/__tests__/button.test.jsx)
- [Card Tests](../src/components/ui/__tests__/card.test.jsx)
- [Error Tracking Tests](../src/utils/__tests__/errorTracking.test.js)
- [Performance Tests](../src/utils/__tests__/performance.test.js)
- [E2E Accessibility](../e2e/accessibility.spec.js)
- [E2E Performance](../e2e/performance.spec.js)

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
