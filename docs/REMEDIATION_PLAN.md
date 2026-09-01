# AppForge Remediation Plan

## Objectives
- Establish reliable quality gates.
- Reduce security exposure from dependency vulnerabilities.
- Improve repo hygiene and signal-to-noise.
- Move frontend bundles toward budget compliance.

## Phase 1 (Immediate)
1. Enforce `lint`, `typecheck:app`, tests, and build in CI.
2. Track and remediate high-severity audit findings first.
3. Remove duplicated and drift-prone config values in production env templates.

## Phase 2 (Hardening)
1. Split typechecking into package scopes (`src`, `functions`, `swarm`) with independent baselines.
2. Incrementally retire `checkJs` on legacy folders after JS-to-TS migration milestones.
3. Gate bundle regressions with `stats.html` diff thresholds and chunk budget checks.

## Phase 3 (Sustainability)
1. Stop tracking generated diagnostics artifacts; preserve only canonical docs.
2. Add quarterly dependency review and pin/upgrade cadence.
3. Add ownership map for high-risk subsystems (auth, payments, external integrations).

## KPIs
- CI pass rate > 95% on default branch.
- Zero high vulnerabilities in production dependency set.
- Initial route payload under documented budget.
- Typecheck error trend line decreasing week-over-week.
