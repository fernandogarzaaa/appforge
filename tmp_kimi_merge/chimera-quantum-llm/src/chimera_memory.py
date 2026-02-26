"""
Quantum Chimera LLM - Memory (Lazy Loading)
============================================
Lazy-loaded embedding model with local cache.
"""

import os
from typing import List, Optional
import numpy as np

from config import get_config
from src.logger import get_logger

logger = get_logger()


class ChimeraMemory:
    """
    Memory with lazy-loaded SentenceTransformer.
    Only loads model when first needed.
    """
    
    def __init__(self):
        self.config = get_config()
        self._model: Optional[Any] = None
        self._model_loaded = False
        self._embedding_cache: dict = {}
        
        logger.info("ChimeraMemory initialized (model not loaded yet)")
    
    def _ensure_model_loaded(self):
        """Lazy-load the embedding model on first call."""
        if self._model_loaded:
            return
        
        logger.info("Lazy-loading embedding model...")
        
        try:
            from sentence_transformers import SentenceTransformer
            
            # Ensure cache directory exists
            cache_dir = self.config.EMBEDDING_CACHE_DIR
            os.makedirs(cache_dir, exist_ok=True)
            
            model_name = self.config.EMBEDDING_MODEL
            
            # Try to load from local cache first
            try:
                self._model = SentenceTransformer(
                    model_name,
                    cache_folder=cache_dir,
                    local_files_only=True,
                )
                logger.info(f"Embedding model loaded from local cache: {cache_dir}")
            
            except Exception as e:
                # Local cache miss - download and cache
                logger.info(f"Local cache miss, downloading model: {model_name}")
                
                self._model = SentenceTransformer(
                    model_name,
                    cache_folder=cache_dir,
                    local_files_only=False,
                )
                logger.info(f"Embedding model downloaded and cached to: {cache_dir}")
            
            self._model_loaded = True
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}", exc_info=True)
            raise
    
    def get_embedding(self, text: str) -> List[float]:
        """Get embedding for text (lazy-loads model if needed)."""
        # Check cache first
        cache_key = hash(text) & 0xFFFFFFFF
        if cache_key in self._embedding_cache:
            return self._embedding_cache[cache_key]
        
        # Ensure model is loaded
        self._ensure_model_loaded()
        
        if self._model is None:
            logger.error("Embedding model not available")
            # Return zero vector as fallback
            return [0.0] * 384  # all-MiniLM-L6-v2 produces 384-dim embeddings
        
        try:
            # Generate embedding
            embedding = self._model.encode(text, convert_to_numpy=True)
            embedding_list = embedding.tolist()
            
            # Cache it
            self._embedding_cache[cache_key] = embedding_list
            
            return embedding_list
        
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}", exc_info=True)
            return [0.0] * 384
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts."""
        self._ensure_model_loaded()
        
        if self._model is None:
            return [[0.0] * 384 for _ in texts]
        
        try:
            embeddings = self._model.encode(texts, convert_to_numpy=True)
            return [e.tolist() for e in embeddings]
        
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}", exc_info=True)
            return [[0.0] * 384 for _ in texts]
    
    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        
        dot_product = np.dot(a, b)
        magnitude_a = np.linalg.norm(a)
        magnitude_b = np.linalg.norm(b)
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)
    
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._model_loaded


# Global instance
_memory: Optional[ChimeraMemory] = None


def get_chimera_memory() -> ChimeraMemory:
    """Get global memory instance."""
    global _memory
    if _memory is None:
        _memory = ChimeraMemory()
    return _memory
