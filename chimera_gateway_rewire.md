# CHIMERA Gateway Rewire Plan

## Objective
Rewire the existing InsForge AI Gateway to completely abandon external LLM routing (OpenRouter / InsForge Cloud) and exclusively communicate with **CHIMERA Ultimate** locally at `http://localhost:7870/v1`.

## Target Files and Modification Strategy

### 1. Core Provider Hardwiring
**File:** `D:\appforge-main\InsForge\backend\src\providers\ai\openrouter.provider.ts`

**Modifications:**
*   **`createClient(apiKey: string)`:**
    *   Change the `baseURL` property from `'https://openrouter.ai/api/v1'` to `'http://localhost:7870/v1'`.
    *   Update `defaultHeaders` to remove references to `insforge.dev` and instead set `'HTTP-Referer': 'http://localhost:7870'` and `'X-Title': 'CHIMERA'`.
*   **`getApiKey()`:**
    *   Remove cloud environment checks and `process.env.OPENROUTER_API_KEY` requirements.
    *   Hardcode the return value to a local dummy key: `return 'chimera-local';`.
*   **`isConfigured()`:**
    *   Hardcode to `return true;` to trick the frontend into believing AI is fully set up.
*   **`getRemainingCredits()`:**
    *   Remove all external API `fetch()` calls to `api.insforge.dev` or `openrouter.ai/api/v1/key`.
    *   Return a static dummy payload representing infinite local credits: `return { usage: 0, limit: 1000000, remaining: 1000000 };`.
*   **`fetchCloudApiKey()` & `renewCloudApiKey()`:**
    *   Remove internal JWT signing and remote fetching entirely.
    *   Make both methods simply `return 'chimera-local';` resolving the promises instantly.
*   **`sendRequest()`:**
    *   Remove the `402` and `403` error handling logic (which tries to re-fetch/renew keys). With CHIMERA being local and having infinite mocked credits, this logic is dead code.
    *   Simplify to just `const client = await this.getClient(); return await request(client);`.

### 2. Model Discovery Syncing
**File:** `D:\appforge-main\InsForge\backend\src\services\ai\ai-model.service.ts`

**Modifications:**
*   **`getModels()`:**
    *   Replace the dynamic `apiUrl` generation (which checks `isCloudEnvironment()` to route between `api.insforge.dev` or `openrouter.ai`) with a hardcoded CHIMERA endpoint: `const apiUrl = 'http://localhost:7870/v1/models';`.
    *   **Note on Safety:** The existing data mapping in `helpers.ts` (`calculatePricePerMillion` and `filterAndSortModalities`) correctly handles `undefined` pricing and architecture. Since CHIMERA returns standard OpenAI models (which lack OpenRouter pricing metadata), prices will safely default to `0` and input/output modalities will default to `[]`. This prevents any crashes on the frontend.

## Resulting Architecture
By completing this rewire:
1.  **Zero External Telemetry:** All LLM inference, embedding generation, and image generation automatically funnel through CHIMERA Ultimate.
2.  **No Codebase Wide Refactoring Needed:** `chat-completion.service.ts`, `embedding.service.ts`, and `image-generation.service.ts` are left untouched. They all utilize `OpenRouterProvider.getInstance().sendRequest()`, meaning the single chokepoint handles the redirect universally.
3.  **Local-First Offline Compatibility:** The UI will read infinite credits and accurately list local models pulled from the CHIMERA manifest, matching the offline-first mandate for the AppForge ecosystem.
