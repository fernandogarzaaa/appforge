"""
Quantum Chimera LLM - Semantic Cache
=====================================
Embedding-based semantic cache with real cosine similarity.
"""

import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import numpy as np

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class CacheEntry:
    """A single cache entry."""
    key: str
    query: str
    response: str
    embedding: List[float]
    created_at: datetime
    hit_count: int = 0
    last_accessed: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "key": self.key,
            "query": self.query,
            "response": self.response,
            "embedding": self.embedding,
            "created_at": self.created_at.isoformat(),
            "hit_count": self.hit_count,
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CacheEntry':
        """Create from dictionary."""
        return cls(
            key=data["key"],
            query=data["query"],
            response=data["response"],
            embedding=data["embedding"],
            created_at=datetime.fromisoformat(data["created_at"]),
            hit_count=data.get("hit_count", 0),
            last_accessed=datetime.fromisoformat(data["last_accessed"]) if data.get("last_accessed") else None,
        )


class SemanticCache:
    """
    Semantic cache using REAL cosine similarity.
    No misleading string equality masquerading as similarity.
    """
    
    def __init__(self):
        self.config = get_config()
        self.entries: Dict[str, CacheEntry] = {}
        self.total_hits = 0
        self.total_misses = 0
        
        logger.info("SemanticCache initialized", 
                   threshold=self.config.CACHE_SIMILARITY_THRESHOLD,
                   max_entries=self.config.CACHE_MAX_ENTRIES)
    
    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculate REAL cosine similarity between two vectors.
        
        Returns value between -1.0 and 1.0:
        - 1.0 = identical direction (same meaning)
        - 0.0 = perpendicular (unrelated meaning)
        - -1.0 = opposite direction (opposite meaning)
        """
        a = np.array(vec_a)
        b = np.array(vec_b)
        
        dot_product = np.dot(a, b)
        magnitude_a = np.linalg.norm(a)
        magnitude_b = np.linalg.norm(b)
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)
    
    def _is_exact_match(self, query_a: str, query_b: str) -> bool:
        """Check if two queries are exact string matches."""
        return query_a.strip().lower() == query_b.strip().lower()
    
    def _generate_key(self, query: str) -> str:
        """Generate a cache key from query."""
        return hashlib.md5(query.strip().lower().encode()).hexdigest()
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry has expired."""
        max_age = timedelta(hours=self.config.CACHE_TTL_HOURS)
        return datetime.utcnow() - entry.created_at > max_age
    
    def _evict_if_needed(self):
        """Evict oldest entries if cache is over limit."""
        if len(self.entries) <= self.config.CACHE_MAX_ENTRIES:
            return
        
        # Evict oldest 20%
        entries_to_evict = int(self.config.CACHE_MAX_ENTRIES * 0.2)
        sorted_entries = sorted(
            self.entries.items(),
            key=lambda x: x[1].last_accessed or x[1].created_at
        )
        
        for key, _ in sorted_entries[:entries_to_evict]:
            del self.entries[key]
        
        logger.info(f"Evicted {entries_to_evict} old cache entries", 
                   new_size=len(self.entries))
    
    def get(
        self, 
        query: str, 
        query_embedding: List[float]
    ) -> Tuple[Optional[str], Optional[float]]:
        """
        Get cached response if similar enough.
        
        Returns:
            Tuple of (response, similarity_score) or (None, None)
        """
        if not self.config.ENABLE_CACHE:
            return None, None
        
        # Check for exact match first (fast path)
        exact_key = self._generate_key(query)
        if exact_key in self.entries:
            entry = self.entries[exact_key]
            if not self._is_expired(entry):
                entry.hit_count += 1
                entry.last_accessed = datetime.utcnow()
                self.total_hits += 1
                logger.debug(f"Exact cache hit for query", 
                            query_preview=query[:50],
                            similarity=1.0,
                            cache_size=len(self.entries))
                return entry.response, 1.0
            else:
                # Expired, remove it
                del self.entries[exact_key]
        
        # Search for semantic match
        best_match: Optional[CacheEntry] = None
        best_score = 0.0
        
        for entry in self.entries.values():
            if self._is_expired(entry):
                continue
            
            similarity = self._cosine_similarity(query_embedding, entry.embedding)
            
            if similarity > best_score and similarity >= self.config.CACHE_SIMILARITY_THRESHOLD:
                best_score = similarity
                best_match = entry
        
        if best_match:
            best_match.hit_count += 1
            best_match.last_accessed = datetime.utcnow()
            self.total_hits += 1
            
            # Log whether it's exact or semantic match
            is_exact = self._is_exact_match(query, best_match.query)
            match_type = "exact" if is_exact else "semantic"
            
            logger.info(f"Cache {match_type} hit", 
                       similarity=round(best_score, 4),
                       threshold=self.config.CACHE_SIMILARITY_THRESHOLD,
                       cache_size=len(self.entries),
                       match_type=match_type)
            
            return best_match.response, best_score
        
        # Cache miss
        self.total_misses += 1
        logger.debug(f"Cache miss", 
                    query_preview=query[:50],
                    cache_size=len(self.entries))
        
        return None, None
    
    def set(
        self, 
        query: str, 
        response: str, 
        embedding: List[float]
    ):
        """Store a query-response pair in cache."""
        if not self.config.ENABLE_CACHE:
            return
        
        self._evict_if_needed()
        
        key = self._generate_key(query)
        
        self.entries[key] = CacheEntry(
            key=key,
            query=query,
            response=response,
            embedding=embedding,
            created_at=datetime.utcnow(),
            last_accessed=datetime.utcnow()
        )
        
        logger.debug(f"Cached response", 
                    query_preview=query[:50],
                    cache_size=len(self.entries))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.total_hits + self.total_misses
        hit_rate = self.total_hits / total_requests if total_requests > 0 else 0
        
        return {
            "total_entries": len(self.entries),
            "total_hits": self.total_hits,
            "total_misses": self.total_misses,
            "hit_rate": round(hit_rate, 4),
            "hit_rate_percent": round(hit_rate * 100, 2),
            "threshold": self.config.CACHE_SIMILARITY_THRESHOLD,
            "max_entries": self.config.CACHE_MAX_ENTRIES,
        }
    
    def clear(self):
        """Clear all cache entries."""
        self.entries.clear()
        self.total_hits = 0
        self.total_misses = 0
        logger.info("Cache cleared")
    
    def clear_expired(self) -> int:
        """Clear expired entries. Returns count removed."""
        expired_keys = [
            key for key, entry in self.entries.items() 
            if self._is_expired(entry)
        ]
        
        for key in expired_keys:
            del self.entries[key]
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)


# Global instance
_cache: Optional[SemanticCache] = None


def get_semantic_cache() -> SemanticCache:
    """Get global semantic cache instance."""
    global _cache
    if _cache is None:
        _cache = SemanticCache()
    return _cache
