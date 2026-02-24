"""Configuration loading from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env.clawd from the project root (one level up from src/)
_env_path = Path(__file__).parent.parent / ".env.clawd"
load_dotenv(_env_path)

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
CLAWD_PORT: int = int(os.getenv("CLAWD_PORT", "7860"))
CLAWD_HOST: str = os.getenv("CLAWD_HOST", "0.0.0.0")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# Default max tokens for completions
MAX_TOKENS_DEFAULT: int = int(os.getenv("MAX_TOKENS_DEFAULT", "4096"))

# Free models to query in parallel (best quality + diversity)
_DEFAULT_MODELS: list[str] = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-coder:free",
    "deepseek/deepseek-r1-0528:free",
    "google/gemma-3-27b-it:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
]

# Fallback models if primaries fail
FALLBACK_MODELS: list[str] = [
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "arcee-ai/trinity-large-preview:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
]

# Load models from env if available (comma-separated), otherwise use defaults
_env_models = os.getenv("OPENROUTER_MODELS", "")
MODELS: list[str] = (
    [m.strip() for m in _env_models.split(",") if m.strip()]
    if _env_models
    else _DEFAULT_MODELS
)

# Circuit breaker settings
CIRCUIT_BREAKER_THRESHOLD: int = 3        # failures before cooldown
CIRCUIT_BREAKER_COOLDOWN: float = 300.0   # seconds (5 minutes)

# Consensus settings
CACHE_SIMILARITY_THRESHOLD: float = 0.92
MAX_RETRIES: int = 2
REQUEST_TIMEOUT: float = 60.0
