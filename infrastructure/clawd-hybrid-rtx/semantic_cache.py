"""
Semantic Cache Module for Clawd Hybrid RTX
Provides vector-based semantic caching with FAISS backend.
Optimized for RTX 2060 6GB VRAM (~1GB for embeddings)
"""

import os
import json
import hashlib
import numpy as np
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import pickle
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Try to import FAISS, fallback to numpy-based similarity
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not available, using numpy-based cosine similarity")

# Try to import sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not available")


@dataclass
class CacheEntry:
    """Represents a cached response with metadata."""
    query: str
    response: str
    embedding: np.ndarray
    timestamp: datetime
    ttl_seconds: int
    hit_count: int = 0
    model_used: str = ""
    
    def is_expired(self) -> bool:
        """Check if the cache entry has expired."""
        age = (datetime.now() - self.timestamp).total_seconds()
        return age > self.ttl_seconds
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "query": self.query,
            "response": self.response,
            "embedding": self.embedding.tobytes() if isinstance(self.embedding, np.ndarray) else self.embedding,
            "embedding_shape": list(self.embedding.shape) if isinstance(self.embedding, np.ndarray) else None,
            "timestamp": self.timestamp.isoformat(),
            "ttl_seconds": self.ttl_seconds,
            "hit_count": self.hit_count,
            "model_used": self.model_used
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        """Create CacheEntry from dictionary."""
        embedding_bytes = data["embedding"]
        embedding_shape = tuple(data["embedding_shape"])
        embedding = np.frombuffer(embedding_bytes, dtype=np.float32).reshape(embedding_shape)
        
        return cls(
            query=data["query"],
            response=data["response"],
            embedding=embedding,
            timestamp=datetime.fromisoformat(data["timestamp"]),
            ttl_seconds=data["ttl_seconds"],
            hit_count=data["hit_count"],
            model_used=data["model_used"]
        )


class SemanticCache:
    """
    Vector-based semantic caching layer with FAISS backend.
    
    Features:
    - Semantic similarity matching (not just exact string match)
    - Configurable similarity threshold
    - TTL-based expiration
    - LRU eviction when cache is full
    - Persistence to disk
    - Memory-efficient for RTX 2060 6GB VRAM
    """
    
    DEFAULT_CONFIG = {
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dimension": 384,
        "similarity_threshold": 0.92,
        "default_ttl_seconds": 3600,  # 1 hour
        "max_entries": 10000,
        "persist_path": "./cache/semantic_cache.pkl",
        "use_gpu": False,  # Default to CPU to save VRAM
    }
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the semantic cache.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        self.entries: Dict[str, CacheEntry] = {}
        self._index = None
        self._index_to_key: List[str] = []
        self._embedding_model = None
        self._initialized = False
        
        # Setup persistence directory
        persist_path = Path(self.config["persist_path"])
        persist_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Try to load existing cache
        self._load()
    
    def _initialize_embedding_model(self) -> None:
        """Lazy initialization of embedding model."""
        if self._initialized or not SENTENCE_TRANSFORMERS_AVAILABLE:
            return
        
        try:
            device = "cuda" if self.config["use_gpu"] else "cpu"
            self._embedding_model = SentenceTransformer(
                self.config["embedding_model"],
                device=device
            )
            self._initialized = True
            logger.info(f"Loaded embedding model on {device}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def _build_index(self) -> None:
        """Build FAISS index from current entries."""
        if not FAISS_AVAILABLE or len(self.entries) == 0:
            return
        
        dimension = self.config["embedding_dimension"]
        embeddings = []
        self._index_to_key = []
        
        for key, entry in self.entries.items():
            if not entry.is_expired():
                embeddings.append(entry.embedding)
                self._index_to_key.append(key)
        
        if len(embeddings) == 0:
            return
        
        embeddings_array = np.array(embeddings).astype('float32')
        
        # Use IndexFlatIP for cosine similarity (vectors should be normalized)
        self._index = faiss.IndexFlatIP(dimension)
        self._index.add(embeddings_array)
        
        logger.debug(f"Built FAISS index with {len(embeddings)} entries")
    
    def _normalize_embedding(self, embedding: np.ndarray) -> np.ndarray:
        """L2 normalize embedding for cosine similarity."""
        norm = np.linalg.norm(embedding)
        if norm > 0:
            return embedding / norm
        return embedding
    
    async def get(
        self, 
        query: str, 
        threshold: Optional[float] = None
    ) -> Optional[CacheEntry]:
        """
        Retrieve a cached entry by semantic similarity.
        
        Args:
            query: The query string to look up
            threshold: Similarity threshold (0-1), uses config default if None
        
        Returns:
            CacheEntry if found and not expired, None otherwise
        """
        threshold = threshold or self.config["similarity_threshold"]
        
        # Clean up expired entries first
        self._cleanup_expired()
        
        if len(self.entries) == 0:
            return None
        
        # Get embedding for query
        query_embedding = await self._get_embedding(query)
        query_embedding = self._normalize_embedding(query_embedding)
        
        # Search in FAISS index if available
        if FAISS_AVAILABLE and self._index is not None and self._index.ntotal > 0:
            query_array = np.array([query_embedding]).astype('float32')
            distances, indices = self._index.search(query_array, k=1)
            
            if distances[0][0] >= threshold and indices[0][0] >= 0:
                key = self._index_to_key[indices[0][0]]
                entry = self.entries[key]
                if not entry.is_expired():
                    entry.hit_count += 1
                    logger.debug(f"Cache hit for query: {query[:50]}...")
                    return entry
        else:
            # Fallback: brute force cosine similarity
            best_match = None
            best_score = -1
            
            for key, entry in self.entries.items():
                if entry.is_expired():
                    continue
                
                entry_embedding = self._normalize_embedding(entry.embedding)
                similarity = np.dot(query_embedding, entry_embedding)
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = entry
            
            if best_score >= threshold:
                best_match.hit_count += 1
                logger.debug(f"Cache hit (brute force) for query: {query[:50]}...")
                return best_match
        
        logger.debug(f"Cache miss for query: {query[:50]}...")
        return None
    
    async def put(
        self, 
        query: str, 
        response: str,
        model_used: str = "",
        ttl_seconds: Optional[int] = None
    ) -> None:
        """
        Store a response in the cache.
        
        Args:
            query: The query string
            response: The response to cache
            model_used: Name of the model that generated the response
            ttl_seconds: TTL in seconds, uses config default if None
        """
        ttl = ttl_seconds or self.config["default_ttl_seconds"]
        
        # Evict entries if at capacity
        if len(self.entries) >= self.config["max_entries"]:
            self._evict_lru()
        
        # Get embedding
        embedding = await self._get_embedding(query)
        
        # Create cache key from query
        key = hashlib.sha256(query.encode()).hexdigest()
        
        entry = CacheEntry(
            query=query,
            response=response,
            embedding=embedding,
            timestamp=datetime.now(),
            ttl_seconds=ttl,
            model_used=model_used
        )
        
        self.entries[key] = entry
        
        # Rebuild index
        self._build_index()
        
        logger.debug(f"Cached response for query: {query[:50]}...")
    
    async def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding vector for text."""
        self._initialize_embedding_model()
        
        if self._embedding_model is not None:
            embedding = self._embedding_model.encode(text, convert_to_numpy=True)
            return self._normalize_embedding(embedding)
        else:
            # Fallback: simple hash-based embedding (not semantic, but functional)
            # In production, this should raise an error
            logger.warning("Using fallback embedding (not semantic)")
            vec = np.zeros(self.config["embedding_dimension"], dtype=np.float32)
            text_hash = hashlib.md5(text.encode()).hexdigest()
            for i, char in enumerate(text_hash):
                vec[i % len(vec)] += ord(char)
            return self._normalize_embedding(vec)
    
    def _cleanup_expired(self) -> None:
        """Remove expired entries from cache."""
        expired_keys = [
            key for key, entry in self.entries.items() 
            if entry.is_expired()
        ]
        for key in expired_keys:
            del self.entries[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired entries")
            self._build_index()
    
    def _evict_lru(self) -> None:
        """Evict least recently used entry."""
        if not self.entries:
            return
        
        # Find entry with lowest hit count and oldest timestamp
        def score(item):
            key, entry = item
            age = (datetime.now() - entry.timestamp).total_seconds()
            return (entry.hit_count, -age)
        
        lru_key = min(self.entries.items(), key=score)[0]
        del self.entries[lru_key]
        logger.debug(f"Evicted LRU entry: {lru_key[:16]}...")
    
    def invalidate(self, query: Optional[str] = None) -> int:
        """
        Invalidate cache entries.
        
        Args:
            query: If provided, invalidate only matching entry.
                   If None, invalidate all entries.
        
        Returns:
            Number of entries invalidated
        """
        if query is None:
            count = len(self.entries)
            self.entries.clear()
            self._index = None
            self._index_to_key = []
            logger.info(f"Invalidated all {count} cache entries")
            return count
        else:
            key = hashlib.sha256(query.encode()).hexdigest()
            if key in self.entries:
                del self.entries[key]
                self._build_index()
                logger.info(f"Invalidated cache entry for query: {query[:50]}...")
                return 1
            return 0
    
    def _save(self) -> None:
        """Persist cache to disk."""
        try:
            data = {
                "config": self.config,
                "entries": {k: v.to_dict() for k, v in self.entries.items()}
            }
            with open(self.config["persist_path"], 'wb') as f:
                pickle.dump(data, f)
            logger.info(f"Saved cache with {len(self.entries)} entries")
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")
    
    def _load(self) -> None:
        """Load cache from disk."""
        persist_path = Path(self.config["persist_path"])
        if not persist_path.exists():
            return
        
        try:
            with open(persist_path, 'rb') as f:
                data = pickle.load(f)
            
            self.config.update(data.get("config", {}))
            entries_data = data.get("entries", {})
            self.entries = {
                k: CacheEntry.from_dict(v) 
                for k, v in entries_data.items()
            }
            
            # Clean up expired entries on load
            self._cleanup_expired()
            self._build_index()
            
            logger.info(f"Loaded cache with {len(self.entries)} valid entries")
        except Exception as e:
            logger.error(f"Failed to load cache: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_hits = sum(e.hit_count for e in self.entries.values())
        return {
            "total_entries": len(self.entries),
            "total_hits": total_hits,
            "memory_mb": sum(
                e.embedding.nbytes for e in self.entries.values()
            ) / (1024 * 1024),
            "config": self.config
        }
    
    def close(self) -> None:
        """Clean up resources and save cache."""
        self._save()
        if self._embedding_model is not None:
            del self._embedding_model
            self._embedding_model = None
        logger.info("Semantic cache closed")


# Convenience function for standalone use
async def create_cache(config: Optional[Dict[str, Any]] = None) -> SemanticCache:
    """Factory function to create a semantic cache instance."""
    return SemanticCache(config)
