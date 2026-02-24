"""Configuration loading from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
CLAWD_PORT: int = int(os.getenv("CLAWD_PORT", "7860"))
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# Free models to query in parallel
MODELS: list[str] = [
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openchat/openchat-7b:free",
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
]

# Consensus settings
CACHE_SIMILARITY_THRESHOLD: float = 0.92
MAX_RETRIES: int = 2
REQUEST_TIMEOUT: float = 30.0
