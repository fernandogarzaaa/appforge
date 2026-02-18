# Implementation Plan - Residual Test Fixes

The objective is to resolve the remaining test failures by properly configuring the Vitest environment and refactoring brittle path resolution logic.

## User Review Required
>
> [!NOTE]
> We are adding a `vitest.config.ts` to explicitly manage the test environment, which was previously relying on defaults.

## Proposed Changes

### Configuration

#### [NEW] [vitest.config.ts](file:///c:/Users/ferna/Downloads/appforge-main/vitest.config.ts)

- Configure `test` object.
- **Environment**: `jsdom` (for React tests).
- **Setup Files**: `['./tests/setup.ts']`.
- **Env**: Load `.env.local` manually or use `dotenv`.

#### [NEW] [tests/setup.ts](file:///c:/Users/ferna/Downloads/appforge-main/tests/setup.ts)

- Import `dotenv/config`.
- Silence specific React warnings if needed.

### Refactoring

#### [MODIFY] [swarm/core/p2p_resonance.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/p2p_resonance.ts)

- Replace `fileURLToPath(import.meta.url)` with `process.cwd()` based logic or simple `path.resolve` for robust `PROJECT_ROOT` determination.

#### [MODIFY] [swarm/core/quantum_core.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/quantum_core.ts)

- Similar fix for `fileURLToPath`.

## Verification Plan

### Automated Tests

1. **Run Tests**

   ```bash
   npm run test
   ```

   - **Expectation**: `Environment Configuration Error` should disappear. `TypeError: fileURLToPath` should disappear. `useMemo` error should disappear (if due to environment config).
