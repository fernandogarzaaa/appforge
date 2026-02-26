## Kimi-enhanced version
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
    """In-memory semantic cache with cosine similarity matching."""

    def __init__(self, threshold: float = CACHE_SIMILARITY_THRESHOLD, dim: int = 256):
        self.threshold = threshold
        self.dim = dim
        self._entries: list[CacheEntry] = []

    def extract_cache_key(self, messages: list[dict]) -> str:
        """Extract cache key from messages (concatenate user content)."""
        user_parts = [m.get("content", "") for m in messages if m.get("role") == "user"]
        key = " ".join(str(p) for p in user_parts)
        logger.debug(f"SemanticCache: cache key = '{key[:100]}...' " if len(key) > 100 else f"SemanticCache: cache key = '{key}'")
        return key

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

    def _extract_content(self, response: dict) -> str:
        """Extract content string from OpenAI-style response."""
        try:
            if response and "choices" in response and response["choices"]:
                return response["choices"][0].get("message", {}).get("content", "")
        except Exception:
            pass
        return ""

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
        logger.info(f"SemanticCache: cache size = {len(self._entries)}")
        if best_entry is not None and best_sim >= self.threshold:
            content = self._extract_content(best_entry.response)
            if not content or not content.strip():
                return None
            if best_sim == 1.0:
                logger.info("Cache hit (exact match)")
            else:
                logger.info(f"Cache hit (similarity={best_sim:.4f})")
            return best_entry.response
        logger.info(f"SemanticCache: cache miss (best similarity={best_sim:.4f})")
        return None

    def put(self, messages: list[dict], response: dict) -> None:
        """Store a response in the cache, reject empty/whitespace-only responses. Enforce max entries and evict oldest 20% if exceeded."""
        content = self._extract_content(response)
        if not content or not content.strip():
            logger.info("Cache put: rejected empty or whitespace-only response.")
            return
        key_vec = self._messages_to_vector(messages)
        self._entries.append(CacheEntry(key_vector=key_vec, response=response))
        from .config import CACHE_MAX_ENTRIES
        if len(self._entries) > CACHE_MAX_ENTRIES:
            evict_count = max(1, int(0.2 * CACHE_MAX_ENTRIES))
            logger.info(f"SemanticCache: evicting {evict_count} oldest entries (max {CACHE_MAX_ENTRIES})")
            self._entries = self._entries[evict_count:]
        logger.info(f"Cached response (total entries: {len(self._entries)})")

    def clear(self) -> None:
        """Clear all cache entries."""
        self._entries.clear()

    @property
    def size(self) -> int:
        return len(self._entries)
