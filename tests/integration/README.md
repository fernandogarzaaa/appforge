# Integration Tests

These integration tests require a running server and are **not run in CI**.

## Running Integration Tests Locally

Integration tests make real HTTP requests to a local server and are designed for manual testing during development.

### Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```
   
2. Ensure the server is running on `http://localhost:3000`

3. Set up required environment variables:
   - `XENDIT_SECRET_KEY` - Xendit sandbox API key
   - `TEST_USER_TOKEN` - Test user authentication token
   - `ADMIN_TOKEN` - Admin authentication token

### Running the Tests

To run integration tests specifically:

```bash
# Run only integration tests
npx vitest run tests/integration/
```

To include integration tests in your test run, you can temporarily modify `vitest.config.js` or run them directly.

## Why Integration Tests Are Excluded from CI

These tests are excluded from continuous integration because:

1. They require a running application server on port 3000
2. They need proper environment configuration (API keys, database, etc.)
3. They make real HTTP calls and are intended for local development verification
4. CI environment doesn't have the necessary server setup

For CI testing, rely on unit tests that mock external dependencies.
