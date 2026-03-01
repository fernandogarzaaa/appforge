## Kimi-enhanced version
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env.clawd from the project root (one level up from src/)
_env_path = Path(__file__).parent.parent / ".env.clawd"
load_dotenv(_env_path)

# Stability/Safe mode flags
ENABLE_QUANTUM: bool = bool(int(os.getenv("ENABLE_QUANTUM", "0")))
ENABLE_HYPER: bool = bool(int(os.getenv("ENABLE_HYPER", "0")))
ENABLE_OPTIMIZER: bool = bool(int(os.getenv("ENABLE_OPTIMIZER", "0")))
ENABLE_CACHE: bool = bool(int(os.getenv("ENABLE_CACHE", "0")))
MAX_PRIMARY_MODELS: int = int(os.getenv("MAX_PRIMARY_MODELS", "1"))
MAX_FALLBACK_MODELS: int = int(os.getenv("MAX_FALLBACK_MODELS", "0"))
MAX_TOTAL_MODEL_CALLS: int = int(os.getenv("MAX_TOTAL_MODEL_CALLS", "2"))
MAX_REFINEMENT_DEPTH: int = int(os.getenv("MAX_REFINEMENT_DEPTH", "1"))
MAX_TOTAL_TOKENS: int = int(os.getenv("MAX_TOTAL_TOKENS", "8000"))

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
CLAWD_PORT: int = int(os.getenv("CLAWD_PORT", "7860"))
CLAWD_HOST: str = os.getenv("CLAWD_HOST", "0.0.0.0")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# Default max tokens for completions
MAX_TOKENS_DEFAULT: int = int(os.getenv("MAX_TOKENS_DEFAULT", "4096"))

# Free models to query in parallel (best quality + diversity)
# Added moonshot/kimi-2.5 and documented keys for moonshot and arcee-ai
# moonshot API key: sk-OXZr5TRxHz3qe72Bdp2kec7dVOwqVW4bgDaGoOpvQSpNpVQl
# arcee-ai API key: rcai-dbd4c8ce9cb5944a085201c3f1be2db6
_DEFAULT_MODELS: list[str] = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-coder:free",
    "deepseek/deepseek-r1-0528:free",
    "google/gemma-3-27b-it:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "moonshot/kimi-2.5:free",
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

CACHE_SIMILARITY_THRESHOLD: float = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.92"))
CACHE_MAX_ENTRIES: int = int(os.getenv("CACHE_MAX_ENTRIES", "500"))
MAX_CALLS_PER_MINUTE: int = int(os.getenv("MAX_CALLS_PER_MINUTE", "10"))
# Kimi API key (paid): set KIMI_API_KEY in .env.clawd if available
KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")
# NVIDIA API key: set NVIDIA_API_KEY in .env.clawd for Qwen access
NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
CACHE_SIMILARITY_THRESHOLD: float = 0.92
MAX_RETRIES: int = 2
REQUEST_TIMEOUT: float = 60.0
