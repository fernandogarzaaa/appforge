# Quantum Self-Evolution Commit Scope Investigation

## Objective
Determine whether `chore: quantum self-evolution` commits affect the entire repository or a focused subset.

## Data Source
GitHub API for `fernandogarzaaa/appforge` using commit search and per-commit file listings.

## Query Used
- Search query: `repo:fernandogarzaaa/appforge "chore: quantum self-evolution"`
- Filter: commit subject starts with `chore: quantum self-evolution`

## Findings
- Matching commits: **88**
- Unique top-level paths touched across all matching commits: **3**
  - `src/` (specifically `src/data/`)
  - `swarm/` (specifically `swarm/core/`)
  - `build_logs.txt`

### Directory concentration
- `src/data`: **393** file-touch events across matching commits
- `swarm/core`: **23** file-touch events
- `build_logs.txt`: **23** file-touch events

### Most frequently modified files
- `src/data/quantum_brain_state.json` — 88 commits
- `src/data/quantum_hyperparameters.json` — 88 commits
- `src/data/quantum_oracle_state.json` — 48 commits
- `src/data/quantum_predictions.json` — 37 commits
- `build_logs.txt` — 23 commits
- `swarm/core/quantum_core.ts` — 23 commits

## Conclusion
The `chore: quantum self-evolution` series is **not repository-wide**. It is highly focused on a narrow subsystem centered on:
- quantum state JSON artifacts under `src/data/`
- occasional orchestration logic updates in `swarm/core/quantum_core.ts`
- associated run logs in `build_logs.txt`

This indicates a constrained evolution loop rather than broad cross-repo mutation.
