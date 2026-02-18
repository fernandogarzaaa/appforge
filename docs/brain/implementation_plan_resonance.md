# Implementation Plan - Workflow Resonance & Resilience

This plan ensures that the interconnected GitHub Actions (Swarm, Evolution, CI) work together harmoniously by mitigating race conditions and verifying state freshness.

## User Review Required

> [!NOTE]
> **Race Condition Mitigation:** We are using `git pull --rebase` before pushing evolution results. This ensures that if the Swarm and the Evolution cycle run simultaneously, they will merge their state files gracefully.

## Proposed Changes

### [Component] GitHub Actions Orchestration

---

#### [MODIFY] [autonomous_swarm.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/autonomous_swarm.yml)

- Add `git pull --rebase` before the push step.
- Add `resonance_check.ts` step after checkout.

#### [MODIFY] [quantum_evolution.yml](file:///c:/Users/ferna/Downloads/appforge-main/.github/workflows/quantum_evolution.yml)

- Add `git pull --rebase` before the push step.
- Add `resonance_check.ts` step after checkout.

#### [NEW] [resonance_check.ts](file:///c:/Users/ferna/Downloads/appforge-main/scripts/resonance_check.ts)

A new utility script to:

- Check the timestamp of `src/data/reality_pulse.json`.
- Warn if the pulse is older than 2 hours.
- Verify that `quantum_state.json` and `reality_pulse.json` directives are aligned.

## Verification Plan

### Automated Tests

1. **Resonance Script Test:**
   - `npx tsx scripts/resonance_check.ts`
   - Verify it correctly identifies a "stale" pulse (by temporarily modifying the JSON timestamp).

### Manual Verification

- Trigger both `Autonomous Swarm Cycle` and `Quantum Self-Evolution` manually from the GitHub Actions UI and ensure they both complete without "Push Rejected" errors.
