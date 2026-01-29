# Testing Guide

## Unit Tests with Vitest

Run unit and component tests:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
src/tests/
├── unit/
│   ├── hooks/
│   │   └── useOfflineDetection.test.jsx
│   ├── components/
│   │   └── PrivateRoute.test.jsx
│   └── utils/
│       └── env.test.js
└── e2e/
    ├── auth.spec.js
    └── navigation.spec.js
```

### Writing Unit Tests

Example test file:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const { user } = render(<MyComponent />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated Text')).toBeInTheDocument()
  })
})
```

### Testing Best Practices

- **Test behavior, not implementation** - Focus on what users see
- **Use Testing Library queries** - Prefer getByRole, getByText, getByLabelText
- **Mock external dependencies** - APIs, localStorage, etc.
- **Test loading and error states** - Not just the happy path
- **Keep tests focused** - One assertion per test when possible
- **Use descriptive names** - Test names should explain what's being tested

## E2E Tests with Playwright

Run end-to-end tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test src/tests/e2e/auth.spec.js

# Run tests in UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Writing E2E Tests

Example E2E test:

```javascript
import { test, expect } from '@playwright/test'

test('should complete login flow', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')
  
  // Fill form
  await page.locator('input[type="email"]').fill('test@example.com')
  await page.locator('input[type="password"]').fill('password123')
  
  // Submit
  await page.locator('button:has-text("Login")').click()
  
  // Verify redirect
  await expect(page).toHaveURL('/dashboard')
  
  // Verify content
  expect(await page.locator('h1').textContent()).toContain('Dashboard')
})
```

### Playwright Best Practices

- **Use web-first assertions** - await expect() instead of assert
- **Use locators** - page.locator() is more reliable than selectors
- **Wait for navigation** - Use page.waitForURL() for redirects
- **Test user workflows** - Complete journeys, not isolated clicks
- **Use data attributes** - Add data-testid for reliable element selection
- **Screenshot on failure** - Configured automatically in config

## CI/CD Pipeline

GitHub Actions runs automatically on push and pull requests:

### Jobs:

1. **Test Job** (Node 18 & 20)
   - Installs dependencies
   - Runs linting
   - Type checking
   - Unit tests
   - Code coverage upload
   - Build verification

2. **E2E Job** (Depends on Test)
   - Builds application
   - Runs Playwright tests
   - Uploads reports as artifacts

3. **Accessibility Job** (Depends on Test)
   - Runs accessibility checks
   - Reports violations

### View Results

- Check workflow runs: GitHub Actions tab in repo
- View test reports: Artifacts section
- Download Playwright reports: `playwright-report/`
- Check coverage: Codecov integration

## Coverage Reports

After running tests with coverage:

```bash
npm run test:coverage
```

Open coverage report:
```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## Test Naming Conventions

```javascript
// ✅ Good
describe('LoginForm', () => {
  it('should submit credentials and navigate to dashboard')
  it('should display error for invalid email')
  it('should disable submit button while loading')
})

// ❌ Avoid
describe('LoginForm', () => {
  it('test1')
  it('works')
  it('login test')
})
```

## Common Test Utilities

### React Testing Library

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Render components
render(<Component />)

// Query elements
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByText('Welcome')
screen.queryByText('Not found') // Returns null if not found
screen.findByText('Async text') // Waits for element

// User interactions
await userEvent.click(button)
await userEvent.type(input, 'text')
await userEvent.selectOption(select, 'option')

// Async operations
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

### Playwright

```javascript
import { test, expect, devices } from '@playwright/test'

// Navigation
await page.goto('/path')
await page.goBack()
await page.goForward()

// Locators
page.locator('button')
page.locator('text=Submit')
page.locator('[data-testid="submit"]')
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter email')

// Interactions
await page.click('button')
await page.fill('input', 'value')
await page.selectOption('select', 'option')
await page.press('input', 'Enter')

// Assertions
expect(page).toHaveURL('/dashboard')
expect(locator).toBeVisible()
expect(locator).toHaveText('Expected')
expect(locator).toHaveCount(3)

// Wait operations
await page.waitForURL('/dashboard')
await page.waitForSelector('button')
await page.waitForTimeout(1000)
```

## Debugging Tests

### Unit Tests

```bash
# Run in debug mode
npm run test:watch

# Then add breakpoints in your IDE and step through
```

### E2E Tests

```bash
# Debug mode opens inspector
npm run test:e2e:debug

# Headed mode shows browser
npm run test:e2e:headed

# Slow down execution
npx playwright test --headed --trace on
```

## Performance Testing

Monitor test performance:

```bash
# Run tests with timing information
npm run test -- --reporter=verbose

# Check E2E performance
npx playwright test --reporter=dot
```

## Tips & Tricks

1. **Finding elements reliably**
   ```javascript
   // Prefer semantic queries
   screen.getByRole('button', { name: 'Save' })
   
   // Avoid overly specific selectors
   page.locator('.container .form > button.btn-primary')
   ```

2. **Testing async code**
   ```javascript
   // Good - waits automatically
   const element = await screen.findByText('Loaded')
   
   // Also good - explicit wait
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

3. **Mocking API calls**
   ```javascript
   // Mock fetch
   global.fetch = vi.fn(() =>
     Promise.resolve({
       json: () => Promise.resolve({ data: 'mock' })
     })
   )
   ```

4. **Testing network errors**
   ```javascript
   // Simulate network failure
   await page.context().setOffline(true)
   // ... perform actions
   await page.context().setOffline(false)
   ```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
