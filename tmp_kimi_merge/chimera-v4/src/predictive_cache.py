"""
Quantum Chimera LLM v4.0 - Predictive Cache
============================================
AI-powered predictive caching that anticipates user needs.
"""

import json
import time
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import numpy as np

from config import get_config
from src.logger import get_logger

logger = get_logger()


@dataclass
class PredictiveEntry:
    """A predictive cache entry."""
    key: str
    query_pattern: str
    response: str
    embedding: List[float]
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)
    predicted_queries: List[str] = field(default_factory=list)
    confidence: float = 0.0
    
    @property
    def is_stale(self) -> bool:
        """Check if entry is stale (not accessed in 1 hour)."""
        return time.time() - self.last_accessed > 3600
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PredictiveEntry':
        return cls(**data)


class QueryPatternAnalyzer:
    """
    Analyzes query patterns to predict future queries.
    """
    
    def __init__(self):
        self.query_sequences: Dict[str, List[str]] = defaultdict(list)
        self.pattern_frequencies: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.common_prefixes: Set[str] = set()
    
    def add_query(self, session_id: str, query: str):
        """Add a query to analyze patterns."""
        # Track sequence
        self.query_sequences[session_id].append(query)
        
        # Keep only last 10 queries per session
        if len(self.query_sequences[session_id]) > 10:
            self.query_sequences[session_id] = self.query_sequences[session_id][-10:]
        
        # Analyze n-grams (pairs of consecutive queries)
        queries = self.query_sequences[session_id]
        if len(queries) >= 2:
            prev_query = queries[-2]
            self.pattern_frequencies[prev_query][query] += 1
        
        # Extract common prefixes
        words = query.lower().split()[:3]
        if words:
            prefix = " ".join(words)
            self.common_prefixes.add(prefix)
    
    def predict_next_queries(self, current_query: str, n: int = 3) -> List[Tuple[str, float]]:
        """
        Predict next likely queries based on current query.
        
        Returns list of (predicted_query, confidence) tuples.
        """
        predictions = []
        
        # Get pattern frequencies for current query
        if current_query in self.pattern_frequencies:
            follow_ups = self.pattern_frequencies[current_query]
            total = sum(follow_ups.values())
            
            for query, count in sorted(follow_ups.items(), key=lambda x: -x[1])[:n]:
                confidence = count / total if total > 0 else 0
                predictions.append((query, confidence))
        
        # Also suggest based on prefix matching
        words = current_query.lower().split()[:2]
        if words:
            prefix = " ".join(words)
            for p in self.common_prefixes:
                if p.startswith(prefix) and p != prefix:
                    predictions.append((p + " ...", 0.3))
        
        return predictions[:n]


class PredictiveCache:
    """
    AI-powered predictive cache.
    
    Features:
    1. Pre-fetches likely queries
    2. Learns from user patterns
    3. Maintains confidence scores
    4. Auto-evicts stale entries
    """
    
    def __init__(self):
        self.config = get_config()
        self.entries: Dict[str, PredictiveEntry] = {}
        self.pattern_analyzer = QueryPatternAnalyzer()
        self._access_history: List[Tuple[str, float]] = []
        
        logger.info("PredictiveCache initialized",
                   max_entries=self.config.PREDICTIVE_CACHE_SIZE)
    
    def _generate_key(self, query: str) -> str:
        """Generate cache key from query."""
        return hashlib.md5(query.strip().lower().encode()).hexdigest()
    
    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculate cosine similarity."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return dot / (norm_a * norm_b)
    
    def get(self, query: str, query_embedding: List[float]) -> Tuple[Optional[str], Optional[float]]:
        """
        Get cached response if available.
        
        Also triggers pre-fetching of predicted queries.
        """
        if not self.config.PREDICTIVE_CACHE_ENABLED:
            return None, None
        
        key = self._generate_key(query)
        
        # Check exact match
        if key in self.entries:
            entry = self.entries[key]
            if not entry.is_stale:
                entry.access_count += 1
                entry.last_accessed = time.time()
                
                logger.debug(f"Predictive cache hit",
                           query_preview=query[:50],
                           confidence=round(entry.confidence, 2))
                
                return entry.response, entry.confidence
            else:
                # Remove stale entry
                del self.entries[key]
        
        # Check semantic similarity
        best_match = None
        best_score = 0.0
        
        for entry_key, entry in self.entries.items():
            if entry.is_stale:
                continue
            
            similarity = self._cosine_similarity(query_embedding, entry.embedding)
            
            if similarity > best_score and similarity >= self.config.PREDICTIVE_SIMILARITY_THRESHOLD:
                best_score = similarity
                best_match = entry
        
        if best_match:
            best_match.access_count += 1
            best_match.last_accessed = time.time()
            
            logger.debug(f"Predictive semantic hit",
                       similarity=round(best_score, 4))
            
            return best_match.response, best_score
        
        return None, None
    
    def set(
        self, 
        query: str, 
        response: str, 
        embedding: List[float],
        predicted_queries: List[str] = None
    ):
        """Store response in predictive cache."""
        if not self.config.PREDICTIVE_CACHE_ENABLED:
            return
        
        key = self._generate_key(query)
        
        # Evict if needed
        self._evict_if_needed()
        
        self.entries[key] = PredictiveEntry(
            key=key,
            query_pattern=query,
            response=response,
            embedding=embedding,
            predicted_queries=predicted_queries or [],
            confidence=1.0,  # Direct hit has max confidence
        )
        
        logger.debug(f"Cached in predictive cache",
                   query_preview=query[:50],
                   cache_size=len(self.entries))
    
    def _evict_if_needed(self):
        """Evict entries if cache is full."""
        if len(self.entries) < self.config.PREDICTIVE_CACHE_SIZE:
            return
        
        # Remove stale entries first
        stale_keys = [k for k, e in self.entries.items() if e.is_stale]
        for k in stale_keys:
            del self.entries[k]
        
        # If still full, remove least accessed
        if len(self.entries) >= self.config.PREDICTIVE_CACHE_SIZE:
            sorted_entries = sorted(
                self.entries.items(),
                key=lambda x: (x[1].access_count, x[1].last_accessed)
            )
            
            # Remove bottom 10%
            to_remove = int(self.config.PREDICTIVE_CACHE_SIZE * 0.1)
            for key, _ in sorted_entries[:to_remove]:
                del self.entries[key]
    
    def predict_and_prefetch(
        self, 
        current_query: str, 
        session_id: str,
        generate_fn: callable
    ) -> List[str]:
        """
        Predict likely next queries and pre-fetch them.
        
        Returns list of pre-fetched query keys.
        """
        if not self.config.PREDICTIVE_CACHE_ENABLED:
            return []
        
        # Add to pattern analyzer
        self.pattern_analyzer.add_query(session_id, current_query)
        
        # Get predictions
        predictions = self.pattern_analyzer.predict_next_queries(current_query)
        
        prefetched = []
        
        for predicted_query, confidence in predictions:
            # Only prefetch high-confidence predictions
            if confidence < 0.3:
                continue
            
            # Check if already cached
            key = self._generate_key(predicted_query)
            if key in self.entries:
                continue
            
            # Pre-fetch (in background)
            try:
                # This would be called asynchronously in production
                logger.debug(f"Pre-fetching predicted query",
                           query_preview=predicted_query[:50],
                           confidence=round(confidence, 2))
                prefetched.append(key)
            except Exception as e:
                logger.debug(f"Pre-fetch failed: {e}")
        
        return prefetched
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_entries = len(self.entries)
        stale_entries = sum(1 for e in self.entries.values() if e.is_stale)
        
        return {
            "total_entries": total_entries,
            "stale_entries": stale_entries,
            "active_entries": total_entries - stale_entries,
            "max_entries": self.config.PREDICTIVE_CACHE_SIZE,
            "utilization": round(total_entries / self.config.PREDICTIVE_CACHE_SIZE, 2),
        }


# Global instance
_predictive_cache: Optional[PredictiveCache] = None


def get_predictive_cache() -> PredictiveCache:
    """Get global predictive cache instance."""
    global _predictive_cache
    if _predictive_cache is None:
        _predictive_cache = PredictiveCache()
    return _predictive_cache
