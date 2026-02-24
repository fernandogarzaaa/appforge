"""
CHIMERA QUANTUM — Model Auto-Discovery
=======================================

Periodically scrapes OpenRouter's /api/v1/models endpoint to discover
new free models. Updates the active model list and persists to disk.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path

import httpx

logger = logging.getLogger("chimera-quantum.discovery")

_DATA_DIR = Path(__file__).parent.parent / "data"
_DISCOVERY_FILE = _DATA_DIR / "discovered_models.json"
_MIN_CONTEXT = 8192  # Minimum context length to consider


@dataclass
class DiscoveredModel:
    id: str
    name: str
    context_length: int
    modality: str = "text"
    discovered_at: float = field(default_factory=time.time)
    quality_score: float = 0.5  # 0-1 estimated quality


def fetch_free_models(timeout: float = 15.0) -> list[DiscoveredModel]:
    """Fetch all free models from OpenRouter API."""
    try:
        resp = httpx.get("https://openrouter.ai/api/v1/models", timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch models from OpenRouter: {e}")
        return []

    free_models: list[DiscoveredModel] = []
    for m in data.get("data", []):
        pricing = m.get("pricing", {})
        prompt_cost = pricing.get("prompt", "1")
        completion_cost = pricing.get("completion", "1")

        # Only free models
        if prompt_cost != "0" or completion_cost != "0":
            continue

        ctx = m.get("top_provider", {}).get("context_length", 0) or 0
        if ctx < _MIN_CONTEXT:
            continue

        # Only text-capable models
        output_modalities = m.get("architecture", {}).get("output_modalities", [])
        if "text" not in output_modalities:
            continue

        # Estimate quality from context length and name
        quality = _estimate_quality(m)

        free_models.append(DiscoveredModel(
            id=m["id"],
            name=m.get("name", m["id"]),
            context_length=ctx,
            modality=m.get("architecture", {}).get("modality", "text"),
            quality_score=quality,
        ))

    # Sort by quality descending
    free_models.sort(key=lambda x: x.quality_score, reverse=True)
    logger.info(f"Discovered {len(free_models)} free models from OpenRouter")
    return free_models


def _estimate_quality(model_data: dict) -> float:
    """Heuristic quality score based on model metadata."""
    score = 0.5
    mid = model_data.get("id", "").lower()
    name = model_data.get("name", "").lower()
    ctx = model_data.get("top_provider", {}).get("context_length", 0) or 0

    # Bonus for known high-quality families
    quality_families = {
        "llama-3.3": 0.3, "llama-3.2": 0.2, "llama-3.1": 0.15,
        "qwen3": 0.3, "qwen2": 0.2,
        "gemma-3": 0.25, "gemma-2": 0.15,
        "deepseek-r1": 0.3, "deepseek-v3": 0.25,
        "mistral-small-3": 0.25, "mistral-nemo": 0.2,
        "nemotron": 0.2,
        "hermes-3": 0.25,
        "command-r": 0.2,
    }
    for family, bonus in quality_families.items():
        if family in mid or family in name:
            score += bonus
            break

    # Bonus for large context
    if ctx >= 128000:
        score += 0.1
    elif ctx >= 32000:
        score += 0.05

    # Bonus for parameter count hints in name
    import re
    param_match = re.search(r"(\d+)[bB]", name)
    if param_match:
        params = int(param_match.group(1))
        if params >= 70:
            score += 0.2
        elif params >= 30:
            score += 0.1
        elif params >= 8:
            score += 0.05

    # Penalty for very small models
    if "1b" in mid or "1.5b" in mid or "2b" in mid:
        score -= 0.1

    return min(max(score, 0.0), 1.0)


def save_discovered(models: list[DiscoveredModel]) -> None:
    """Persist discovered models to disk."""
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        "last_updated": time.time(),
        "count": len(models),
        "models": [asdict(m) for m in models],
    }
    _DISCOVERY_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    logger.info(f"Saved {len(models)} discovered models to {_DISCOVERY_FILE}")


def load_discovered() -> list[DiscoveredModel]:
    """Load previously discovered models from disk."""
    if not _DISCOVERY_FILE.exists():
        return []
    try:
        data = json.loads(_DISCOVERY_FILE.read_text(encoding="utf-8"))
        return [DiscoveredModel(**m) for m in data.get("models", [])]
    except Exception as e:
        logger.warning(f"Failed to load discovered models: {e}")
        return []


def get_best_free_models(
    n_primary: int = 5,
    n_fallback: int = 3,
    refresh: bool = False,
) -> tuple[list[str], list[str]]:
    """Return (primary_models, fallback_models) — the best free models available.

    If refresh=True or no cache exists, fetches fresh from OpenRouter.
    """
    models = load_discovered()

    if refresh or not models:
        models = fetch_free_models()
        if models:
            save_discovered(models)

    if not models:
        # Return hardcoded defaults
        return (
            [
                "meta-llama/llama-3.3-70b-instruct:free",
                "qwen/qwen3-coder:free",
                "deepseek/deepseek-r1-0528:free",
                "google/gemma-3-27b-it:free",
                "mistralai/mistral-small-3.1-24b-instruct:free",
            ],
            [
                "nousresearch/hermes-3-llama-3.1-405b:free",
                "arcee-ai/trinity-large-preview:free",
                "nvidia/nemotron-3-nano-30b-a3b:free",
            ],
        )

    primary = [m.id for m in models[:n_primary]]
    fallback = [m.id for m in models[n_primary:n_primary + n_fallback]]
    return primary, fallback


def needs_refresh(max_age_hours: float = 24.0) -> bool:
    """Check if the discovered models cache is stale."""
    if not _DISCOVERY_FILE.exists():
        return True
    try:
        data = json.loads(_DISCOVERY_FILE.read_text(encoding="utf-8"))
        last = data.get("last_updated", 0)
        age_hours = (time.time() - last) / 3600
        return age_hours > max_age_hours
    except Exception:
        return True
