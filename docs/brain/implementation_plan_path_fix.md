# Path Resolution Fix for Swarm Modules

The `intelligence_pulse.ts` script (and potentially others) fails with `ENOENT` when run from within the `swarm/` directory because `quantum_core.ts` uses `process.cwd()` to resolve paths to `src/data/`.

## Proposed Changes

### [Swarm Core]

#### [MODIFY] [quantum_core.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/quantum_core.ts)

Update path constants to be relative to the file's directory instead of `process.cwd()`.

```typescript
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..'); // From swarm/core to root

const STATE_FILE = path.join(PROJECT_ROOT, 'src/data/quantum_state.json');
const ORACLE_STATE_FILE = path.join(PROJECT_ROOT, 'src/data/quantum_oracle_state.json');
const COHERENCE_STATE_FILE = path.join(PROJECT_ROOT, 'src/data/quantum_coherence_state.json');
```

## Verification Plan

### Automated Tests

- Run `npx tsx swarm/intelligence_pulse.ts` from the root directory.
- Run `npx tsx intelligence_pulse.ts` from within the `swarm/` directory.
- Verify that `quantum_oracle_state.json` is successfully opened and persisted in both cases.
