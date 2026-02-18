# Implementation Plan - Phase 65: Syncing the Hive Mind

**Objective:** Connect the `QuantumSwarmCore` to the local "Neural Bridge" (Port 8000), allowing the entire Swarm to utilize the fine-tuned "Iron Brain" model for decision making.

## User Review Required
>
> [!IMPORTANT]
> **Architecture Upgrade:** The `QuantumSwarmCore` is moving from a simulated "Holographic" engine to a **Real-Time Neural Interface**. All Swarm decisions (from `loop.ts`) will now be processed by your fine-tuned Llama-3.2-3B model.

## Proposed Changes

### 1. Quantum Core Upgrade (`quantum_core.ts`)

#### [MODIFY] [swarm/core/quantum_core.ts](file:///c:/Users/ferna/Downloads/appforge-main/swarm/core/quantum_core.ts)

- **New Method:** `consultNeuralBridge(question, options)`
  - Payload: Maps the question and options into a structured prompt.
  - Endpoint: `POST http://localhost:8000/v1/chat/completions`
  - Model: `iron-brain-v1`
- **Logic Change:** inside `consultOracle`:
  - Check `process.env.TRUE_AI_INDEPENDENCE === 'true'`.
  - Try `consultNeuralBridge`.
  - If successful, return the result (with `engineVersion: 'Iron-Brain-v1'`).
  - If failed (ECONNREFUSED), log warning and fall back to `this.engine.quantumSolve`.

### 2. Verification Script

#### [NEW] [scripts/verify_hive_mind.ts](file:///c:/Users/ferna/Downloads/appforge-main/scripts/verify_hive_mind.ts)

- Imports `quantumCore`.
- Asks a strategic question via `consultOracle`.
- Asserts that the response comes from the Neural Bridge.
- Logs the "Thinking Process" or response quality.

## Verification Plan

### Automated Tests

- **Pre-requisite:** Ensure `launch_neural_bridge.bat` is running (Port 8000 active).
- **Execution:** `npx tsx scripts/verify_hive_mind.ts`
- **Success Criteria:**
  - Output shows `✨ Neural Bridge Oracle (Iron-Brain-v1)`.
  - Response contains intelligent reasoning, not just random selection.
  - Fallback mechanism works if bridge is killed.

### Manual Verification

- **User Action:** Run the verification script.
- **Observation:** Console logs should indicate "NEURAL BRIDGE ACTIVE".
