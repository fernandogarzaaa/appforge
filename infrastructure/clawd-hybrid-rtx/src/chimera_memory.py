"""
ChimeraMemory — Persistent memory for blueprints and cognitive traces.
Stores and retrieves Chimera Blueprints for retrieval-augmented generation and self-improvement.
Updated with Singleton EmbeddingManager for zero-reload latency.
"""

import json
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np

# Lazy import to avoid startup cost until needed, but singleton handles the heavy lifting
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

class EmbeddingManager:
    """Singleton manager for the embedding model to prevent reloads."""
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(EmbeddingManager, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.model_name = "all-MiniLM-L6-v2"
        self._model = None
        self._load_model()
        self._initialized = True

    def _load_model(self):
        if self._model is not None:
            return
            
        print(f"[EmbeddingManager] Loading {self.model_name}...")
        start_time = time.time()
        
        # Adjust path to be relative to this file
        cache_dir = Path(__file__).parent.parent / "models" / "sentence-transformers"
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Try loading from local cache first
            if SentenceTransformer:
                self._model = SentenceTransformer(self.model_name, cache_folder=str(cache_dir)) # sentence-transformers handles caching internally
                print(f"[EmbeddingManager] Loaded from cache: {cache_dir}")
            else:
                print("[EmbeddingManager] sentence-transformers not installed!")
        except Exception as e:
            print(f"[EmbeddingManager] Error loading model: {e}")
            
        print(f"[EmbeddingManager] Model loaded in {time.time() - start_time:.2f}s")

    def encode(self, text: str):
        if self._model is None:
            self._load_model()
        if self._model:
            return self._model.encode(text, show_progress_bar=False, convert_to_numpy=True)
        return np.zeros(384) # Fallback if model fails


class ChimeraMemory:
    def __init__(self, path: str = "data/chimera_memory.json", max_entries: int = 50):
        self.path = Path(path)
        self.max_entries = max_entries
        self._lock = threading.Lock()
        self._memory: List[Dict[str, Any]] = []
        self._embeddings: List[np.ndarray] = []
        # Use the singleton manager
        self._embedding_manager = EmbeddingManager()
        self._load()

    def _load(self):
        if self.path.exists():
            try:
                with self.path.open("r", encoding="utf-8") as f:
                    self._memory = json.load(f)
            except Exception:
                self._memory = []
        else:
            self._memory = []
            
        # Rebuild embeddings using singleton
        self._embeddings = []
        if self._memory:
            for bp in self._memory:
                bp_text = (bp.get("input") or "") + " " + (bp.get("consensus") or "")
                emb = self._embedding_manager.encode(bp_text)
                self._embeddings.append(emb)

    def _save(self):
        with self._lock:
            if not self.path.parent.exists():
                self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("w", encoding="utf-8") as f:
                json.dump(self._memory[-self.max_entries:], f, indent=2)

    def add_blueprint(self, blueprint: Dict[str, Any]):
        with self._lock:
            blueprint.setdefault("feedback", [])
            blueprint.setdefault("cluster_id", None)
            
            # Add to memory list
            self._memory.append(blueprint)
            
            # Generate embedding using singleton
            bp_text = (blueprint.get("input") or "") + " " + (blueprint.get("consensus") or "")
            emb = self._embedding_manager.encode(bp_text)
            self._embeddings.append(emb)
            
            # Prune if needed
            if len(self._memory) > self.max_entries:
                self._memory = self._memory[-self.max_entries:]
                self._embeddings = self._embeddings[-self.max_entries:]
            
            self._save()

    def get_similar(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self._memory:
            return []
            
        query_emb = self._embedding_manager.encode(query)
        sims = []
        
        for i, emb in enumerate(self._embeddings):
            # Cosine similarity
            norm_q = np.linalg.norm(query_emb)
            norm_e = np.linalg.norm(emb)
            if norm_q == 0 or norm_e == 0:
                sim = 0
            else:
                sim = float(np.dot(query_emb, emb) / (norm_q * norm_e))
            sims.append((sim, self._memory[i]))
            
        sims.sort(reverse=True, key=lambda x: x[0])
        return [bp for sim, bp in sims[:top_k] if sim > 0.3]

    def all_blueprints(self) -> List[Dict[str, Any]]:
        return list(self._memory)

    def clear(self):
        with self._lock:
            self._memory = []
            self._embeddings = []
            self._save()