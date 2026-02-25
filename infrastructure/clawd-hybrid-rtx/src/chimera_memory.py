"""
ChimeraMemory — Persistent memory for blueprints and cognitive traces.
Stores and retrieves Chimera Blueprints for retrieval-augmented generation and self-improvement.
"""

import json
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
import time
import numpy as np
from sentence_transformers import SentenceTransformer


class ChimeraMemory:
    def __init__(self, path: str = "data/chimera_memory.json", max_entries: int = 50):
        self.path = Path(path)
        self.max_entries = max_entries
        self._lock = threading.Lock()
        self._memory: List[Dict[str, Any]] = []
        self._embeddings: List[np.ndarray] = []
        self._model = SentenceTransformer("all-MiniLM-L6-v2")
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
        # Rebuild embeddings
        self._embeddings = []
        for bp in self._memory:
            bp_text = (bp.get("input") or "") + " " + (bp.get("consensus") or "")
            emb = self._model.encode(bp_text, show_progress_bar=False, convert_to_numpy=True)
            self._embeddings.append(emb)

    def _save(self):
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("w", encoding="utf-8") as f:
                json.dump(self._memory[-self.max_entries:], f, indent=2)

    def add_blueprint(self, blueprint: Dict[str, Any]):
        with self._lock:
            # Add feedback and cluster fields if missing
            blueprint.setdefault("feedback", [])
            blueprint.setdefault("cluster_id", None)
            self._memory.append(blueprint)
            bp_text = (blueprint.get("input") or "") + " " + (blueprint.get("consensus") or "")
            emb = self._model.encode(bp_text, show_progress_bar=False, convert_to_numpy=True)
            self._embeddings.append(emb)
            if len(self._memory) > self.max_entries:
                self._memory = self._memory[-self.max_entries:]
                self._embeddings = self._embeddings[-self.max_entries:]
            self._save()

    def cluster_blueprints(self, n_clusters: int = 5) -> list[list[Dict[str, Any]]]:
        """Cluster blueprints by semantic similarity using embeddings."""
        from sklearn.cluster import KMeans
        if not self._embeddings:
            return []
        n_clusters = min(n_clusters, len(self._embeddings))
        X = np.stack(self._embeddings)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=5)
        labels = kmeans.fit_predict(X)
        clusters = [[] for _ in range(n_clusters)]
        for i, bp in enumerate(self._memory):
            bp["cluster_id"] = int(labels[i])
            clusters[labels[i]].append(bp)
        return clusters

    def get_similar(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        # Embedding-based similarity search
        if not self._memory:
            return []
        query_emb = self._model.encode(query, show_progress_bar=False, convert_to_numpy=True)
        sims = []
        for i, emb in enumerate(self._embeddings):
            sim = float(np.dot(query_emb, emb) / (np.linalg.norm(query_emb) * np.linalg.norm(emb) + 1e-8))
            sims.append((sim, self._memory[i]))
        sims.sort(reverse=True, key=lambda x: x[0])
        return [bp for sim, bp in sims[:top_k] if sim > 0.3]  # threshold for relevance

    def all_blueprints(self) -> List[Dict[str, Any]]:
        return list(self._memory)

    def clear(self):
        with self._lock:
            self._memory = []
            self._save()
