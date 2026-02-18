# Implementation Plan - Phase 7: Curiosity-Driven Inception

The Oracle directive `STRATEGY_INCEPTOR` commands us to implement a "Curiosity-Driven" objective generation system.
We will build the `CuriosityEngine` to autonomously find work within the codebase, rather than waiting for user input.

## User Review Required
>
> [!NOTE]
> This module will autonomously generate tasks.

## Proposed Changes

### Core Components

#### [NEW] [swarm/core/curiosity_engine.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/curiosity_engine.ts)

- **Class**: `CuriosityEngine`
- **Methods**:
  - `scanForNovelty()`: Scans file system for files with low edit frequency or high complexity.
  - `synthesizeBounty(file)`: Uses Oracle to generate a "Why this is interesting" hypothesis.

### Integration

#### [MODIFY] [swarm/core/loop.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/loop.ts)

- Integrate `CuriosityEngine` into the autonomous loop (e.g., run every 10 cycles).

## Verification Plan

### Automated Tests

1. **Unit Test**
    - Create `tests/curiosity_engine.test.ts`.
    - Verify it can identify a "neglected" file.

2. **Simulation**
    - Run `scripts/test_curiosity.ts` (to be created) and verify it generates a bounty.
