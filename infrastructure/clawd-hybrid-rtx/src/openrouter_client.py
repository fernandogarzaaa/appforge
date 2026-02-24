"""Async HTTP client for querying OpenRouter models in parallel."""

import asyncio
import logging
from dataclasses import dataclass

import httpx

from .config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, MODELS, MAX_RETRIES, REQUEST_TIMEOUT

logger = logging.getLogger(__name__)


@dataclass
class ModelResponse:
    model: str
    content: str
    finish_reason: str | None = None
    usage: dict | None = None
    error: str | None = None


async def query_single_model(
    client: httpx.AsyncClient,
    model: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> ModelResponse:
    """Query a single OpenRouter model with retry logic for rate limits."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://clawd-hybrid-rtx.local",
        "X-Title": "Clawd Hybrid RTX",
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

            if resp.status_code == 429:
                # Rate limited — back off and retry
                retry_after = float(resp.headers.get("retry-after", str(2 ** attempt)))
                logger.warning(f"Rate limited on {model}, retrying in {retry_after}s (attempt {attempt + 1})")
                await asyncio.sleep(retry_after)
                continue

            if resp.status_code != 200:
                error_text = resp.text[:200]
                logger.error(f"Error from {model}: {resp.status_code} - {error_text}")
                return ModelResponse(model=model, content="", error=f"HTTP {resp.status_code}: {error_text}")

            data = resp.json()

            # Handle OpenRouter error responses inside 200
            if "error" in data:
                err_msg = data["error"].get("message", str(data["error"]))
                logger.error(f"API error from {model}: {err_msg}")
                return ModelResponse(model=model, content="", error=err_msg)

            choices = data.get("choices", [])
            if not choices:
                return ModelResponse(model=model, content="", error="No choices returned")

            content = choices[0].get("message", {}).get("content", "")
            finish_reason = choices[0].get("finish_reason")
            usage = data.get("usage")

            return ModelResponse(
                model=model,
                content=content,
                finish_reason=finish_reason,
                usage=usage,
            )

        except httpx.TimeoutException:
            logger.warning(f"Timeout querying {model} (attempt {attempt + 1})")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1)
                continue
            return ModelResponse(model=model, content="", error="Timeout")

        except Exception as e:
            logger.error(f"Exception querying {model}: {e}")
            return ModelResponse(model=model, content="", error=str(e))

    return ModelResponse(model=model, content="", error="Max retries exceeded")


async def query_all_models(
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int | None = None,
    models: list[str] | None = None,
) -> list[ModelResponse]:
    """Query all configured models in parallel and return responses."""
    target_models = models or MODELS

    async with httpx.AsyncClient() as client:
        tasks = [
            query_single_model(client, model, messages, temperature, max_tokens)
            for model in target_models
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    results: list[ModelResponse] = []
    for i, resp in enumerate(responses):
        if isinstance(resp, Exception):
            results.append(ModelResponse(
                model=target_models[i],
                content="",
                error=str(resp),
            ))
        else:
            results.append(resp)

    return results
