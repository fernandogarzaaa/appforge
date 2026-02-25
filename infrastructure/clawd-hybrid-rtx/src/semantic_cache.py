"""Simple dict-based semantic cache using numpy cosine similarity."""

import logging
import time
from dataclasses import dataclass, field

import numpy as np

from .config import CACHE_SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)

# Cache TTL in seconds (1 hour)
CACHE_TTL: float = 3600.0


@dataclass
class CacheEntry:
    key_vector: np.ndarray
    response: dict
    timestamp: float = field(default_factory=time.time)


class SemanticCache:
        def extract_cache_key(self, messages):
            user_parts = [m.get("content") for m in messages if m.get("role") == "user"]
            key = " ".join(user_parts)
            logger.debug(f"SemanticCache: cache key = '{key}'")
            return key

    """In-memory semantic cache with cosine similarity matching."""

    def __init__(self, threshold: float = CACHE_SIMILARITY_THRESHOLD, dim: int = 256):
        self.threshold = threshold
        self.dim = dim
        self._entries: list[CacheEntry] = []

    def _messages_to_vector(self, messages: list[dict]) -> np.ndarray:
        """Convert user message content to a vector for similarity comparison."""
        text = self.extract_cache_key(messages).lower()
        vec = np.zeros(self.dim, dtype=np.float64)
        for i in range(len(text) - 1):
            bigram_hash = hash(text[i : i + 2]) % self.dim
            vec[bigram_hash] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def put(self, messages, response):
        key = self.extract_cache_key(messages)
        # Prune empty/whitespace responses
        content = None
        if isinstance(response, dict):
            choices = response.get('choices')
            if choices and isinstance(choices, list):
                message = choices[0].get('message') if choices else None
                if message:
                    content = message.get('content')
        if content is None or not content.strip():
            logger.warning(f"SemanticCache: Rejecting empty response for key '{key}'")
            return
            logger.info(f"SemanticCache: rejected empty response for key '{key}'")
            return
        entry = CacheEntry(self._messages_to_vector(messages), response)
        self._entries.append(entry)
        logger.info(f"SemanticCache: cached response for key '{key}' (len={len(content)})")

    def _cosine_sim(self, a: np.ndarray, b: np.ndarray) -> float:
        dot = np.dot(a, b)
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na == 0 or nb == 0:
            return 0.0
        return float(dot / (na * nb))

    def _evict_expired(self) -> None:
        """Remove entries older than TTL."""
        now = time.time()
        self._entries = [e for e in self._entries if (now - e.timestamp) < CACHE_TTL]

    def get(self, messages: list[dict]) -> dict | None:
        """Look up a cached response by semantic similarity."""
        self._evict_expired()
        query_vec = self._messages_to_vector(messages)

        best_sim = 0.0
        best_entry: CacheEntry | None = None

        for entry in self._entries:
            sim = self._cosine_sim(query_vec, entry.key_vector)
            if sim > best_sim:
                best_sim = sim
                best_entry = entry

        if best_entry is not None and best_sim >= self.threshold:
            logger.info(f"Cache hit (similarity={best_sim:.4f})")
            return best_entry.response

            # If result is empty or only whitespace, treat as cache miss
            if best_entry is not None:
                content = None
                if isinstance(best_entry.response, dict):
                    choices = best_entry.response.get('choices')
                    if choices and isinstance(choices, list):
                        message = choices[0].get('message') if choices else None
                        if message:
                            content = message.get('content')
                if content is not None and (not content or str(content).strip() == ""):
                    return None
            return best_entry.response

    def put(self, messages: list[dict], response: dict) -> None:
        """Store a response in the cache, reject empty/whitespace-only responses."""
        # Extract content from OpenAI response format
        content = ""
        try:
            if response and "choices" in response and response["choices"]:
                content = response["choices"][0]["message"]["content"]
        except Exception:
            logger.warning("Cache put: failed to extract content from response.")
        if not content or not str(content).strip():
            logger.info("Cache put: rejected empty or whitespace-only response.")
            return
        key_vec = self._messages_to_vector(messages)
        self._entries.append(CacheEntry(key_vector=key_vec, response=response))
        logger.debug(f"Cached response (total entries: {len(self._entries)})")

    def clear(self) -> None:
        """Clear all cache entries."""
        self._entries.clear()

    @property
    def size(self) -> int:
        return len(self._entries)
