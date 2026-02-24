"""
Clawd Hybrid RTX LLM - Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env.clawd from project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env.clawd"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 7860

    # OpenRouter
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Free models (no cost)
    free_models: list[str] = [
        "mistralai/mistral-7b-instruct:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "openchat/openchat-7b:free",
        "nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
    ]

    # Rate limits per model
    max_requests_per_minute: int = 20
    ensemble_size: int = 5

    # Semantic cache
    cache_enabled: bool = True
    cache_threshold: float = 0.92
    cache_max_size: int = 10000
    cache_dir: str = str(Path(__file__).parent.parent / "cache")

    # RTX 2060 settings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_device: str = "cuda"  # Use RTX 2060

    # Quantum consensus
    coherence_target: float = 0.95
    min_responses_for_consensus: int = 3

    class Config:
        env_prefix = "CLAWD_"


settings = Settings()
