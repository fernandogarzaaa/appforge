# LiteLLM Architecture — Reverse-Engineering Notes

> **Source:** BerriAI/litellm (GitHub `main` branch, fetched 2026-02-24)
> **Purpose:** Extract patterns for CHIMERA QUANTUM LLM proxy

---

## 1. Routing Strategies

LiteLLM's `Router` class supports **6 pluggable routing strategies**, selected at init via a `routing_strategy` string:

| Strategy | Key | Description |
|---|---|---|
| **Simple Shuffle** | `simple-shuffle` (default) | Random selection among healthy deployments. Zero overhead. |
| **Least Busy** | `least-busy` | Routes to the deployment with the fewest in-flight requests. Tracks via input callbacks. |
| **Usage-Based (TPM/RPM)** | `usage-based-routing` | Picks deployment with lowest tokens-per-minute / requests-per-minute usage. |
| **Usage-Based v2** | `usage-based-routing-v2` | Same goal as v1, but uses `redis.incr` for atomic cross-instance counting & `mget` for batch reads. |
| **Latency-Based** | `latency-based-routing` | Picks deployment with lowest average response latency (or TTFT for streaming). Uses a sliding window of the last N measurements. |
| **Cost-Based** | `cost-based-routing` | Picks the cheapest deployment (by `input_cost_per_token + output_cost_per_token`), while still respecting TPM/RPM limits. |

### 1.1 Routing Strategy Architecture

Each strategy is a **`CustomLogger` subclass** that hooks into LiteLLM's callback system:

```
litellm.callbacks → [LowestLatencyLoggingHandler, ...]
litellm.success_callback → [router.sync_deployment_callback_on_success, ...]
litellm._async_failure_callback → [router.async_deployment_callback_on_failure, ...]
```

**Key insight:** Routing decisions are made **before** the call, but the data they rely on is collected **after** each call via success/failure callbacks. This is an event-driven architecture — no polling.

### 1.2 Latency-Based Routing (Deep Dive)

- Maintains a cache key `{model_group}_map` → `{deployment_id: {latency: [floats], time_to_first_token: [floats], "HH-MM": {tpm, rpm}}}`
- Latency is normalized: `response_time / completion_tokens` (per-token latency)
- For streaming: tracks TTFT (time to first token) separately
- Sliding window: max `max_latency_list_size` (default 10) entries
- Selection: finds lowest latency, then all deployments within `lowest_latency_buffer` × lowest_latency, picks randomly from that set
- On timeout failures: injects a **1000s penalty** latency to push deployment down

### 1.3 Usage-Based v2 Routing (Deep Dive)

- **Per-deployment atomic counters** using `redis.incr` (not model-group-wide maps)
- Keys: `{model_id}:{model_name}:tpm:{HH-MM}` and `{model_id}:{model_name}:rpm:{HH-MM}`
- TTL: 60 seconds (auto-expire, no cleanup needed)
- **Pre-call check:** increments RPM *before* the call inside a semaphore, raises `RateLimitError` immediately if over limit
- Uses `batch_get_cache` (Redis `MGET`) to fetch all deployment TPM/RPM values in a single round-trip

### 1.4 Cost-Based Routing (Deep Dive)

- Looks up `input_cost_per_token` + `output_cost_per_token` from `litellm.model_cost` map
- Allows override via `litellm_params.input_cost_per_token` per deployment
- Falls back to $5.0/token (intentionally absurd) for unknown models → they get deprioritized
- Sorts by cost, picks the cheapest that hasn't exceeded TPM/RPM limits

---

## 2. Cost Tracking Approach

### 2.1 Architecture

```
completion_cost()
  → _select_model_name_for_cost_calc()    # resolve model name
  → _infer_call_type()                     # detect: completion/embedding/speech/rerank/etc.
  → cost_per_token()                       # dispatch to provider-specific calculators
      → [provider]_cost_per_token()        # anthropic, openai, bedrock, gemini, etc.
      OR → generic_cost_per_token()        # fallback using model_cost map
```

### 2.2 Model Cost Database

- **Single JSON file:** `model_prices_and_context_window.json` — maps `{provider}/{model}` → pricing info
- Loaded once as `litellm.model_cost` (dict in memory)
- Lookup priority:
  1. `{provider}/{region}/{model}` (most specific, region-based pricing)
  2. `{provider}/{model}` (provider-prefixed)
  3. `{model}` (bare model name)

### 2.3 Provider-Specific Cost Calculators

Each major provider gets its own `cost_per_token()`:
- **OpenAI:** handles service tiers (default, scale, flex), cached tokens, audio tokens
- **Anthropic:** handles cache creation/read tokens at different rates
- **Bedrock:** region-based pricing, on-demand vs provisioned
- **Gemini/Vertex AI:** routes between per-character and per-token pricing; maps `trafficType` → service tier
- **DeepSeek, Fireworks, Perplexity, XAI, etc.:** each has specialized logic

### 2.4 Custom Pricing Support

```python
custom_cost_per_token = {"input_cost_per_token": 0.001, "output_cost_per_token": 0.002}
custom_cost_per_second = 0.05  # for time-based models (Replicate, etc.)
```

Checked **first**, before any model lookup — allows per-deployment overrides.

### 2.5 Discounts & Margins

- `litellm.cost_discount_config` — per-provider discount percentages (e.g., `{"openai": 0.05}`)
- `litellm.cost_margin_config` — per-provider or global markups (percentage + fixed amount)
- Applied in order: base cost → discount → margin → final cost

### 2.6 Additional Cost Components

- **Built-in tool costs** (e.g., web search, code interpreter): tracked separately via `StandardBuiltInToolCostTracking`
- **Additional costs** (e.g., Azure model router flat fees): provider-specific, returned as a dict
- **Cost breakdown** stored in logging object for observability

---

## 3. Rate Limit Handling

### 3.1 Multi-Layer Defense

```
Layer 1: Pre-call check (TPM/RPM v2 strategy)
  → Atomic increment + check BEFORE making the API call
  → Uses semaphore for concurrency safety

Layer 2: Cooldown mechanism
  → On failure: increment failure counter for deployment
  → If failures > allowed_fails within 1 minute → add to cooldown
  → Cooldown = skip deployment for N seconds (default from DEFAULT_COOLDOWN_TIME_SECONDS)
  → CooldownCache tracks which deployments are in cooldown

Layer 3: Retry + Fallback
  → Configurable retries per exception type (RetryPolicy)
  → Model-group-level retry policies
  → Fallback chains: model_group → fallback_model_group
  → Context window fallbacks (if prompt too long, try smaller model)
  → Content policy fallbacks (if content filtered, try different provider)

Layer 4: Budget limiting
  → RouterBudgetLimiting: per-provider daily/monthly budgets
  → Pre-call check that blocks if budget exceeded
```

### 3.2 CooldownCache Pattern

```python
# On failure:
failed_calls.increment(deployment_id)
if failed_calls[deployment_id] > allowed_fails:
    cooldown_cache.add(deployment_id, cooldown_time=60)

# On routing:
healthy = [d for d in deployments if d.id not in cooldown_cache]
```

### 3.3 Retry Policy

```python
RetryPolicy(
    BadRequestErrorRetries=0,          # don't retry bad requests
    AuthenticationErrorRetries=0,       # don't retry auth errors
    TimeoutErrorRetries=2,             # retry timeouts
    RateLimitErrorRetries=3,           # retry rate limits
    ContentPolicyViolationErrorRetries=1,
    InternalServerErrorRetries=2,
)
```

### 3.4 Fallback Chains

```python
fallbacks = [{"gpt-4": ["gpt-3.5-turbo", "claude-3"]}]
default_fallbacks = ["gpt-3.5-turbo"]  # applied to all model groups via {"*": [...]}
context_window_fallbacks = [{"gpt-3.5-turbo": ["gpt-3.5-turbo-16k"]}]
```

---

## 4. Key Patterns We Should Adopt

### 4.1 ✅ Model Group Abstraction

LiteLLM's best pattern: users reference a `model_name` (e.g., `"gpt-4"`) which maps to multiple deployments (different API keys, regions, providers). The router picks the best deployment transparently.

```python
model_list = [
    {"model_name": "gpt-4", "litellm_params": {"model": "openai/gpt-4", "api_key": "sk-1"}},
    {"model_name": "gpt-4", "litellm_params": {"model": "azure/gpt-4", "api_key": "az-1"}},
]
```

**Adopt:** Define our "model groups" similarly. A request for `model=claude-3-opus` can fan out across multiple API keys or even different providers.

### 4.2 ✅ DualCache (Local + Redis)

Cache is **always** local (in-memory) + optionally Redis. This gives:
- Sub-millisecond reads for routing decisions (local)
- Cross-instance consistency (Redis)
- Graceful degradation if Redis is down

**Adopt:** We should use the same pattern. Local dict for hot-path routing, Redis for multi-instance sync.

### 4.3 ✅ Callback-Driven Metrics Collection

All routing strategies collect data via `log_success_event` / `log_failure_event` callbacks. This decouples metrics from the call path — the call just happens, and async callbacks update routing state.

**Adopt:** Our proxy should have a callback pipeline. Each routing strategy registers listeners.

### 4.4 ✅ Pre-Call Check Pattern

Usage-Based v2 does a pre-call check *inside a semaphore* to atomically:
1. Increment the RPM counter
2. Check if over limit
3. Raise immediately if so (no wasted API call)

**Adopt:** Critical for preventing cascading rate limit failures.

### 4.5 ✅ Cooldown with Automatic Recovery

Instead of permanently removing failed deployments, they get a time-boxed cooldown. After cooldown expires, they're automatically retried. This handles transient outages gracefully.

**Adopt:** Implement cooldown with configurable per-exception-type durations.

### 4.6 ✅ Tag-Based Routing

Deployments can be tagged (e.g., `tags: ["eu", "hipaa"]`) and requests can filter by tag. This enables compliance-aware routing.

**Adopt:** Essential for our multi-region setup.

### 4.7 ✅ Pattern Match Router

`PatternMatchRouter` handles wildcard model names (e.g., `openai/*` matches any OpenAI model). This enables catch-all deployments.

**Adopt:** Useful for our provider-level routing.

### 4.8 ⚠️ Things to Improve On

1. **Latency tracking normalization:** LiteLLM divides by completion_tokens which can give misleading results for short responses. We should track raw P50/P95/P99 instead.
2. **Cost-based routing uses combined input+output cost:** This doesn't account for different input/output ratios. We should weight by expected usage pattern.
3. **Single-threaded cache updates in v1:** The v2 pattern with atomic `incr` is much better. We should use atomic operations from the start.
4. **No weighted routing:** All strategies pick one deployment. We should support weighted distribution (e.g., 70/30 split).
5. **Callback ordering:** LiteLLM appends to global callback lists which can have ordering issues. We should use a proper event bus.

---

## 5. Architecture Summary

```
Request
  │
  ├─ Model Group Resolution (alias → group → deployments)
  │     └─ Pattern matching for wildcards
  │
  ├─ Pre-Call Checks
  │     ├─ Tag filtering
  │     ├─ Context window check
  │     ├─ Rate limit check (atomic incr)
  │     ├─ Budget check
  │     └─ Prompt caching affinity
  │
  ├─ Cooldown Filtering
  │     └─ Remove deployments in cooldown
  │
  ├─ Routing Strategy Selection
  │     ├─ simple-shuffle → random.choice(healthy)
  │     ├─ least-busy → min(in_flight_requests)
  │     ├─ usage-based → min(tpm_usage)
  │     ├─ latency-based → min(avg_latency) + buffer
  │     └─ cost-based → min(cost_per_token)
  │
  ├─ API Call
  │
  ├─ Post-Call Callbacks
  │     ├─ Update routing metrics (latency, TPM, RPM)
  │     ├─ Cost calculation
  │     ├─ Success/failure tracking
  │     └─ Cooldown management
  │
  └─ Error Handling
        ├─ Retry (per exception type)
        ├─ Fallback (to different model group)
        └─ Context window / content policy fallback
```
