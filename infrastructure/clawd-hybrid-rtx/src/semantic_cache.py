"""
Clawd Hybrid RTX LLM - Semantic Cache
Uses sentence-transformers + FAISS on RTX 2060 for fast semantic caching.
"""
import hashlib
import json
import os
import time
import numpy as np
from pathlib import Path
from typing import Optional

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False

from .config import settings


class SemanticCache:
    """
    Semantic cache using sentence-transformers for embeddings
    and FAISS for fast similarity search.
    Runs on RTX 2060 for GPU-accelerated embeddings.
    """

    def __init__(self):
        self.enabled = settings.cache_enabled and FAISS_AVAILABLE and ST_AVAILABLE
        self.threshold = settings.cache_threshold
        self.max_size = settings.cache_max_size
        self.cache_dir = Path(settings.cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self.entries: dict[str, dict] = {}  # hash -> {response, timestamp, hits}
        self.embeddings: list[np.ndarray] = []
        self.keys: list[str] = []
        self.index: Optional[object] = None
        self.model: Optional[object] = None

        if self.enabled:
            try:
                device = settings.embedding_device
                self.model = SentenceTransformer(settings.embedding_model, device=device)
                self.dim = self.model.get_sentence_embedding_dimension()
                self.index = faiss.IndexFlatIP(self.dim)  # Inner product (cosine sim with normalized vectors)
                self._load_cache()
                print(f"[Cache] Initialized on {device} with {len(self.entries)} entries")
            except Exception as e:
                print(f"[Cache] Failed to initialize: {e}")
                self.enabled = False

    def _hash_query(self, messages: list[dict]) -> str:
        """Create a hash of the query for exact matching."""
        content = json.dumps(messages, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _embed(self, text: str) -> np.ndarray:
        """Generate embedding using sentence-transformers on RTX 2060."""
        if not self.model:
            return np.zeros(384)
        embedding = self.model.encode(text, normalize_embeddings=True)
        return np.array(embedding, dtype=np.float32)

    def _messages_to_text(self, messages: list[dict]) -> str:
        """Convert messages to a single text for embedding."""
        return " ".join(m.get("content", "") for m in messages if m.get("role") != "system")

    def get(self, messages: list[dict]) -> Optional[dict]:
        """Check cache for a semantically similar query."""
        if not self.enabled or not self.index or self.index.ntotal == 0:
            return None

        text = self._messages_to_text(messages)
        query_embedding = self._embed(text).reshape(1, -1)

        # Search FAISS index
        scores, indices = self.index.search(query_embedding, 1)

        if scores[0][0] >= self.threshold:
            idx = indices[0][0]
            key = self.keys[idx]
            if key in self.entries:
                self.entries[key]["hits"] += 1
                return self.entries[key]["response"]

        return None

    def put(self, messages: list[dict], response: dict):
        """Store a response in the cache."""
        if not self.enabled or not self.model or not self.index:
            return

        # Evict oldest entries if at capacity
        if len(self.entries) >= self.max_size:
            oldest_key = min(self.entries, key=lambda k: self.entries[k]["timestamp"])
            self._remove_entry(oldest_key)

        text = self._messages_to_text(messages)
        key = self._hash_query(messages)

        embedding = self._embed(text).reshape(1, -1)

        self.entries[key] = {
            "response": response,
            "timestamp": time.time(),
            "hits": 0,
        }
        self.embeddings.append(embedding.flatten())
        self.keys.append(key)
        self.index.add(embedding)

    def _remove_entry(self, key: str):
        """Remove an entry from cache."""
        if key in self.entries:
            del self.entries[key]
            if key in self.keys:
                idx = self.keys.index(key)
                self.keys.pop(idx)
                self.embeddings.pop(idx)
                # Rebuild FAISS index
                self.index = faiss.IndexFlatIP(self.dim)
                if self.embeddings:
                    matrix = np.array(self.embeddings, dtype=np.float32)
                    self.index.add(matrix)

    def _save_cache(self):
        """Persist cache to disk."""
        cache_file = self.cache_dir / "cache_entries.json"
        serializable = {}
        for key, entry in self.entries.items():
            serializable[key] = {
                "response": entry["response"],
                "timestamp": entry["timestamp"],
                "hits": entry["hits"],
            }
        with open(cache_file, "w") as f:
            json.dump(serializable, f)

    def _load_cache(self):
        """Load cache from disk."""
        cache_file = self.cache_dir / "cache_entries.json"
        if cache_file.exists():
            try:
                with open(cache_file) as f:
                    data = json.load(f)
                self.entries = data
                print(f"[Cache] Loaded {len(data)} entries from disk")
            except Exception:
                pass

    @property
    def stats(self) -> dict:
        total_hits = sum(e.get("hits", 0) for e in self.entries.values())
        return {
            "enabled": self.enabled,
            "entries": len(self.entries),
            "total_hits": total_hits,
            "max_size": self.max_size,
            "threshold": self.threshold,
        }


semantic_cache = SemanticCache()
