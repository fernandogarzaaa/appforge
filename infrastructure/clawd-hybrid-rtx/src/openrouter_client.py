"""Async HTTP client for querying OpenRouter models in parallel.

Includes circuit-breaker, fallback models, request-ID tracking,
and clear 401 diagnostics.
"""

import asyncio
import logging
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field

import httpx

from .config import (
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    MODELS,
    FALLBACK_MODELS,
    MAX_RETRIES,
    REQUEST_TIMEOUT,
    CIRCUIT_BREAKER_THRESHOLD,
    CIRCUIT_BREAKER_COOLDOWN,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Model health / circuit breaker
# ---------------------------------------------------------------------------

@dataclass
class ModelHealth:
    """Tracks per-model success/failure for circuit-breaking."""
    consecutive_failures: int = 0
    total_failures: int = 0
    total_successes: int = 0
    last_failure: float = 0.0
    last_success: float = 0.0
    cooldown_until: float = 0.0
    last_error: str = ""

    @property
    def is_in_cooldown(self) -> bool:
        return time.monotonic() < self.cooldown_until

    def record_success(self) -> None:
        self.consecutive_failures = 0
        self.total_successes += 1
        self.last_success = time.monotonic()
        # Successful call ends any cooldown early
        self.cooldown_until = 0.0

    def record_failure(self, error: str = "") -> None:
        self.consecutive_failures += 1
        self.total_failures += 1
        self.last_failure = time.monotonic()
        self.last_error = error
        if self.consecutive_failures >= CIRCUIT_BREAKER_THRESHOLD:
            self.cooldown_until = time.monotonic() + CIRCUIT_BREAKER_COOLDOWN
            logger.warning(
                "Circuit breaker OPEN for model (cooldown %.0fs): %s — last error: %s",
                CIRCUIT_BREAKER_COOLDOWN,
                error[:120] if error else "(none)",
                error,
            )


def _default_model_health() -> ModelHealth:
    return ModelHealth()


_model_health: dict[str, ModelHealth] = defaultdict(_default_model_health)


def get_healthy_models(models: list[str] | None = None) -> list[str]:
    """Return models from *models* that are NOT currently in cooldown."""
    candidates = models or MODELS
    return [m for m in candidates if not _model_health[m].is_in_cooldown]


def get_model_health_summary() -> dict[str, dict]:
    """Return a JSON-friendly summary of every tracked model's health."""
    return {
        model: {
            "consecutive_failures": h.consecutive_failures,
            "total_failures": h.total_failures,
            "total_successes": h.total_successes,
            "in_cooldown": h.is_in_cooldown,
            "last_error": h.last_error,
        }
        for model, h in _model_health.items()
    }


def _reset_oldest_cooldowns(models: list[str], keep: int = 0) -> list[str]:
    """Reset cooldowns starting from the one that entered cooldown earliest.

    Returns the list of models whose cooldowns were cleared.
    """
    in_cooldown = [
        (m, _model_health[m]) for m in models if _model_health[m].is_in_cooldown
    ]
    if not in_cooldown:
        return []

    # Sort by cooldown_until ascending (oldest cooldown first)
    in_cooldown.sort(key=lambda pair: pair[1].cooldown_until)

    reset_count = max(1, len(in_cooldown) - keep)
    reset_models: list[str] = []
    for m, h in in_cooldown[:reset_count]:
        h.cooldown_until = 0.0
        h.consecutive_failures = 0
        reset_models.append(m)
        logger.info("Reset cooldown for model: %s", m)

    return reset_models


# ---------------------------------------------------------------------------
# Auth-error detection
# ---------------------------------------------------------------------------

_AUTH_ERROR_KEYWORDS = ("user not found", "invalid api key", "unauthorized", "invalid credentials")


def _is_auth_error(status_code: int, body: str) -> bool:
    if status_code == 401:
        return True
    lower = body.lower()
    return any(kw in lower for kw in _AUTH_ERROR_KEYWORDS)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ModelResponse:
    model: str
    content: str
    finish_reason: str | None = None
    usage: dict | None = None
    error: str | None = None
    request_id: str | None = None


# ---------------------------------------------------------------------------
# Single-model query
# ---------------------------------------------------------------------------

async def query_single_model(
    client: httpx.AsyncClient,
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> ModelResponse:
    """Query a single OpenRouter model with retry logic for rate limits.

    Respects circuit-breaker state, tracks health, and fast-fails on auth
    errors so retries aren't wasted.
    """
    health = _model_health[model]

    # Skip models in cooldown
    if health.is_in_cooldown:
        return ModelResponse(
            model=model,
            content="",
            error=f"Model in cooldown until {health.cooldown_until:.0f} — last error: {health.last_error}",
        )

    request_id = str(uuid.uuid4())

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://clawd-hybrid-rtx.local",
        "X-Title": "Clawd Hybrid RTX",
        "X-Request-ID": request_id,
    }

    payload: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens

    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=headers,
                timeout=REQUEST_TIMEOUT,
            )

            # -- Auth error: don't retry, it won't help --
            if _is_auth_error(resp.status_code, resp.text):
                error_msg = (
                    f"HTTP {resp.status_code}: Authentication failed. "
                    "OPENROUTER_API_KEY is invalid or missing. "
                    "Get a free key at https://openrouter.ai/keys"
                )
                logger.error(
                    "[req:%s] Auth error for %s — %s",
                    request_id, model, error_msg,
                )
                health.record_failure(error_msg)
                return ModelResponse(
                    model=model,
                    content="",
                    error=error_msg,
                    request_id=request_id,
                )

            # -- Rate limited --
            if resp.status_code == 429:
                retry_after = float(
                    resp.headers.get("retry-after", str(2 ** attempt))
                )
                logger.warning(
                    "[req:%s] Rate limited on %s, retrying in %ss (attempt %d)",
                    request_id, model, retry_after, attempt + 1,
                )
                await asyncio.sleep(retry_after)
                continue

            # -- Other HTTP errors --
            if resp.status_code != 200:
                error_text = resp.text[:200]
                logger.error(
                    "[req:%s] Error from %s: %d - %s",
                    request_id, model, resp.status_code, error_text,
                )
                health.record_failure(f"HTTP {resp.status_code}: {error_text}")
                return ModelResponse(
                    model=model,
                    content="",
                    error=f"HTTP {resp.status_code}: {error_text}",
                    request_id=request_id,
                )

            data = resp.json()

            # Handle OpenRouter error responses inside 200
            if "error" in data:
                err_msg = data["error"].get("message", str(data["error"]))

                # Auth errors can also hide inside a 200
                if _is_auth_error(200, err_msg):
                    full_msg = (
                        f"Auth error: {err_msg}. "
                        "OPENROUTER_API_KEY is invalid. "
                        "Get a free key at https://openrouter.ai/keys"
                    )
                    logger.error("[req:%s] %s", request_id, full_msg)
                    health.record_failure(full_msg)
                    return ModelResponse(
                        model=model, content="", error=full_msg,
                        request_id=request_id,
                    )

                logger.error(
                    "[req:%s] API error from %s: %s",
                    request_id, model, err_msg,
                )
                health.record_failure(err_msg)
                return ModelResponse(
                    model=model, content="", error=err_msg,
                    request_id=request_id,
                )

            choices = data.get("choices", [])
            if not choices:
                health.record_failure("No choices returned")
                return ModelResponse(
                    model=model, content="", error="No choices returned",
                    request_id=request_id,
                )

            content = choices[0].get("message", {}).get("content", "")
            finish_reason = choices[0].get("finish_reason")
            usage = data.get("usage")

            health.record_success()
            return ModelResponse(
                model=model,
                content=content,
                finish_reason=finish_reason,
                usage=usage,
                request_id=request_id,
            )

        except httpx.TimeoutException:
            logger.warning(
                "[req:%s] Timeout querying %s (attempt %d)",
                request_id, model, attempt + 1,
            )
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1)
                continue
            health.record_failure("Timeout")
            return ModelResponse(
                model=model, content="", error="Timeout",
                request_id=request_id,
            )

        except Exception as e:
            logger.error(
                "[req:%s] Exception querying %s: %s",
                request_id, model, e,
            )
            health.record_failure(str(e))
            return ModelResponse(
                model=model, content="", error=str(e),
                request_id=request_id,
            )

    health.record_failure("Max retries exceeded")
    return ModelResponse(
        model=model, content="", error="Max retries exceeded",
        request_id=request_id,
    )


# ---------------------------------------------------------------------------
# Multi-model query with fallback
# ---------------------------------------------------------------------------

async def query_all_models(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int | None = None,
    models: list[str] | None = None,
) -> list[ModelResponse]:
    """Query all configured models in parallel and return responses.

    Applies circuit-breaker filtering, falls back to FALLBACK_MODELS when
    all primaries are unhealthy, and guarantees at least one response.
    """
    target_models = models or MODELS

    # --- 1. Filter to healthy primary models ---
    healthy = get_healthy_models(target_models)

    if not healthy:
        logger.warning(
            "All %d primary models are in cooldown — trying fallback models",
            len(target_models),
        )
        healthy = get_healthy_models(FALLBACK_MODELS)

        if not healthy:
            logger.warning(
                "All fallback models also in cooldown — resetting oldest cooldowns",
            )
            # Reset cooldowns on primary models so we have something to try
            _reset_oldest_cooldowns(target_models)
            _reset_oldest_cooldowns(FALLBACK_MODELS)
            healthy = get_healthy_models(target_models + FALLBACK_MODELS)

            if not healthy:
                # Last resort: just try everything
                healthy = target_models

    logger.info(
        "Querying %d healthy model(s): %s",
        len(healthy),
        ", ".join(m.split("/")[-1] for m in healthy),
    )

    async with httpx.AsyncClient() as client:
        tasks = [
            query_single_model(client, model, messages, temperature, max_tokens)
            for model in healthy
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    results: list[ModelResponse] = []
    all_auth_errors = True

    for i, resp in enumerate(responses):
        if isinstance(resp, Exception):
            results.append(ModelResponse(
                model=healthy[i],
                content="",
                error=str(resp),
            ))
        else:
            results.append(resp)
            if resp.error is None or "auth" not in (resp.error or "").lower():
                all_auth_errors = False

    # --- 2. If every single response was an auth error, add a helpful message ---
    if all_auth_errors and results:
        results.insert(0, ModelResponse(
            model="system",
            content="",
            error=(
                "ALL models failed with authentication errors. "
                "Your OPENROUTER_API_KEY is invalid or missing. "
                "Get a free key at https://openrouter.ai/keys "
                "and set it in .env.clawd"
            ),
        ))

    # --- 3. If primary models all errored, try fallback models ---
    successful = [r for r in results if r.error is None and r.content]
    if not successful and not all_auth_errors:
        fallback_candidates = get_healthy_models(FALLBACK_MODELS)
        # Exclude models we already tried
        already_tried = set(healthy)
        fallback_candidates = [m for m in fallback_candidates if m not in already_tried]

        if fallback_candidates:
            logger.info(
                "All primary models failed — trying %d fallback model(s)",
                len(fallback_candidates),
            )
            async with httpx.AsyncClient() as client:
                fb_tasks = [
                    query_single_model(
                        client, model, messages, temperature, max_tokens,
                    )
                    for model in fallback_candidates
                ]
                fb_responses = await asyncio.gather(*fb_tasks, return_exceptions=True)

            for i, resp in enumerate(fb_responses):
                if isinstance(resp, Exception):
                    results.append(ModelResponse(
                        model=fallback_candidates[i],
                        content="",
                        error=str(resp),
                    ))
                else:
                    results.append(resp)

    # --- 4. Guarantee at least one response ---
    if not results:
        results.append(ModelResponse(
            model="system",
            content="",
            error="No models available. Check OPENROUTER_API_KEY and network connectivity.",
        ))

    return results
