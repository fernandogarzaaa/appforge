"""
Quantum Chimera LLM v4.0 - Chimera Memory with Lazy Embeddings
==============================================================
Advanced memory system with lazy-loaded embeddings for efficient semantic search.

Features:
- Lazy embedding loading for memory efficiency
- Vector-based semantic memory search
- Memory consolidation and summarization
- Hierarchical memory (short-term, long-term)
- Memory importance scoring
"""

import json
import time
import hashlib
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from collections import OrderedDict
from pathlib import Path
import numpy as np
import logging

logger = logging.getLogger(__name__)


@dataclass
class MemoryEntry:
    """Single memory entry."""
    memory_id: str
    content: str
    timestamp: float
    embedding: Optional[np.ndarray] = None
    importance: float = 1.0
    access_count: int = 0
    last_accessed: float = field(default_factory=time.time)
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def touch(self):
        """Update access metadata."""
        self.access_count += 1
        self.last_accessed = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_id": self.memory_id,
            "content": self.content,
            "timestamp": self.timestamp,
            "importance": self.importance,
            "access_count": self.access_count,
            "last_accessed": self.last_accessed,
            "tags": self.tags,
            "metadata": self.metadata
        }


class LazyEmbeddingProvider:
    """
    Lazy-loaded embedding provider for memory efficiency.
    
    Only loads the embedding model when needed and caches embeddings.
    """
    
    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        cache_size: int = 10000,
        lazy_load: bool = True
    ):
        self.model_name = model_name
        self.cache_size = cache_size
        self._model = None
        self._lazy_load = lazy_load
        self._embedding_cache: Dict[str, np.ndarray] = {}
        self._dimension = 384  # MiniLM dimension
        
    def _load_model(self):
        """Lazy load the embedding model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Lazy-loading embedding model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
                logger.info("Embedding model loaded")
            except ImportError:
                logger.warning("sentence-transformers not available, using fallback")
                self._model = "fallback"
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                self._model = "fallback"
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding with caching."""
        # Check cache
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if cache_key in self._embedding_cache:
            return self._embedding_cache[cache_key]
        
        # Load model if needed
        if not self._lazy_load or self._model is None:
            self._load_model()
        
        # Generate embedding
        if self._model == "fallback":
            embedding = self._fallback_embedding(text)
        else:
            try:
                embedding = self._model.encode(text, convert_to_numpy=True)
            except Exception as e:
                logger.warning(f"Embedding failed, using fallback: {e}")
                embedding = self._fallback_embedding(text)
        
        # Normalize
        embedding = embedding / (np.linalg.norm(embedding) + 1e-8)
        
        # Cache with LRU eviction
        if len(self._embedding_cache) >= self.cache_size:
            # Remove oldest 10%
            keys = list(self._embedding_cache.keys())
            for k in keys[:self.cache_size // 10]:
                del self._embedding_cache[k]
        
        self._embedding_cache[cache_key] = embedding
        return embedding
    
    def _fallback_embedding(self, text: str) -> np.ndarray:
        """Simple fallback embedding."""
        embedding = np.zeros(self._dimension)
        text = text.lower()
        
        # Character n-gram features
        for i in range(len(text) - 2):
            ngram = text[i:i + 3]
            hash_val = int(hashlib.md5(ngram.encode()).hexdigest(), 16)
            idx = hash_val % self._dimension
            embedding[idx] += 1
        
        # Normalize
        norm = np.linalg.norm(embedding)
        return embedding / norm if norm > 0 else embedding


class ChimeraMemory:
    """
    Advanced memory system with lazy embeddings.
    
    Features:
    - Lazy embedding loading for efficiency
    - Semantic memory search
    - Hierarchical memory (STM/LTM)
    - Memory consolidation
    """
    
    def __init__(
        self,
        stm_capacity: int = 100,  # Short-term memory
        ltm_capacity: int = 1000,  # Long-term memory
        embedding_model: str = "all-MiniLM-L6-v2",
        consolidation_threshold: int = 50,
        data_dir: str = "./data/memory"
    ):
        self.stm_capacity = stm_capacity
        self.ltm_capacity = ltm_capacity
        self.consolidation_threshold = consolidation_threshold
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Embedding provider (lazy-loaded)
        self._embedding_provider = LazyEmbeddingProvider(
            model_name=embedding_model,
            lazy_load=True
        )
        
        # Memory stores
        self._stm: OrderedDict[str, MemoryEntry] = OrderedDict()  # Short-term
        self._ltm: OrderedDict[str, MemoryEntry] = OrderedDict()  # Long-term
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
        
        # Load existing memories
        self._load_memories()
        
        logger.info(f"ChimeraMemory initialized (STM={stm_capacity}, LTM={ltm_capacity})")
    
    async def add_memory(
        self,
        content: str,
        importance: float = 1.0,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        generate_embedding: bool = False
    ) -> str:
        """
        Add a memory entry.
        
        Args:
            content: Memory content
            importance: Importance score (0-1)
            tags: Optional tags
            metadata: Optional metadata
            generate_embedding: Whether to generate embedding now (lazy if False)
        
        Returns:
            Memory ID
        """
        memory_id = hashlib.sha256(f"{content}{time.time()}".encode()).hexdigest()[:16]
        
        # Generate embedding if requested
        embedding = None
        if generate_embedding:
            embedding = self._embedding_provider.get_embedding(content)
        
        entry = MemoryEntry(
            memory_id=memory_id,
            content=content,
            timestamp=time.time(),
            embedding=embedding,
            importance=importance,
            tags=tags or [],
            metadata=metadata or {}
        )
        
        async with self._lock:
            # Add to STM
            self._stm[memory_id] = entry
            self._stm.move_to_end(memory_id)
            
            # Check STM capacity
            if len(self._stm) > self.stm_capacity:
                await self._consolidate_oldest()
        
        logger.debug(f"Added memory: {memory_id[:8]}...")
        return memory_id
    
    async def search_memories(
        self,
        query: str,
        k: int = 5,
        min_similarity: float = 0.7,
        tags: Optional[List[str]] = None
    ) -> List[Tuple[MemoryEntry, float]]:
        """
        Search memories by semantic similarity.
        
        Args:
            query: Search query
            k: Number of results
            min_similarity: Minimum similarity threshold
            tags: Filter by tags
        
        Returns:
            List of (memory, similarity) tuples
        """
        # Get query embedding
        query_embedding = self._embedding_provider.get_embedding(query)
        
        async with self._lock:
            results = []
            
            # Search both STM and LTM
            all_memories = list(self._stm.values()) + list(self._ltm.values())
            
            for memory in all_memories:
                # Filter by tags if specified
                if tags and not any(t in memory.tags for t in tags):
                    continue
                
                # Get or generate embedding
                if memory.embedding is None:
                    memory.embedding = self._embedding_provider.get_embedding(memory.content)
                
                # Calculate cosine similarity
                similarity = float(np.dot(query_embedding, memory.embedding))
                
                if similarity >= min_similarity:
                    results.append((memory, similarity))
                    memory.touch()
            
            # Sort by similarity
            results.sort(key=lambda x: x[1], reverse=True)
            
            return results[:k]
    
    async def get_memory(self, memory_id: str) -> Optional[MemoryEntry]:
        """Get a specific memory by ID."""
        async with self._lock:
            # Check STM first
            if memory_id in self._stm:
                entry = self._stm[memory_id]
                entry.touch()
                self._stm.move_to_end(memory_id)
                return entry
            
            # Check LTM
            if memory_id in self._ltm:
                entry = self._ltm[memory_id]
                entry.touch()
                return entry
            
            return None
    
    async def delete_memory(self, memory_id: str) -> bool:
        """Delete a memory."""
        async with self._lock:
            if memory_id in self._stm:
                del self._stm[memory_id]
                return True
            if memory_id in self._ltm:
                del self._ltm[memory_id]
                return True
            return False
    
    async def _consolidate_oldest(self):
        """Move oldest STM memories to LTM."""
        # Get oldest entries exceeding capacity
        excess = len(self._stm) - self.stm_capacity
        
        for _ in range(excess + 5):  # Move a few extra
            if not self._stm:
                break
            
            oldest_id, oldest_entry = self._stm.popitem(last=False)
            
            # Ensure embedding is generated before moving
            if oldest_entry.embedding is None:
                oldest_entry.embedding = self._embedding_provider.get_embedding(
                    oldest_entry.content
                )
            
            # Move to LTM
            self._ltm[oldest_id] = oldest_entry
        
        # Check LTM capacity
        if len(self._ltm) > self.ltm_capacity:
            await _prune_ltm()
        
        logger.debug(f"Consolidated {excess} memories to LTM")
    
    async def _prune_ltm(self):
        """Prune least important memories from LTM."""
        # Sort by importance * recency
        scored = []
        now = time.time()
        
        for memory_id, entry in self._ltm.items():
            age_hours = (now - entry.timestamp) / 3600
            recency_score = 1 / (1 + age_hours / 24)  # Decay over days
            score = entry.importance * recency_score * (1 + entry.access_count / 10)
            scored.append((memory_id, score))
        
        # Keep top 80%
        scored.sort(key=lambda x: x[1], reverse=True)
        keep_count = int(self.ltm_capacity * 0.8)
        
        to_remove = [mid for mid, _ in scored[keep_count:]]
        for memory_id in to_remove:
            del self._ltm[memory_id]
        
        logger.debug(f"Pruned {len(to_remove)} memories from LTM")
    
    async def get_recent_memories(
        self,
        count: int = 10,
        from_stm_only: bool = False
    ) -> List[MemoryEntry]:
        """Get most recent memories."""
        async with self._lock:
            # Get from STM (most recent first)
            stm_recent = list(self._stm.values())[-count:]
            
            if from_stm_only:
                return list(reversed(stm_recent))
            
            # If needed, get from LTM
            remaining = count - len(stm_recent)
            if remaining > 0:
                ltm_recent = sorted(
                    self._ltm.values(),
                    key=lambda e: e.timestamp,
                    reverse=True
                )[:remaining]
                return list(reversed(stm_recent)) + ltm_recent
            
            return list(reversed(stm_recent))
    
    async def get_important_memories(
        self,
        count: int = 10,
        min_importance: float = 0.8
    ) -> List[MemoryEntry]:
        """Get most important memories."""
        async with self._lock:
            all_memories = list(self._stm.values()) + list(self._ltm.values())
            
            important = [
                m for m in all_memories
                if m.importance >= min_importance
            ]
            
            important.sort(key=lambda m: m.importance, reverse=True)
            return important[:count]
    
    async def summarize_memories(
        self,
        memory_ids: Optional[List[str]] = None
    ) -> str:
        """Create a summary of specified memories."""
        async with self._lock:
            if memory_ids:
                memories = [
                    self._stm.get(mid) or self._ltm.get(mid)
                    for mid in memory_ids
                ]
                memories = [m for m in memories if m]
            else:
                memories = list(self._stm.values()) + list(self._ltm.values())
            
            if not memories:
                return "No memories to summarize."
            
            # Group by tags
            by_tags: Dict[str, List[str]] = {}
            for m in memories:
                for tag in m.tags:
                    if tag not in by_tags:
                        by_tags[tag] = []
                    by_tags[tag].append(m.content)
            
            # Create summary
            summary_parts = []
            summary_parts.append(f"Total memories: {len(memories)}")
            summary_parts.append(f"STM: {len(self._stm)}, LTM: {len(self._ltm)}")
            
            if by_tags:
                summary_parts.append("\nBy tags:")
                for tag, contents in sorted(by_tags.items(), key=lambda x: -len(x[1])):
                    summary_parts.append(f"  {tag}: {len(contents)} memories")
            
            return "\n".join(summary_parts)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        return {
            "stm_size": len(self._stm),
            "stm_capacity": self.stm_capacity,
            "ltm_size": len(self._ltm),
            "ltm_capacity": self.ltm_capacity,
            "total_memories": len(self._stm) + len(self._ltm),
            "embedding_cache_size": len(self._embedding_provider._embedding_cache),
            "embedding_model_loaded": self._embedding_provider._model is not None
        }
    
    def _load_memories(self):
        """Load memories from disk."""
        try:
            stm_file = self.data_dir / "stm.json"
            if stm_file.exists():
                with open(stm_file, 'r') as f:
                    data = json.load(f)
                
                for mem_data in data.get("memories", []):
                    entry = MemoryEntry(
                        memory_id=mem_data["memory_id"],
                        content=mem_data["content"],
                        timestamp=mem_data["timestamp"],
                        importance=mem_data.get("importance", 1.0),
                        tags=mem_data.get("tags", []),
                        metadata=mem_data.get("metadata", {})
                    )
                    self._stm[entry.memory_id] = entry
            
            ltm_file = self.data_dir / "ltm.json"
            if ltm_file.exists():
                with open(ltm_file, 'r') as f:
                    data = json.load(f)
                
                for mem_data in data.get("memories", []):
                    entry = MemoryEntry(
                        memory_id=mem_data["memory_id"],
                        content=mem_data["content"],
                        timestamp=mem_data["timestamp"],
                        importance=mem_data.get("importance", 1.0),
                        tags=mem_data.get("tags", []),
                        metadata=mem_data.get("metadata", {})
                    )
                    self._ltm[entry.memory_id] = entry
            
            logger.info(f"Loaded {len(self._stm)} STM and {len(self._ltm)} LTM memories")
        except Exception as e:
            logger.warning(f"Error loading memories: {e}")
    
    async def save_memories(self):
        """Save memories to disk."""
        try:
            async with self._lock:
                # Save STM
                stm_data = {
                    "memories": [m.to_dict() for m in self._stm.values()]
                }
                with open(self.data_dir / "stm.json", 'w') as f:
                    json.dump(stm_data, f, indent=2)
                
                # Save LTM
                ltm_data = {
                    "memories": [m.to_dict() for m in self._ltm.values()]
                }
                with open(self.data_dir / "ltm.json", 'w') as f:
                    json.dump(ltm_data, f, indent=2)
            
            logger.info("Saved memories to disk")
        except Exception as e:
            logger.error(f"Error saving memories: {e}")


# Global memory instance
_memory: Optional[ChimeraMemory] = None


def get_chimera_memory(
    stm_capacity: int = 100,
    ltm_capacity: int = 1000,
    **kwargs
) -> ChimeraMemory:
    """Get or create global memory instance."""
    global _memory
    if _memory is None:
        _memory = ChimeraMemory(
            stm_capacity=stm_capacity,
            ltm_capacity=ltm_capacity,
            **kwargs
        )
    return _memory
