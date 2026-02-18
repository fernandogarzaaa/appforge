# Implementation Plan - Local LLM Sovereignty

The user wants to ensure the system runs **entirely** on their own LLM (Iron Brain / Sovereign Model), with no external API calls (OpenAI, Anthropic, Gemini).

## Audit Findings

- **`swarm/core/llm.ts`**:
  - `MultiLLMClient` tries `ironBrain` (Local), then `sovereignModel` (Local), then `sovereignLLM` (Synthetic/Local), and finally `Antigravity` (Quantum/External?).
  - `AntigravityLLMProvider` routes requests via `Base44` audit logs. This might be an external path if Base44 is external.
- **`swarm/core/brain_v1.ts`**: Likely the interface to the local GGUF model.
- **`swarm/core/sovereign_model.ts`**: Likely the interface to Ollama or similar.
- **`swarm/core/sovereign_llm.ts`**: A "Synthetic Layer".

## Proposed Changes

1. **Enforce Local Priority in `swarm/core/llm.ts`**:
    - Ensure `ironBrain` and `sovereignModel` are the *only* active paths if "TRUE_AI_INDEPENDENCE" is set.
    - Disable `Antigravity` routing if it implies external dependency, unless it's a confirmed local loop.
2. **Verify `Iron Brain` Configuration**:
    - Check `brain_v1.ts` to ensure it talks to `localhost` (e.g., port 8000 or 11434).
3. **Update Workflows**:
    - Remove `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` from `autonomous_swarm.yml` to prevent accidental usage.
    - Set `TRUE_AI_INDEPENDENCE: "true"` as a global default.

## Verification

- **Manual Test**: Run `scripts/reality_pulse.ts` and check logs to confirm it uses `Iron Brain` or `Sovereign Model` and does *not* try to contact OpenAI/Anthropic.
- **Code Check**: Grep for `fetch('https://api.openai.com` etc. to ensure no hidden calls.
