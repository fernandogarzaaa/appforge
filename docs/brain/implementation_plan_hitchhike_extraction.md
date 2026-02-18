# Implementation Plan - Phase 63: The Hitchhike Extraction

**Objective:** Distill high-quality "Reasoning Traces" from external sources (simulated/API) to create a "Golden Dataset" for Iron Brain, and stabilize CI with a Static Oracle.

## User Review Required
>
> [!IMPORTANT]
> This phase establishes the "Teacher-Student" pipeline. We will initially use a **Simulated Harvester** (using the patterns from `distill.ts` expanded with "Hitchhiker" scenarios) to avoid needing live OpenAI/Gemini API keys immediately, while building the architecture to plug them in later.

## Proposed Changes

### Swarm Factory

#### [NEW] [swarm/factory/harvester.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/factory/harvester.ts)

- Implements `CognitiveHarvester` class.
- *Functionality:* Generates complex architectural prompts (e.g., "Design a Sovereign Auth System").
- *Simulation:* Uses distinct "Teacher Personas" (Gemini-style, Claude-style) to generate diverse reasoning chains.
- *Output:* Raw "dirty" dataset for validation.

#### [NEW] [swarm/factory/quantum_validator.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/factory/quantum_validator.ts)

- Implements `QuantumValidator`.
- *Logic:* Parses "Teacher" outputs.
- *Filters:*
  - ❌ Rejects: "Firebase", "AWS", "Auth0", "OpenAI API" (unless mocked).
  - ✅ Accepts: "Solana", "Local LLM", "SQLite", "Ed25519".
- *Output:* `refined_dataset.jsonl` (Golden Data).

#### [NEW] [swarm/factory/train_appforge.py](file:///c:/Users/ferna/Downloads/appforge-main/swarm/factory/train_appforge.py)

- Based on `train.py` but specialized for the new `refined_dataset.jsonl`.
- *Loss Function:* Standard SFT loss, but we will add a comment placeholder for "Sovereign Penalty" (Constraint-based loss) for future research.

### Core System

#### [MODIFY] [swarm/core/loop.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/loop.ts)

- Integrate `Static Oracle` fallback.
- *Logic:* `if (isCI) { loadStaticOracle() } else { consultLiveOracle() }`

#### [NEW] [swarm/core/static_oracle.json](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/static_oracle.json)

- Validated JSON map of `Query -> Sovereign Response`.
- Derived from the top 50 entries of `refined_dataset.jsonl`.

## Verification Plan

### Automated Tests

- **Harvester Run:** `npx tsx swarm/factory/harvester.ts --dry-run`
  - *Expectation:* Generates ~50 sample entries logged to console.
- **Validation Run:** `npx tsx swarm/factory/quantum_validator.ts`
  - *Expectation:* Filters out simulated "bad" advice (we will inject some intentionally).
- **CI Simulation:** `SET CI=true && npx tsx swarm/core/loop.ts --test-mode`
  - *Expectation:* Loop starts instantly using Static Oracle without model loading.

### Manual Verification

- **Training Script:** `python swarm/factory/train_appforge.py --dry-run`
  - *Expectation:* Unsloth loads, checks dataset, prepares trainer, and exits without error.
