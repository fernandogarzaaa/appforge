# Evolution Report

## Cycle Entry Template
- Timestamp:
- Best genome:
- Composite score:
- Delta from previous best:
- Plateau status:
- Mutation intensity:
- Pareto movement:
- Economic score:
- Dataset growth:
- Checkpoint delta:
- Drift warnings:

## Example Entry
- Timestamp: 2026-02-23T06:20:00Z
- Best genome: `{ "strategyType": "tree_of_thought", "parameters": { "treeDepth": 4, "usesStaticAnalysis": true, "reasoningBudget": 7 }, "mutationIntensity": 0.32 }`
- Composite score: `0.9012`
- Delta from previous best: `+0.0141`
- Plateau status: `false`
- Mutation intensity: `normal`
- Pareto movement: `{ "frontierChangesPerCycle": 2, "nonDominatedGenomes": ["tree_of_thought", "multi_debate"] }`
- Economic score: `0.00008122`
- Dataset growth: `{ "datasetVersion": 8, "newSamples": 4 }`
- Checkpoint delta: `{ "previous": 7, "current": 8 }`
- Drift warnings: `none`
