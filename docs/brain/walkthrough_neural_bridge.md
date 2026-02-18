# Walkthrough - Phase 64: The Neural Bridge Activation

**Objective:** Activate the "Iron Brain" by serving the fine-tuned adapter via a custom Python "Neural Bridge" and connecting the Harvester to local Ollama.

## 1. Harvester Upgrade (`harvester.ts`)

We upgraded the Cognitive Harvester to support **True AI Independence**.

- **Ollama Integration:** Added `OllamaService` to query `localhost:11434`.
- **Mode Switching:** Automatically detects `TRUE_AI_INDEPENDENCE` env var.
- **Status:** ready to harvest from local Llama-3 models.

## 2. The Neural Bridge (`inference_server.py`)

We bypassed GGUF conversion issues by building a direct Python Inference Server.

- **Stack:** `FastAPI` + `Unsloth` (4-bit QLoRA).
- **Model:** Loads `Llama-3.2-3B-Instruct` + `hitchhiker-v1` adapter.
- **Port:** `8000` (OpenAI-compatible endpoints).
- **Status:** **ONLINE**.

## 3. Coherence Verification (`verify_coherence.ts`)

We ran a system-wide integrity check.

- **Adapter Check:** ✅ Found `hitchhiker-v1`.
- **Connectivity:** ✅ Neural Bridge responding on Port 8000.
- **Persona Test:** ✅ Model responded to "Who are you?".

## Usage

To start the Neural Bridge:

```bat
scripts\launchers\launch_neural_bridge.bat
```

(Server is currently running in background)

## Next Steps

- **Phase 65:** Full System Integration. Point the main Swarm loop (`loop.ts`) to use `http://localhost:8000/v1` as its primary Oracle, fully replacing the mock/static providers.
