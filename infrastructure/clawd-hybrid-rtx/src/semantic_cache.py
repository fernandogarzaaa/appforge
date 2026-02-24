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

    def _messages_to_vector(self, messages: list[dict]) -> np.ndarray:
        """Convert chat messages to a vector for similarity comparison."""
        # Concatenate all message contents
        text = " ".join(
            msg.get("content", "") for msg in messages if isinstance(msg.get("content"), str)
        ).lower()

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

        return None

    def put(self, messages: list[dict], response: dict) -> None:
        """Store a response in the cache."""
        key_vec = self._messages_to_vector(messages)
        self._entries.append(CacheEntry(key_vector=key_vec, response=response))
        logger.debug(f"Cached response (total entries: {len(self._entries)})")

    def clear(self) -> None:
        """Clear all cache entries."""
        self._entries.clear()

    @property
    def size(self) -> int:
        return len(self._entries)
