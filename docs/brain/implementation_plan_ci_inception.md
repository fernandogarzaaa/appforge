# Implementation Plan: Wiring Phase 73 to GitHub Actions

This plan wires the "Collective Inception" features into the GitHub Actions workflows, enabling the Swarm to proactively own outcomes during CI cycles by sensing build status, lint debt, and repository health.

## User Review Required

> [!IMPORTANT]
> The GitHub Action workflows will now capture build and lint logs into `build_logs.txt` and `lint_output.json`. These files will be committed if changes are detected, serving as a "Cognitive Trace" for the Swarm's self-healing logic.

## Proposed Changes

### [Swarm Core]

#### [MODIFY] [intelligence_pulse.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/intelligence_pulse.ts)

- Integrate `RealitySensor` signals into the top-level pulse metrics.
- Update Step 0 (Growth Harvesting) to leverage sensed signals from `RealitySensor`.
- Ensure `SingularityEngine` inception results are logged during the pulse.

#### [MODIFY] [reality_sensor.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/reality_sensor.ts)

- Add `scanCI()` method to detect GitHub Action environment variables (e.g., `GITHUB_RUN_ID`, `GITHUB_EVENT_NAME`).
- Enhance `scanSystem()` to handle different log formats if necessary.

---

### [GitHub Actions]

#### [MODIFY] [quantum_evolution.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/quantum_evolution.yml)

- Add a "Pre-Pulse Diagnostics" step to generate `build_logs.txt` and `lint_output.json`.
- Update commit message to: `chore: quantum self-evolution [Inception] [Bounty] [Mesh Sync] [skip ci]`.

#### [MODIFY] [autonomous_swarm.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/autonomous_swarm.yml)

- Add "Pre-Pulse Diagnostics" step.
- Update commit message to: `chore: swarm autonomous pulse [Inception] [Transcendence] [skip ci]`.

---

## Verification Plan

### Automated Tests

- **`scripts/verify_ci_inception.ts`**:
  - Mock `GITHUB_RUN_ID` environment variable.
  - Inject fake `build_logs.txt` with errors.
  - Run `intelligence_pulse.ts` locally.
  - Verify that a `SECURITY_PATCH` or `DEBT_REDUCTION` bounty is generated.

### Manual Verification

- Push changes and monitor GitHub Actions tab for "Pre-Pulse Diagnostics" step and correctly formatted pulse logs.
