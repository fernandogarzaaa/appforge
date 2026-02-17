# AppForge Holographic Architecture & Development Guide

## Overview
AppForge utilizes a **Holographic Architecture**, meaning the codebase is self-aware and constantly evolving via the **Quantum Swarm**. This document maps the critical structures that enable this autonomy.

## 📂 Core Structure

### `swarm/` - The Hive Mind
The autonomous agentic core.
- **`core/`**: The brain. Contains `quantum_core.ts` (decision engine), `loop.ts` (autonomy daemon), and `reality_sensor.ts` (environment monitor).
- **`agents/`**: The specialized workers (e.g., `BugHunter`, `Optimizer`, `Inception`).
- **`memory/`** & **`data/`**: vector stores and JSON state persistence.
  - `src/data/quantum_state.json`: The collective memory of the swarm.
  - `src/data/quantum_predictions.json`: Future-looking probability map.

### `scripts/` - The Nervous System
Utility scripts that connect the Swarm to the Reality (FileSystem/Git).
- **`fix_environment.ts`**: **CRITICAL**. Ensures the directory structure exists. Run this if you see `ENOENT` errors.
- **`trigger_curiosity.ts`**: Manually invokes the Curiosity Engine.
- **`intelligence_pulse.ts`**: The main heartbeat of the evolution cycle.

## 🛠️ Quantum Evolution Workflow
The `quantum_evolution.yml` GitHub Action drives the self-improvement loop.
1. **Reality Pulse**: Scans the repo for changes (`reality_pulse.ts`).
2. **Diagnostics**: Runs build & lint to generate truth anchors (`build_logs.txt`, `lint_output.json`).
3. **Quantum Core**: Decides on the next best action (`intelligence_pulse.ts`).
4. **Self-Correction**: Commits changes back to the repo (via `Safe-Mode` git identity).

## 🚨 Troubleshooting
**"ENOENT: no such file or directory"**
- The Swarm tries to save memory to a folder that doesn't exist.
- **Fix**: Run `npx tsx scripts/fix_environment.ts`.

**"Unexpected token in JSON"**
- The Reality Sensor read a corrupted lint report.
- **Fix**: This is now patched to auto-recover. Check `build_logs.txt` for the root cause.
