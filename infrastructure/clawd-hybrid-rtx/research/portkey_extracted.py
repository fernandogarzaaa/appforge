"""
portkey_extracted.py — Adapted utilities from Portkey-AI/gateway patterns.

Provides:
  - Weighted random load balancing
  - Guardrail hook pipeline (before/after request)
  - Request retry with exponential backoff
  - Provider health tracking (circuit breaker)

Python 3.12+ · No external dependencies (stdlib only).
"""

from __future__ import annotations

import asyncio
import enum
import logging
import random
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. Load Balancing — Weighted Random Selection
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class Provider:
    """Represents a single LLM provider endpoint."""

    name: str
    base_url: str
    api_key: str = ""
    weight: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)


def select_provider_by_weight(providers: list[Provider]) -> Provider:
    """Select a provider using weighted-random probability.

    Algorithm (mirrors Portkey ``selectProviderByWeight``):
      1. Default weight = 1 for providers without explicit weight.
      2. ``total_weight`` = sum of all weights.
      3. Pick a random float in ``[0, total_weight)``.
      4. Walk the list, subtracting each weight; the first provider
         whose cumulative range covers the random value is returned.

    Raises ``ValueError`` if the list is empty.
    """
    if not providers:
        raise ValueError("Provider list must not be empty")

    total_weight = sum(p.weight for p in providers)
    if total_weight <= 0:
        raise ValueError("Total weight must be > 0")

    r = random.random() * total_weight
    for provider in providers:
        if r < provider.weight:
            return provider
        r -= provider.weight

    # Floating-point edge-case fallback
    return providers[-1]


# ---------------------------------------------------------------------------
# 2. Guardrail / Hook Pipeline
# ---------------------------------------------------------------------------


class HookVerdict(enum.Enum):
    """Outcome of a guardrail check."""

    ALLOW = "allow"
    DENY = "deny"
    TRANSFORM = "transform"


@dataclass(slots=True)
class HookResult:
    """Result returned by a single hook execution."""

    hook_id: str
    verdict: HookVerdict
    message: str = ""
    transformed_body: dict[str, Any] | None = None
    details: dict[str, Any] = field(default_factory=dict)


# Type alias for hook callables
HookFn = Callable[[dict[str, Any], dict[str, Any]], Awaitable[HookResult]]


class HookPipeline:
    """Ordered pipeline of before-request and after-request hooks.

    Mirrors Portkey's ``beforeRequestHookHandler`` / ``afterRequestHookHandler``
    with deny semantics and body transformation support.

    Usage::

        pipeline = HookPipeline()
        pipeline.add_before_hook("profanity_check", my_guardrail_fn)
        pipeline.add_after_hook("pii_scrub", my_pii_scrubber)

        # Before sending to provider
        verdict, body = await pipeline.run_before_hooks(request_body, context)
        if verdict == HookVerdict.DENY:
            return error_response(...)

        response = await call_provider(body)

        # After receiving from provider
        verdict, response = await pipeline.run_after_hooks(response, context)
    """

    def __init__(self) -> None:
        self._before_hooks: list[tuple[str, HookFn]] = []
        self._after_hooks: list[tuple[str, HookFn]] = []

    # -- Registration -------------------------------------------------------

    def add_before_hook(self, hook_id: str, fn: HookFn) -> None:
        self._before_hooks.append((hook_id, fn))

    def add_after_hook(self, hook_id: str, fn: HookFn) -> None:
        self._after_hooks.append((hook_id, fn))

    # -- Execution ----------------------------------------------------------

    async def run_before_hooks(
        self,
        body: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> tuple[HookVerdict, dict[str, Any], list[HookResult]]:
        """Run all before-request hooks in order.

        Returns ``(final_verdict, possibly_transformed_body, results)``.
        On the first ``DENY`` the pipeline short-circuits.
        """
        ctx = context or {}
        results: list[HookResult] = []
        current_body = body

        for hook_id, fn in self._before_hooks:
            result = await fn(current_body, ctx)
            result.hook_id = hook_id
            results.append(result)

            if result.verdict == HookVerdict.DENY:
                logger.warning("Before-hook '%s' denied the request", hook_id)
                return HookVerdict.DENY, current_body, results

            if (
                result.verdict == HookVerdict.TRANSFORM
                and result.transformed_body is not None
            ):
                current_body = result.transformed_body

        return HookVerdict.ALLOW, current_body, results

    async def run_after_hooks(
        self,
        response_body: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> tuple[HookVerdict, dict[str, Any], list[HookResult]]:
        """Run all after-request hooks in order.

        Returns ``(final_verdict, possibly_transformed_response, results)``.
        """
        ctx = context or {}
        results: list[HookResult] = []
        current = response_body

        for hook_id, fn in self._after_hooks:
            result = await fn(current, ctx)
            result.hook_id = hook_id
            results.append(result)

            if result.verdict == HookVerdict.DENY:
                logger.warning("After-hook '%s' denied the response", hook_id)
                return HookVerdict.DENY, current, results

            if (
                result.verdict == HookVerdict.TRANSFORM
                and result.transformed_body is not None
            ):
                current = result.transformed_body

        return HookVerdict.ALLOW, current, results


# ---------------------------------------------------------------------------
# 3. Retry with Exponential Backoff
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class RetryConfig:
    """Retry configuration (mirrors Portkey's retry object)."""

    max_attempts: int = 3
    on_status_codes: list[int] = field(default_factory=lambda: [429, 500, 502, 503, 504])
    initial_delay_s: float = 0.5
    max_delay_s: float = 30.0
    backoff_multiplier: float = 2.0
    use_retry_after_header: bool = True
    request_timeout_s: float = 60.0


@dataclass(slots=True)
class RetryResult:
    """Outcome of a retried request."""

    response: dict[str, Any] | None
    status_code: int
    attempts_made: int
    created_at: float  # time.monotonic() timestamp
    exhausted: bool = False  # True if all retries were consumed without success


async def retry_request(
    request_fn: Callable[[], Awaitable[tuple[int, dict[str, Any]]]],
    config: RetryConfig | None = None,
) -> RetryResult:
    """Execute ``request_fn`` with exponential backoff retry.

    ``request_fn`` must return ``(status_code, response_body)``.

    Mirrors Portkey's two-layer retry:
      - Transport-level retry (this function).
      - Semantic retry (caller can re-invoke after hook evaluation).

    Example::

        async def call_openai():
            resp = await httpx.post(...)
            return resp.status_code, resp.json()

        result = await retry_request(call_openai, RetryConfig(max_attempts=3))
    """
    cfg = config or RetryConfig()
    delay = cfg.initial_delay_s

    for attempt in range(1, cfg.max_attempts + 1):
        created_at = time.monotonic()
        try:
            status_code, body = await asyncio.wait_for(
                request_fn(),
                timeout=cfg.request_timeout_s,
            )
        except TimeoutError:
            logger.warning(
                "Request timed out (attempt %d/%d, timeout=%.1fs)",
                attempt,
                cfg.max_attempts,
                cfg.request_timeout_s,
            )
            status_code, body = 504, {"error": "request_timeout"}
        except Exception as exc:
            logger.exception("Request failed (attempt %d/%d)", attempt, cfg.max_attempts)
            status_code, body = 500, {"error": str(exc)}

        # Success or non-retriable status
        if status_code not in cfg.on_status_codes:
            return RetryResult(
                response=body,
                status_code=status_code,
                attempts_made=attempt,
                created_at=created_at,
            )

        # Last attempt — don't sleep
        if attempt == cfg.max_attempts:
            break

        # Honour Retry-After header if present
        retry_after: float | None = None
        if cfg.use_retry_after_header and isinstance(body, dict):
            raw = body.get("retry_after")
            if raw is not None:
                try:
                    retry_after = float(raw)
                except (TypeError, ValueError):
                    pass

        sleep_time = retry_after if retry_after is not None else delay
        sleep_time = min(sleep_time, cfg.max_delay_s)

        logger.info(
            "Retrying in %.2fs (attempt %d/%d, status=%d)",
            sleep_time,
            attempt,
            cfg.max_attempts,
            status_code,
        )
        await asyncio.sleep(sleep_time)

        # Exponential backoff for next iteration
        delay = min(delay * cfg.backoff_multiplier, cfg.max_delay_s)

    return RetryResult(
        response=body,
        status_code=status_code,
        attempts_made=cfg.max_attempts,
        created_at=created_at,
        exhausted=True,
    )


# ---------------------------------------------------------------------------
# 4. Provider Health Tracking (Circuit Breaker)
# ---------------------------------------------------------------------------


class CircuitState(enum.Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Healthy — requests flow normally
    OPEN = "open"  # Unhealthy — requests are blocked
    HALF_OPEN = "half_open"  # Probing — one test request allowed


@dataclass
class CircuitBreakerConfig:
    """Configuration for per-provider circuit breakers."""

    failure_threshold: int = 5  # consecutive failures to trip
    success_threshold: int = 2  # consecutive successes to close
    open_duration_s: float = 30.0  # how long to stay open before probing
    monitored_status_codes: list[int] = field(
        default_factory=lambda: [500, 502, 503, 504],
    )


@dataclass
class _ProviderCircuit:
    state: CircuitState = CircuitState.CLOSED
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    last_failure_time: float = 0.0
    config: CircuitBreakerConfig = field(default_factory=CircuitBreakerConfig)


class ProviderHealthTracker:
    """Per-provider circuit breaker inspired by Portkey's ``handleCircuitBreakerResponse``.

    Filters unhealthy providers from the selection pool. If *all* providers
    are unhealthy the filter is bypassed (graceful degradation, matching
    Portkey's behaviour).

    Usage::

        tracker = ProviderHealthTracker()

        # Before selecting a provider
        healthy = tracker.get_healthy_providers(all_providers)
        chosen = select_provider_by_weight(healthy)

        # After receiving a response
        tracker.record_response(chosen.name, status_code=200)
    """

    def __init__(self, config: CircuitBreakerConfig | None = None) -> None:
        self._config = config or CircuitBreakerConfig()
        self._circuits: dict[str, _ProviderCircuit] = {}

    def _get_circuit(self, provider_name: str) -> _ProviderCircuit:
        if provider_name not in self._circuits:
            self._circuits[provider_name] = _ProviderCircuit(config=self._config)
        return self._circuits[provider_name]

    def is_healthy(self, provider_name: str) -> bool:
        """Check if a provider is currently accepting requests."""
        circuit = self._get_circuit(provider_name)

        if circuit.state == CircuitState.CLOSED:
            return True

        if circuit.state == CircuitState.OPEN:
            elapsed = time.monotonic() - circuit.last_failure_time
            if elapsed >= circuit.config.open_duration_s:
                # Transition to half-open: allow a probe request
                circuit.state = CircuitState.HALF_OPEN
                circuit.consecutive_successes = 0
                logger.info(
                    "Circuit for '%s' transitioning to HALF_OPEN after %.1fs",
                    provider_name,
                    elapsed,
                )
                return True
            return False

        # HALF_OPEN — allow traffic for probing
        return True

    def get_healthy_providers(self, providers: list[Provider]) -> list[Provider]:
        """Return healthy providers; falls back to full list if none are healthy."""
        healthy = [p for p in providers if self.is_healthy(p.name)]
        if not healthy:
            logger.warning(
                "All %d providers are unhealthy — bypassing circuit breaker (graceful degradation)",
                len(providers),
            )
            return providers
        return healthy

    def record_response(self, provider_name: str, status_code: int) -> None:
        """Update circuit state based on a response status code."""
        circuit = self._get_circuit(provider_name)
        is_failure = status_code in circuit.config.monitored_status_codes

        if is_failure:
            circuit.consecutive_successes = 0
            circuit.consecutive_failures += 1
            circuit.last_failure_time = time.monotonic()

            if circuit.state == CircuitState.HALF_OPEN:
                # Probe failed — re-open
                circuit.state = CircuitState.OPEN
                logger.warning(
                    "Circuit for '%s' re-opened (probe failed, status=%d)",
                    provider_name,
                    status_code,
                )
            elif circuit.consecutive_failures >= circuit.config.failure_threshold:
                circuit.state = CircuitState.OPEN
                logger.warning(
                    "Circuit for '%s' opened after %d consecutive failures",
                    provider_name,
                    circuit.consecutive_failures,
                )
        else:
            circuit.consecutive_failures = 0
            circuit.consecutive_successes += 1

            if circuit.state == CircuitState.HALF_OPEN:
                if circuit.consecutive_successes >= circuit.config.success_threshold:
                    circuit.state = CircuitState.CLOSED
                    logger.info(
                        "Circuit for '%s' closed after %d consecutive successes",
                        provider_name,
                        circuit.consecutive_successes,
                    )
            elif circuit.state == CircuitState.OPEN:
                # Shouldn't normally happen, but handle gracefully
                circuit.state = CircuitState.HALF_OPEN

    def get_status(self) -> dict[str, dict[str, Any]]:
        """Return a snapshot of all circuit states for monitoring."""
        return {
            name: {
                "state": c.state.value,
                "consecutive_failures": c.consecutive_failures,
                "consecutive_successes": c.consecutive_successes,
                "last_failure_time": c.last_failure_time,
            }
            for name, c in self._circuits.items()
        }


# ---------------------------------------------------------------------------
# 5. Integrated Gateway Dispatcher (Combines All Patterns)
# ---------------------------------------------------------------------------


class GatewayDispatcher:
    """High-level dispatcher combining load balancing, hooks, retry, and health tracking.

    Example::

        dispatcher = GatewayDispatcher(
            providers=[
                Provider("openai", "https://api.openai.com/v1", weight=3),
                Provider("anthropic", "https://api.anthropic.com", weight=1),
            ],
        )
        dispatcher.hooks.add_before_hook("input_guard", my_guardrail)

        result = await dispatcher.dispatch(
            request_body={"model": "gpt-4", "messages": [...]},
            request_fn_factory=lambda provider: make_request(provider),
        )
    """

    def __init__(
        self,
        providers: list[Provider],
        retry_config: RetryConfig | None = None,
        cb_config: CircuitBreakerConfig | None = None,
    ) -> None:
        self.providers = providers
        self.hooks = HookPipeline()
        self.retry_config = retry_config or RetryConfig()
        self.health = ProviderHealthTracker(cb_config)

    async def dispatch(
        self,
        request_body: dict[str, Any],
        request_fn_factory: Callable[[Provider, dict[str, Any]], Awaitable[tuple[int, dict[str, Any]]]],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Full dispatch pipeline: hooks → select → retry → hooks → return."""
        ctx = context or {}

        # 1. Before-request hooks (input guardrails / mutators)
        verdict, body, before_results = await self.hooks.run_before_hooks(
            request_body, ctx,
        )
        if verdict == HookVerdict.DENY:
            return {
                "error": {
                    "message": "Request denied by input guardrail",
                    "type": "hooks_failed",
                    "hook_results": [r.__dict__ for r in before_results],
                },
                "status_code": 446,
            }

        # 2. Select provider (weighted random with health filtering)
        healthy = self.health.get_healthy_providers(self.providers)
        provider = select_provider_by_weight(healthy)

        # 3. Retry loop
        async def _do_request() -> tuple[int, dict[str, Any]]:
            return await request_fn_factory(provider, body)

        result = await retry_request(_do_request, self.retry_config)

        # 4. Record health
        self.health.record_response(provider.name, result.status_code)

        # 5. After-request hooks (output guardrails / mutators)
        response = result.response or {}
        verdict, response, after_results = await self.hooks.run_after_hooks(
            response, ctx,
        )

        return {
            "provider": provider.name,
            "status_code": result.status_code,
            "attempts": result.attempts_made,
            "exhausted": result.exhausted,
            "response": response,
            **(
                {"hook_denied": True, "hook_results": [r.__dict__ for r in after_results]}
                if verdict == HookVerdict.DENY
                else {}
            ),
        }


# ---------------------------------------------------------------------------
# Smoke test (runs with: python portkey_extracted.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import asyncio

    async def _smoke() -> None:
        providers = [
            Provider("openai", "https://api.openai.com/v1", weight=3),
            Provider("anthropic", "https://api.anthropic.com", weight=1),
            Provider("local", "http://localhost:8080", weight=0.5),
        ]

        # Quick load-balancing distribution test
        counts: dict[str, int] = {p.name: 0 for p in providers}
        for _ in range(10_000):
            chosen = select_provider_by_weight(providers)
            counts[chosen.name] += 1
        print("Load balancing distribution (10k samples):")
        total = sum(counts.values())
        for name, count in counts.items():
            print(f"  {name}: {count} ({count / total:.1%})")

        # Hook pipeline test
        async def deny_bad_words(body: dict[str, Any], _ctx: dict[str, Any]) -> HookResult:
            text = str(body.get("messages", ""))
            if "BLOCKED" in text:
                return HookResult(hook_id="", verdict=HookVerdict.DENY, message="Bad word detected")
            return HookResult(hook_id="", verdict=HookVerdict.ALLOW)

        pipeline = HookPipeline()
        pipeline.add_before_hook("profanity", deny_bad_words)

        v, b, _ = await pipeline.run_before_hooks({"messages": "hello world"}, {})
        assert v == HookVerdict.ALLOW
        v, b, _ = await pipeline.run_before_hooks({"messages": "BLOCKED content"}, {})
        assert v == HookVerdict.DENY
        print("Hook pipeline: OK")

        # Health tracker test
        tracker = ProviderHealthTracker(CircuitBreakerConfig(failure_threshold=3))
        for _ in range(3):
            tracker.record_response("openai", 500)
        assert not tracker.is_healthy("openai")
        print("Circuit breaker: OK")

        # Retry test
        call_count = 0

        async def flaky_request() -> tuple[int, dict[str, Any]]:
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                return 503, {"error": "unavailable"}
            return 200, {"result": "ok"}

        result = await retry_request(
            flaky_request,
            RetryConfig(max_attempts=5, initial_delay_s=0.01),
        )
        assert result.status_code == 200
        assert result.attempts_made == 3
        print(f"Retry with backoff: OK (succeeded on attempt {result.attempts_made})")

        print("\nAll smoke tests passed!")

    asyncio.run(_smoke())
