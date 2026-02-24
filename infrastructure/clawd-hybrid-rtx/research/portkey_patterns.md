# Portkey AI Gateway — Extracted Architectural Patterns

> **Source:** `Portkey-AI/gateway` (GitHub, `main` branch)
> **Files studied:** `src/handlers/handlerUtils.ts`, `src/providers/openai/chatComplete.ts`
> **Date:** 2026-02-24

---

## 1. Speed Optimization Strategies

### 1.1 Response Caching Layer
Portkey intercepts every provider call through a `CacheService`. Before making a network request, the gateway checks for a cached response keyed by request context + headers. On cache hit the response is returned immediately — no provider call is made.

```
CacheService.getCachedResponse(requestContext, headers)
  → cacheHit? return cached response
  → cacheMiss? proceed to provider
```

**Key design points:**
- Cache lookup happens *after* guardrail/hook evaluation but *before* the actual HTTP call, so denied requests are never cached.
- Cache metadata (`cacheStatus`, `cacheKey`) is threaded into the log object for observability.
- Streaming responses can be cached as well (the gateway reconstructs SSE chunks from a JSON-to-stream transformer — see `OpenAIChatCompleteJSONToStreamResponseTransform`).

### 1.2 Streaming-First Response Transformation
The `OpenAIChatCompleteJSONToStreamResponseTransform` converts a full JSON response into chunked SSE events. Content is split into 500-character slices to simulate real-time streaming even when the upstream provider returned a single JSON blob. This lets downstream clients start processing immediately.

### 1.3 Request Body Construction — Zero-Copy Where Possible
`constructRequestBody` checks the content type and hands off the raw body form:
- `FormData` → forwarded as-is (multipart)
- `ReadableStream` → streamed through without buffering
- `ArrayBuffer` → forwarded for audio proxying
- JSON → serialized once with `JSON.stringify`

GET/DELETE requests never attach a body, avoiding unnecessary serialization.

### 1.4 Header Minimization
Unnecessary headers (`content-length`, brotli in `accept-encoding`, internal `x-portkey-*` prefixed headers) are stripped before forwarding. This reduces request overhead and avoids Cloudflare edge issues.

---

## 2. Guardrails / Middleware Hooks

### 2.1 Hook Lifecycle
Portkey defines a **before/after request hook pipeline**:

```
┌─────────────────────────────┐
│  beforeRequestHookHandler   │  ← input guardrails, input mutators
│  (syncBeforeRequestHook)    │
├─────────────────────────────┤
│  Provider HTTP Call         │  ← retries, caching, timeout
├─────────────────────────────┤
│  afterRequestHookHandler    │  ← output guardrails, output mutators
│  (recursiveAfterRequestHook)│
└─────────────────────────────┘
```

### 2.2 Hook Types
Hooks are typed via `HookType` enum:
- **GUARDRAIL** — validation checks; can **deny** the request (status 446) or flag the response.
- **MUTATOR** — transforms the request/response body in-flight.

### 2.3 Guardrail Shorthand → Hook Conversion
`convertHooksShorthand` normalises user-facing guardrail config into internal hook objects:
- Extracts control keys: `deny`, `on_fail`, `on_success`, `async`, `sequential`, `guardrail_version_id`
- Remaining keys become `checks[]`, each with `id` (namespaced as `default.<name>` if not qualified) and `parameters`.
- Generates random hook IDs for tracing.

### 2.4 Deny Semantics
If `shouldDeny` is true after before-request hooks, Portkey returns a **446** status with structured error:
```json
{
  "error": { "message": "...", "type": "hooks_failed" },
  "hook_results": { "before_request_hooks": [...], "after_request_hooks": [] }
}
```

### 2.5 Config Inheritance
Hooks, guardrails, and mutators **inherit** down the target tree:
- Parent `defaultInputGuardrails` / `defaultOutputGuardrails` are propagated to children.
- Child-level hooks override parent hooks of the same phase.
- `beforeRequestHooks` and `afterRequestHooks` are merged arrays, not replaced.

---

## 3. Load Balancing Algorithms

### 3.1 Weighted Random Selection
Primary algorithm: **weighted random**. Implemented in both `selectProviderByWeight` and the `LOADBALANCE` strategy mode.

```
Algorithm:
1. Default weight = 1 for any provider without explicit weight.
2. totalWeight = sum of all provider weights.
3. randomWeight = random() * totalWeight
4. Iterate providers; subtract each weight from randomWeight.
   First provider where randomWeight < weight is selected.
```

This is O(n) with n = number of providers. Probability of selection = weight / totalWeight.

### 3.2 Strategy Modes
`tryTargetsRecursively` implements four modes via `StrategyModes`:

| Mode | Behaviour |
|------|-----------|
| `FALLBACK` | Try targets sequentially; stop on success or gateway exception. Optionally filter on `onStatusCodes`. |
| `LOADBALANCE` | Weighted random selection (see above). |
| `CONDITIONAL` | Route based on metadata, request params, or URL path via `ConditionalRouter`. |
| `SINGLE` | Always pick the first target. |

### 3.3 Circuit Breaker Integration
Before strategy execution, unhealthy targets (`isOpen === true`) are filtered out. If all targets are unhealthy, the filter is bypassed (graceful degradation). Health state is managed externally via `handleCircuitBreakerResponse` on the Hono context.

---

## 4. Retry / Fallback Patterns

### 4.1 Retry Configuration
Retry behaviour is configured per-target with inheritance:
```typescript
retry: {
  attempts: number;         // max retry count
  onStatusCodes: number[];  // only retry on these status codes
  useRetryAfterHeader: boolean; // honour Retry-After from upstream
}
```

### 4.2 Retry Execution (`retryRequest`)
The `retryRequest` utility wraps the actual HTTP fetch:
- Respects `requestTimeout` per attempt.
- Returns `{ response, attempt, createdAt, skip }`.
- `skip=true` means retries were aborted (e.g., non-retriable error).

### 4.3 Recursive After-Request Hook Retry
`recursiveAfterRequestHookHandler` adds a second retry layer *after* response hooks:
1. Make the provider call (with built-in retries).
2. Run after-request hooks (output guardrails).
3. If the hook-processed response still has a retriable status code AND remaining retries exist → **recurse**.
4. Tracks `retryAttemptsMade` across recursion to enforce the global retry budget.
5. When all retries are exhausted, sets `retryCount = -1` as a sentinel.

### 4.4 Fallback Strategy
In `FALLBACK` mode:
- Targets are tried in order.
- A target is skipped if `response.status` is in `strategy.onStatusCodes` (or simply if `!response.ok`).
- Gateway exceptions (`x-portkey-gateway-exception: true`) always break the fallback chain — they represent internal errors that shouldn't cascade.

### 4.5 Config Inheritance for Retry
Retry config merges from parent to child: child `retry` overrides parent entirely (no deep merge). This lets leaf providers opt into different retry budgets.

---

## 5. Provider Abstraction & Request Transformation

### 5.1 Provider Config Schema
Each provider defines a `ProviderConfig` that maps OpenAI-compatible parameter names to provider-specific ones:
```typescript
{
  model: { param: 'model', required: true, default: 'gpt-3.5-turbo' },
  temperature: { param: 'temperature', default: 1, min: 0, max: 2 },
  // ...
}
```
This enables parameter validation (min/max), defaults, and cross-provider normalization.

### 5.2 Response Normalization
All provider responses are mapped to a unified `ChatCompletionResponse` interface. Error responses go through provider-specific transformers (e.g., `OpenAIErrorResponseTransform`).

### 5.3 Request Context & Provider Context
- `RequestContext` — encapsulates the inbound request (headers, body, method, endpoint, streaming flag, timeout, retry config).
- `ProviderContext` — wraps provider-specific logic (header generation, URL construction, optional custom request handlers).

---

## 6. Observability

### 6.1 Structured Logging
Every request builds a `LogObjectBuilder` that accumulates:
- Request context (provider, model, params)
- Response data (status, body, token usage)
- Cache metadata
- Hook span ID (for distributed tracing)
- Execution time

Logs are emitted via `LogsService` at the end of each request path (including retries — each attempt is logged independently).

### 6.2 Hook Span Tracing
Each hook execution is wrapped in a `HookSpan` with a unique ID. This span is threaded through the entire request lifecycle, enabling correlation between guardrail evaluations and the final response.

---

## 7. Key Takeaways for CHIMERA QUANTUM

1. **Cache before call** — always check cache after validation but before network I/O.
2. **Weighted random is sufficient** — no need for complex algorithms; simple weighted random with O(n) scan works well at gateway scale.
3. **Two-layer retry** — combine transport-level retry (`retryRequest`) with semantic retry (after hook evaluation).
4. **Hook pipeline with deny semantics** — before/after hooks that can block, transform, or passthrough.
5. **Config inheritance** — recursive target trees with merged config reduce duplication.
6. **Circuit breaker as filter** — don't remove unhealthy providers from config; just skip them at selection time.
7. **Stream everything** — even JSON responses can be converted to SSE for uniform client handling.
