# Swarm Intelligence Benchmark

Run a reproducible local benchmark for five dimensions:

- `reasoning`
- `planning`
- `coding`
- `autonomy`
- `reliability`

## Commands

```bash
npm run swarm:benchmark
```

Strict profile:

```bash
npm run swarm:benchmark -- --strict
```

Write report to a custom path:

```bash
npm run swarm:benchmark -- --json swarm/benchmarks/my_report.json
```

## Output

The benchmark prints per-dimension scores and an overall verdict:

- `TRUE_HYPER_INTELLIGENCE`
- `ADVANCED_AUTONOMOUS`
- `DEVELOPING`

It also writes JSON reports to:

- `swarm/benchmarks/latest_intelligence_report.json`
- `swarm/benchmarks/swarm_intelligence_report_<timestamp>.json`

## Notes

- This benchmark is local and deterministic enough for regression tracking.
- It is not a scientific AGI certification.
- Reasoning includes adversarial prompts to reduce keyword-only score inflation.
