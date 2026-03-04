# AppForge Deep Evaluation & Improvement Plan (2026-03-04)

## Executive Summary

AppForge already has strong breadth (frontend, backend, swarm orchestration, autonomous engine, Rust/WASM modules), but the next major gains should come from **stability-first convergence** rather than immediate swarm proliferation.

Key finding: the project is feature-rich and test-rich, yet has a **type-safety and architecture coherence gap** that will slow safe autonomous evolution if not addressed first.

---

## Evidence Snapshot

### What is healthy now
- Linting currently passes (`eslint . --quiet`).
- Unit/integration test baseline is strong: `918 passed`, `5 skipped`, `72 passed file suites`, `1 skipped`.
- Existing swarm command surface is already large (`scripts/run_*_swarm.ts`: 12 scripts).
- Functional surface area is already large (`functions/*.ts`: 74 files).

### What is limiting scale
- Typecheck is currently non-green with broad failures across `functions`, `src`, generated WASM JS wrappers, and third-party JS traversal from current config.
- A concrete syntax break existed in `src/autonomous/hooks.ts` (now fixed in this change), which had prevented meaningful typecheck progress.
- Several very large frontend/logic files suggest decomposition opportunities before adding more agents:
  - `src/pages/AIAssistant.jsx` (1625 lines)
  - `src/pages/BotBuilder.jsx` (1516 lines)
  - `src/utils/projectGenerator.js` (1351 lines)
  - `src/utils/QuantumEngine.js` (1205 lines)
  - `src/lib/QuantumEngine.js` (1159 lines)

---

## Should We Create More Swarms Right Now?

**Recommendation: not immediately.**

Create new swarms **only after** the platform reaches a stable quality gate baseline (typecheck, deterministic contracts, and clearer module boundaries). Otherwise, more swarms will mostly amplify noise, duplicate effort, and produce conflicting patches.

A better sequence:
1. Stabilize platform contracts and quality gates.
2. Introduce focused “health swarms” that reduce risk.
3. Expand product swarms after reliability metrics are consistently green.

---

## Highest-ROI Improvements (Prioritized)

## P0 (Start now): Reliability foundation

1. **Typecheck Restoration Program**
   - Split TS configs by domain (`src`, `functions`, `swarm`) to isolate failures.
   - Exclude generated files from strict analysis (`src/quantum-core/pkg/**`, `src/static-analyzer-core/pkg/**`) or type-stub them.
   - Resolve Deno-style `npm:` imports in `functions` build path and align module resolution strategy.

2. **Quality Gate Contract**
   - Promote a hard CI gate stack: `lint` + `typecheck` + `test`.
   - Add fail-fast reporting with grouped owner labels (frontend/core/functions/swarm).

3. **Large-File Decomposition Pass**
   - Break 1000+ line modules into composable services/hooks/components.
   - Target first: `AIAssistant`, `BotBuilder`, and both QuantumEngine JS modules.

## P1 (Next): Architecture coherence

4. **Single Source of Truth for Quantum Layer**
   - Unify duplicated Quantum engine responsibilities between `src/utils/QuantumEngine.js` and `src/lib/QuantumEngine.js`.
   - Define one canonical API and one compatibility adapter.

5. **Functions Runtime Contract**
   - Clarify Node vs Deno expectations in `functions/*` and codify in docs + config.
   - Provide typed runtime helpers to eliminate repeated environment and response-shape drift.

6. **Test Signal Quality Upgrade**
   - Resolve recurring `act(...)` warnings and React Router future flag warnings to improve CI signal-to-noise.
   - Separate “expected warning logs” from regressions.

## P2 (Then): Controlled swarm expansion

7. **Swarm Registry + Capability Matrix**
   - Add a central registry documenting each swarm’s:
     - inputs
     - authority scope
     - mutation boundaries
     - required verification hooks

8. **Mutation Budgeting**
   - Require any swarm-produced patch to satisfy a minimum quality score and bounded file-change scope unless explicitly escalated.

---

## Recommended New Swarms (After P0 health gates)

If you want to expand swarm count, prioritize these three:

1. **SWARM-013: Type Guardian Swarm**
   - Agents: TS Cartographer, Contract Enforcer, Build Healer, Typing Scribe
   - Mission: drive typecheck toward green and prevent regressions.

2. **SWARM-014: Codebase Surgeon Swarm**
   - Agents: Decomposer, Coupling Mapper, API Extractor, Regression Sentinel
   - Mission: split oversized files and reduce architectural entropy.

3. **SWARM-015: Runtime Boundary Swarm**
   - Agents: Runtime Auditor, Deno/Node Harmonizer, Dependency Gatekeeper, Security Verifier
   - Mission: enforce consistent execution/runtime contracts in `functions` and service edges.

---

## Recommended New Functions (Platform-Level)

1. `functions/getPlatformHealthSnapshot.ts`
   - Returns lint/type/test status + failing domains.

2. `functions/validateSwarmMutation.ts`
   - Enforces mutation policy: scope, tests required, risk scoring.

3. `functions/registerSwarmCapability.ts`
   - Updates central swarm registry with authority + quality requirements.

4. `functions/generateRefactorBlueprint.ts`
   - Emits decomposition plans for oversized modules with dependency maps.

---

## 30/60/90-Day Roadmap

### Day 0-30
- Green `lint` + baseline `typecheck` for `src` domain.
- Resolve syntax/runtime-contract blockers.
- Introduce swarm mutation policy draft.

### Day 31-60
- Expand type health to `functions` + `swarm` domains.
- Decompose top 3 largest modules.
- Activate Type Guardian swarm.

### Day 61-90
- Add Runtime Boundary and Codebase Surgeon swarms.
- Enforce registry-driven governance for all autonomous changes.
- Track DORA-like + autonomous quality metrics monthly.

---

## Decision Rule

When deciding “more swarms vs more functions,” use this:

- Add a **function** when capability is missing but execution model is clear.
- Add a **swarm** only when the workflow requires multi-step reasoning, conflict resolution, and verification loops across domains.
- Never add either if foundational quality gates are red.

