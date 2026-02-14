# Gemini Skills Synergy: Integration Overview

This document tracks the evolution of the Sovereign Intelligence core via the integration of Gemini 3 Pro/Flash capabilities and standardized "skills" patterns.

## 🌌 Core Upgrades
- **Models**: Migrated from legacy `gemini-1.5` patterns to `gemini-3-pro-preview` and `gemini-3-flash-preview`.
- **SDK**: Transitioned to the unified `@google/genai` ecosystem for future-proof API compatibility.
- **Structured Outputs**: Implemented native JSON schema validation for high-fidelity swarm coordination.

## 🛠️ Components
### Gemini Skill Adapter
The `GeminiSkillAdapter` serves as the primary cognitive bridge. It supports:
- **Dynamic Routing**: Automatic selection between Flash (speed) and Pro (depth).
- **Instruction Anchoring**: System prompt anchoring via `startChat` history.
- **Holographic JSON**: Native schema enforcement for complex tasks.

## 🐝 Swarm Adaptation
Agents can now dynamically load "skills" from the `.agents/skills` library, which provides curated knowledge and tool definitions sourced from the `google-gemini/gemini-skills` repository.

## 🎯 Verification
- `scripts/intelligence_benchmark.ts` updated to measure Gemini 3 synthesis fidelity.
- Live Oracle dashboard now displays reasoning traces from the new high-fidelity core.
