# Implementation Plan: Final Integration and CI/CD Wiring

This plan outlines the steps to finalize the Phase 87-91 upgrades by wiring the new components into the CI/CD pipeline and repository.

## User Review Required

> [!IMPORTANT]
> This plan modifies GitHub Actions workflows to automate synergy scouting and architectural analysis. It also adds new data files to the repository history to ensure state persistence across CI runs.

## Proposed Changes

### [scripts]

#### [MODIFY] [package.json](file:///c:/Users/ferna/Downloads/appforge-main/package.json)

- Add scripts for synergy scouting and architectural analysis.

```json
"swarm:scout": "tsx scripts/scout_synergy.ts",
"swarm:analyze": "tsx scripts/analyze_antigravity.ts"
```

### [CI/CD]

#### [MODIFY] [quantum_evolution.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/quantum_evolution.yml)

- Add a step to run `npm run swarm:scout` (Synergy Harvesting).
- Add a step to run `npm run swarm:analyze` (Reverse-Engineering).
- Update the "Commit Evolution Results" step to include new data files and source components.

#### [MODIFY] [autonomous_swarm.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/autonomous_swarm.yml)

- Update the "Push any Swarm artifacts" step to ensure new data files and source components are committed.

## Verification Plan

### Automated Tests

- Run `npm run swarm:scout` and verify `src/data/synergy_scout.json` is updated.
- Run `npm run swarm:analyze` and verify `src/data/antigravity_blueprint.json` is generated.
- Verify `RealitySensor` in `swarm/core/reality_sensor.ts` correctly integrates `scanSynergy` (completed in previous steps).

### CI/CD Validation

- The next scheduled run of `Quantum Self-Evolution` or `Autonomous Swarm Cycle` should pick up the new steps and push the results back to the repository.
