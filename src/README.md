# AppForge Intelligence Evaluation (Scoped)

This scoped README documents the measurable-intelligence pipeline under `src/swarm/evolution`, `src/swarm/reasoning`, and `src/swarm/training`.

## What this project is
- A swarm-orchestrated AI platform with autonomous mutation loops.
- This module enforces deterministic benchmark tracking, anti-gaming gates, Pareto-aware multi-objective evolution, and simulated self-improving training loops.

## Multi-objective intelligence evaluation
- Benchmark accuracy, cost, latency, robustness, and hallucination penalty are scored in `multiObjectiveScoring.ts`.
- Pareto frontier tracking keeps non-dominated genomes and rejects efficiency-collapsing candidates.
- Cross-seed evaluation computes variance and stability index for each selected strategy/genome.

## Real-world + training pressure
- `benchmarks/realworld/tasks.json` provides deterministic bug-fix/test-gen/refactor tasks.
- `realWorldHarness.ts` evaluates compilation success, test pass rate, diff correctness, and patch minimality.
- `dataGeneration.ts` builds synthetic training datasets from hard failures.
- `modelAdapter.ts` provides a pluggable fine-tune/evaluate checkpoint abstraction (simulated now).
- `economicScoring.ts` computes cost-aware metrics and economic score.

## PR gate policy
PR eligibility now requires:
1. anti-regression + delta constraints
2. mutation safety guard pass
3. Pareto frontier improvement (non-dominated movement)

## How to run
- `npx vitest run tests/evolution`
