"""
Chimera Quantum Engine — Quantum-inspired intelligence engine for hybrid model orchestration.

Uses quantum-inspired algorithms (superposition evaluation, simulated annealing,
entanglement detection, genetic evolution) for intelligent multi-model routing,
scoring, and caching. Pure Python + numpy, no ML dependencies.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
import re
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np


# ---------------------------------------------------------------------------
# ChimeraQuantumEngine
# ---------------------------------------------------------------------------

class ChimeraQuantumEngine:
    """Main quantum-inspired engine for multi-model evaluation and selection.

    Provides superposition-based response scoring, simulated-annealing model
    selection, entanglement-based correlation detection, and genetic-algorithm
    weight evolution.
    """

    def __init__(self, seed: int | None = None) -> None:
        self._rng = np.random.default_rng(seed)
        self._history: list[dict[str, Any]] = []

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        """Lowercase split on non-alpha, removing empties."""
        if text is None:
            return []
        return [t for t in re.split(r"[^a-zA-Z0-9]+", text.lower()) if t]

    @staticmethod
    def _bag_vector(tokens: list[str], vocab: list[str]) -> np.ndarray:
        """Build a bag-of-words frequency vector over *vocab*."""
        freq: dict[str, int] = {}
        for t in tokens:
            freq[t] = freq.get(t, 0) + 1
        return np.array([freq.get(w, 0) for w in vocab], dtype=np.float64)

    @staticmethod
    def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
        """Cosine similarity, 0.0 when either vector is zero."""
        na = np.linalg.norm(a)
        nb = np.linalg.norm(b)
        if na == 0.0 or nb == 0.0:
            return 0.0
        return float(np.dot(a, b) / (na * nb))

    @staticmethod
    def _shannon_entropy(text: str) -> float:
        """Character-level Shannon entropy of *text*."""
        if not text:
            return 0.0
        freq: dict[str, int] = {}
        for ch in text:
            freq[ch] = freq.get(ch, 0) + 1
        n = len(text)
        return -sum((c / n) * math.log2(c / n) for c in freq.values())

    # -- public API ----------------------------------------------------------

    def superposition_evaluate(self, responses: list[str]) -> dict[str, Any]:
        """Score model responses using quantum-inspired interference.

        Each response is treated as a quantum state.  Interference between
        states is modelled via pairwise cosine similarity (coherence).  Scores
        combine coherence, length normalisation, and entropy to rank responses.

        Args:
            responses: List of plain-text model responses.

        Returns:
            Dict with keys ``best``, ``best_index``, ``scores``, and
            ``details`` (per-response breakdown).
        """
        if not responses:
            return {"best": "", "best_index": -1, "scores": [], "details": []}

        n = len(responses)

        # Build shared vocabulary & vectors
        token_lists = [self._tokenize(r) for r in responses]
        vocab = sorted({t for tl in token_lists for t in tl})
        if not vocab:
            # Edge-case: all responses are empty / non-alphanumeric
            return {
                "best": responses[0],
                "best_index": 0,
                "scores": [0.0] * n,
                "details": [],
            }

        vectors = np.array([self._bag_vector(tl, vocab) for tl in token_lists])

        # Pairwise coherence matrix (quantum interference analogy)
        coherence_matrix = np.zeros((n, n), dtype=np.float64)
        for i in range(n):
            for j in range(n):
                coherence_matrix[i, j] = self._cosine_sim(vectors[i], vectors[j])

        # Per-response metrics
        details: list[dict[str, Any]] = []
        scores: list[float] = []
        median_len = float(np.median([len(r) for r in responses])) or 1.0

        for idx, resp in enumerate(responses):
            # Coherence: mean similarity with *other* responses (constructive interference)
            others = [coherence_matrix[idx, j] for j in range(n) if j != idx]
            coherence = float(np.mean(others)) if others else 1.0

            # Length normalisation: prefer responses close to median length
            length_norm = 1.0 - abs(len(resp) - median_len) / (median_len + len(resp) + 1e-9)
            length_norm = max(length_norm, 0.0)

            # Entropy: higher entropy → richer information
            entropy = self._shannon_entropy(resp)
            max_entropy = math.log2(max(len(set(resp)), 1) + 1)
            entropy_norm = entropy / max_entropy if max_entropy > 0 else 0.0

            # Quantum-inspired combined amplitude
            amplitude = 0.50 * coherence + 0.25 * length_norm + 0.25 * entropy_norm
            # Probability proportional to |amplitude|^2
            probability = amplitude ** 2

            details.append({
                "index": idx,
                "coherence": round(coherence, 6),
                "length_norm": round(length_norm, 6),
                "entropy_norm": round(entropy_norm, 6),
                "amplitude": round(amplitude, 6),
                "probability": round(probability, 6),
            })
            scores.append(round(probability, 6))

        best_idx = int(np.argmax(scores))
        return {
            "best": responses[best_idx],
            "best_index": best_idx,
            "scores": scores,
            "details": details,
        }

    def quantum_anneal_select(
        self,
        query_features: dict[str, Any],
        model_scores: dict[str, float],
    ) -> str:
        """Pick the best model via simulated annealing.

        Uses model performance history and query features to balance
        exploration vs. exploitation when choosing a model.

        Args:
            query_features: Dict describing the current query
                (e.g. ``{"type": "code", "complexity": 0.8}``).
            model_scores: Mapping model_name → current score estimate.

        Returns:
            Name of the selected model.
        """
        if not model_scores:
            return ""

        models = list(model_scores.keys())
        if len(models) == 1:
            return models[0]

        # Normalise scores to [0, 1]
        max_s = max(model_scores.values()) or 1.0
        normed = {m: s / max_s for m, s in model_scores.items()}

        # Incorporate history bias
        history_bonus: dict[str, float] = {m: 0.0 for m in models}
        qtype = query_features.get("type", "general")
        for record in self._history[-200:]:
            if record.get("query_type") == qtype and record.get("model") in history_bonus:
                history_bonus[record["model"]] += record.get("score", 0.0)
        # Normalise history bonus
        hmax = max(history_bonus.values()) or 1.0
        history_bonus = {m: v / hmax for m, v in history_bonus.items()}

        # Energy function: lower energy = better
        def energy(model: str) -> float:
            return -(0.7 * normed[model] + 0.3 * history_bonus.get(model, 0.0))

        # Simulated annealing
        current = min(models, key=energy)
        current_e = energy(current)
        best, best_e = current, current_e

        temperature = 1.0
        cooling = 0.92
        steps = 60

        for _ in range(steps):
            candidate = self._rng.choice(models)
            candidate_e = energy(candidate)
            delta = candidate_e - current_e
            if delta < 0 or self._rng.random() < math.exp(-delta / max(temperature, 1e-12)):
                current, current_e = candidate, candidate_e
            if current_e < best_e:
                best, best_e = current, current_e
            temperature *= cooling

        # Record selection
        self._history.append({"query_type": qtype, "model": best, "score": -best_e, "ts": time.time()})
        return best

    def entanglement_detect(self, patterns: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Detect correlations (entanglements) between query types and model performance.

        Args:
            patterns: List of dicts with at least ``query_type``, ``model``,
                and ``score`` keys.

        Returns:
            List of correlation dicts with ``query_type``, ``model``,
            ``correlation``, and ``sample_size``.
        """
        if not patterns:
            return []

        # Group scores by (query_type, model)
        groups: dict[tuple[str, str], list[float]] = {}
        for p in patterns:
            key = (p.get("query_type", "unknown"), p.get("model", "unknown"))
            groups.setdefault(key, []).append(float(p.get("score", 0.0)))

        # Compute correlation strength for each pair
        global_scores = [float(p.get("score", 0.0)) for p in patterns]
        global_mean = float(np.mean(global_scores)) if global_scores else 0.0
        global_std = float(np.std(global_scores)) if global_scores else 1.0
        global_std = max(global_std, 1e-9)

        results: list[dict[str, Any]] = []
        for (qtype, model), scores in groups.items():
            if len(scores) < 2:
                continue
            local_mean = float(np.mean(scores))
            # Z-score of local mean relative to global distribution
            z = (local_mean - global_mean) / global_std
            # Map z-score to [-1, 1] correlation-like value via tanh
            correlation = float(np.tanh(z))
            results.append({
                "query_type": qtype,
                "model": model,
                "correlation": round(correlation, 6),
                "mean_score": round(local_mean, 4),
                "sample_size": len(scores),
            })

        results.sort(key=lambda r: abs(r["correlation"]), reverse=True)
        return results

    def evolve_weights(
        self,
        current: dict[str, float],
        history: list[dict[str, Any]],
        *,
        population_size: int = 24,
        generations: int = 40,
        mutation_rate: float = 0.15,
    ) -> dict[str, float]:
        """Evolve model selection weights using a genetic algorithm.

        Args:
            current: Current weight dict (model_name → weight).
            history: Performance history records with ``model`` and ``score``.
            population_size: Number of individuals per generation.
            generations: Number of generations to evolve.
            mutation_rate: Probability of mutating each gene.

        Returns:
            New weight dict with evolved values.
        """
        if not current:
            return {}

        models = list(current.keys())
        n = len(models)

        # Build fitness lookup from history
        perf: dict[str, list[float]] = {m: [] for m in models}
        for h in history:
            m = h.get("model", "")
            if m in perf:
                perf[m].append(float(h.get("score", 0.0)))
        avg_perf = {m: (float(np.mean(s)) if s else 0.5) for m, s in perf.items()}

        def _normalise(vec: np.ndarray) -> np.ndarray:
            total = vec.sum()
            return vec / total if total > 0 else np.ones(n) / n

        def _fitness(individual: np.ndarray) -> float:
            """Fitness = alignment between weights and observed performance."""
            w = _normalise(individual)
            perf_vec = np.array([avg_perf[m] for m in models])
            # Reward correlation with performance + penalise extreme skew
            corr = float(np.dot(w, perf_vec))
            diversity = float(-np.sum(w * np.log(w + 1e-12)))  # entropy bonus
            return corr + 0.1 * diversity

        # Initialise population around current weights
        base = np.array([current.get(m, 1.0) for m in models], dtype=np.float64)
        population = []
        for _ in range(population_size):
            noise = self._rng.normal(0, 0.2, size=n)
            ind = np.clip(base + noise, 0.01, 10.0)
            population.append(ind)
        population[0] = base.copy()  # elitism: keep current

        for _gen in range(generations):
            scored = [(ind, _fitness(ind)) for ind in population]
            scored.sort(key=lambda x: x[1], reverse=True)

            # Elite carry-over
            elite_count = max(2, population_size // 5)
            new_pop = [s[0].copy() for s in scored[:elite_count]]

            # Roulette-wheel selection + crossover
            fitnesses = np.array([s[1] for s in scored])
            fitnesses -= fitnesses.min() - 1e-6
            probs = fitnesses / fitnesses.sum()

            while len(new_pop) < population_size:
                idx_a, idx_b = self._rng.choice(len(scored), size=2, replace=False, p=probs)
                parent_a, parent_b = scored[idx_a][0], scored[idx_b][0]
                # Uniform crossover
                mask = self._rng.random(n) < 0.5
                child = np.where(mask, parent_a, parent_b)
                # Mutation
                for g in range(n):
                    if self._rng.random() < mutation_rate:
                        child[g] += self._rng.normal(0, 0.15)
                child = np.clip(child, 0.01, 10.0)
                new_pop.append(child)

            population = new_pop

        # Return best individual as weight dict
        best = max(population, key=_fitness)
        best_norm = _normalise(best)
        return {m: round(float(best_norm[i]), 6) for i, m in enumerate(models)}


# ---------------------------------------------------------------------------
# HyperIntelligence
# ---------------------------------------------------------------------------

class HyperIntelligence:
    """Meta-learning layer for query classification and model recommendation.

    Maintains per-model, per-query-class performance profiles and uses them
    to predict the best model (or ensemble) for incoming queries.
    """

    QUERY_CLASSES: list[str] = [
        "code", "reasoning", "creative", "conversation", "analysis", "math",
    ]

    # Keyword signals for lightweight classification
    _SIGNALS: dict[str, list[str]] = {
        "code": [
            "function", "def", "class", "import", "code", "program", "bug",
            "error", "compile", "debug", "syntax", "api", "script", "variable",
            "refactor", "implement", "algorithm", "python", "javascript", "rust",
            "typescript", "html", "css", "sql", "git", "docker", "deploy",
        ],
        "math": [
            "calculate", "equation", "integral", "derivative", "proof",
            "theorem", "algebra", "matrix", "probability", "statistics",
            "formula", "solve", "compute", "sum", "product", "factorial",
            "geometry", "trigonometry", "calculus", "linear",
        ],
        "reasoning": [
            "why", "because", "reason", "logic", "argue", "therefore",
            "hence", "conclude", "deduce", "infer", "implication", "premise",
            "fallacy", "hypothesis", "evidence", "explain", "cause", "effect",
            "consequence", "analysis", "think", "step by step",
        ],
        "creative": [
            "write", "story", "poem", "creative", "imagine", "fiction",
            "character", "plot", "narrative", "metaphor", "song", "lyric",
            "fantasy", "describe", "vivid", "artistic", "compose", "draft",
        ],
        "analysis": [
            "analyze", "analyse", "compare", "contrast", "evaluate",
            "assess", "review", "examine", "investigate", "data", "trend",
            "insight", "report", "summary", "summarize", "breakdown",
            "strengths", "weaknesses", "swot", "benchmark",
        ],
        "conversation": [
            "hello", "hi", "hey", "thanks", "please", "help", "chat",
            "talk", "opinion", "think", "feel", "how are", "what do you",
        ],
    }

    def __init__(self, state_path: str | Path | None = None) -> None:
        self._profiles: dict[str, dict[str, list[float]]] = {}
        self._state_path = Path(state_path) if state_path else None
        if self._state_path and self._state_path.exists():
            self._load_state()

    # -- persistence ---------------------------------------------------------

    def _load_state(self) -> None:
        try:
            data = json.loads(self._state_path.read_text(encoding="utf-8"))  # type: ignore[union-attr]
            self._profiles = data.get("model_profiles", {})
        except (json.JSONDecodeError, OSError):
            pass

    def _save_state(self) -> None:
        if not self._state_path:
            return
        try:
            if self._state_path.exists():
                data = json.loads(self._state_path.read_text(encoding="utf-8"))
            else:
                data = {}
            data["model_profiles"] = self._profiles
            self._state_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except (json.JSONDecodeError, OSError):
            pass

    # -- public API ----------------------------------------------------------

    def classify_query(self, messages: list[dict[str, Any]]) -> str:
        """Classify the conversation's intent into a query class.

        Args:
            messages: OpenAI-style message list (``role``, ``content``).

        Returns:
            One of ``QUERY_CLASSES``.
        """
        text = " ".join(
            m.get("content", "") for m in messages if m.get("role") in ("user", "system")
        ).lower()

        scores: dict[str, float] = {cls: 0.0 for cls in self.QUERY_CLASSES}
        tokens = set(re.split(r"\W+", text))

        for cls, keywords in self._SIGNALS.items():
            for kw in keywords:
                if kw in text:
                    scores[cls] += 1.0
                    # Bonus for exact token match
                    if kw in tokens:
                        scores[cls] += 0.5

        # Presence of code fences is a strong code signal
        if "```" in text or "def " in text or "import " in text:
            scores["code"] += 3.0

        # Numeric heavy → math signal
        digit_ratio = sum(c.isdigit() for c in text) / max(len(text), 1)
        if digit_ratio > 0.15:
            scores["math"] += 2.0

        best = max(scores, key=scores.get)  # type: ignore[arg-type]
        # Fall back to conversation if no signal
        if scores[best] == 0.0:
            return "conversation"
        return best

    def predict_best_model(self, query_class: str) -> str:
        """Return the best-performing model for *query_class*.

        Args:
            query_class: One of ``QUERY_CLASSES``.

        Returns:
            Model name, or empty string if no profile data exists.
        """
        best_model = ""
        best_avg = -1.0

        for model, classes in self._profiles.items():
            scores = classes.get(query_class, [])
            if scores:
                avg = float(np.mean(scores[-50:]))  # recent window
                if avg > best_avg:
                    best_avg = avg
                    best_model = model

        return best_model

    def update_profile(self, model: str, query_class: str, score: float) -> None:
        """Record a performance observation.

        Args:
            model: Model name.
            query_class: Query class the score applies to.
            score: Performance score (0–1 recommended).
        """
        if model not in self._profiles:
            self._profiles[model] = {}
        self._profiles[model].setdefault(query_class, []).append(score)
        # Keep bounded
        if len(self._profiles[model][query_class]) > 500:
            self._profiles[model][query_class] = self._profiles[model][query_class][-500:]
        self._save_state()

    def get_ensemble(self, query_class: str, n: int = 3) -> list[str]:
        """Return the top *n* models for *query_class*.

        Args:
            query_class: Query class to rank by.
            n: Number of models to return.

        Returns:
            Sorted list of model names (best first).
        """
        ranking: list[tuple[str, float]] = []

        for model, classes in self._profiles.items():
            scores = classes.get(query_class, [])
            if scores:
                avg = float(np.mean(scores[-50:]))
                ranking.append((model, avg))

        ranking.sort(key=lambda x: x[1], reverse=True)
        return [m for m, _ in ranking[:n]]


# ---------------------------------------------------------------------------
# QuantumCache
# ---------------------------------------------------------------------------

@dataclass
class _CacheEntry:
    """Internal cache entry."""
    key: str
    query: str
    response: Any
    tfidf_vector: np.ndarray
    importance: float = 1.0
    hits: int = 0
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)


class QuantumCache:
    """TF-IDF–vectorised cache with quantum-tunnelling–aware similarity matching.

    Features:
        * TF-IDF vectorisation over cached queries.
        * Tunnelling: allows matches *below* the normal similarity threshold
          with an exponentially decaying probability.
        * LRU eviction weighted by importance.
        * Adaptive similarity threshold based on recent hit/miss ratio.
    """

    def __init__(
        self,
        max_size: int = 512,
        base_threshold: float = 0.82,
        tunnel_decay: float = 8.0,
        seed: int | None = None,
    ) -> None:
        self._max_size = max_size
        self._base_threshold = base_threshold
        self._tunnel_decay = tunnel_decay
        self._rng = np.random.default_rng(seed)

        # Ordered for LRU behaviour (key → _CacheEntry)
        self._store: OrderedDict[str, _CacheEntry] = OrderedDict()

        # IDF bookkeeping
        self._doc_freq: dict[str, int] = {}
        self._total_docs: int = 0

        # Adaptive threshold state
        self._recent_hits: int = 0
        self._recent_misses: int = 0
        self._threshold: float = base_threshold

    # -- TF-IDF helpers ------------------------------------------------------

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return [t for t in re.split(r"[^a-zA-Z0-9]+", text.lower()) if t]

    def _tf(self, tokens: list[str]) -> dict[str, float]:
        """Term frequency (raw count normalised by doc length)."""
        freq: dict[str, int] = {}
        for t in tokens:
            freq[t] = freq.get(t, 0) + 1
        n = len(tokens) or 1
        return {t: c / n for t, c in freq.items()}

    def _idf(self, term: str) -> float:
        """Inverse document frequency with smoothing."""
        df = self._doc_freq.get(term, 0)
        return math.log((1 + self._total_docs) / (1 + df)) + 1.0

    def _tfidf_vector(self, text: str) -> np.ndarray:
        """Build a TF-IDF vector aligned to current vocabulary."""
        tokens = self._tokenize(text)
        tf = self._tf(tokens)
        vocab = sorted(self._doc_freq.keys())
        if not vocab:
            return np.zeros(1)
        vec = np.array([tf.get(w, 0.0) * self._idf(w) for w in vocab], dtype=np.float64)
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def _update_idf(self, tokens: list[str]) -> None:
        """Update document-frequency counts."""
        self._total_docs += 1
        for t in set(tokens):
            self._doc_freq[t] = self._doc_freq.get(t, 0) + 1

    def _rebuild_vectors(self) -> None:
        """Re-vectorise all cached entries after vocabulary change."""
        for entry in self._store.values():
            entry.tfidf_vector = self._tfidf_vector(entry.query)

    # -- tunnelling ----------------------------------------------------------

    def _tunnel_probability(self, similarity: float) -> float:
        """Quantum-tunnelling probability for a sub-threshold similarity.

        Returns a probability ∈ (0, 1) that decays exponentially as the gap
        between the threshold and the similarity grows.
        """
        gap = self._threshold - similarity
        if gap <= 0:
            return 1.0
        return float(math.exp(-self._tunnel_decay * gap))

    # -- adaptive threshold --------------------------------------------------

    def _adapt_threshold(self) -> None:
        """Adjust threshold based on recent hit/miss ratio."""
        total = self._recent_hits + self._recent_misses
        if total < 20:
            return
        hit_rate = self._recent_hits / total
        if hit_rate > 0.7:
            # Many hits → tighten threshold for quality
            self._threshold = min(self._threshold + 0.01, 0.98)
        elif hit_rate < 0.2:
            # Few hits → loosen to improve recall
            self._threshold = max(self._threshold - 0.01, 0.50)
        # Decay counters
        self._recent_hits = self._recent_hits // 2
        self._recent_misses = self._recent_misses // 2

    # -- eviction ------------------------------------------------------------

    def _evict(self) -> None:
        """Evict the least valuable entry (LRU weighted by importance)."""
        if not self._store:
            return
        # Score: lower = more evictable
        worst_key: str | None = None
        worst_score = float("inf")
        now = time.time()
        for key, entry in self._store.items():
            recency = 1.0 / (1.0 + now - entry.last_accessed)
            score = entry.importance * recency * (1 + entry.hits)
            if score < worst_score:
                worst_score = score
                worst_key = key
        if worst_key is not None:
            del self._store[worst_key]

    # -- public API ----------------------------------------------------------

    def put(
        self,
        query: str,
        response: Any,
        importance: float = 1.0,
    ) -> str:
        """Store a query-response pair.

        Args:
            query: The query text.
            response: Arbitrary response payload.
            importance: Importance weight for eviction decisions.

        Returns:
            Cache key (SHA-256 hex digest of the query).
        """
        # Evict if at capacity
        while len(self._store) >= self._max_size:
            self._evict()

        # Guard against None query
        if query is None:
            query = ""

        tokens = self._tokenize(query)
        self._update_idf(tokens)
        self._rebuild_vectors()  # vocabulary may have changed

        key = hashlib.sha256(query.encode()).hexdigest()[:16]
        entry = _CacheEntry(
            key=key,
            query=query,
            response=response,
            tfidf_vector=self._tfidf_vector(query),
            importance=importance,
        )
        self._store[key] = entry
        self._store.move_to_end(key)
        return key

    def get(self, query: str) -> tuple[Any | None, float]:
        """Look up the best matching cached response.

        Uses TF-IDF cosine similarity with quantum-tunnelling fallback.

        Args:
            query: The lookup query.

        Returns:
            ``(response, similarity)`` if a match is found, else ``(None, 0.0)``.
        """
        if not self._store:
            self._recent_misses += 1
            self._adapt_threshold()
            return None, 0.0

        q_vec = self._tfidf_vector(query)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            self._recent_misses += 1
            self._adapt_threshold()
            return None, 0.0

        best_entry: _CacheEntry | None = None
        best_sim: float = -1.0

        for entry in self._store.values():
            e_norm = np.linalg.norm(entry.tfidf_vector)
            if e_norm == 0:
                continue
            # Align vectors (may differ in length after vocab changes)
            min_len = min(len(q_vec), len(entry.tfidf_vector))
            sim = float(np.dot(q_vec[:min_len], entry.tfidf_vector[:min_len]) / (q_norm * e_norm))
            if sim > best_sim:
                best_sim = sim
                best_entry = entry

        if best_entry is None:
            self._recent_misses += 1
            self._adapt_threshold()
            return None, 0.0

        # Check threshold (with tunnelling)
        if best_sim >= self._threshold:
            matched = True
        else:
            p = self._tunnel_probability(best_sim)
            matched = bool(self._rng.random() < p)

        if matched:
            best_entry.hits += 1
            best_entry.last_accessed = time.time()
            self._store.move_to_end(best_entry.key)
            self._recent_hits += 1
            self._adapt_threshold()
            return best_entry.response, best_sim

        self._recent_misses += 1
        self._adapt_threshold()
        return None, best_sim

    @property
    def size(self) -> int:
        """Current number of cached entries."""
        return len(self._store)

    @property
    def threshold(self) -> float:
        """Current adaptive similarity threshold."""
        return self._threshold

    def clear(self) -> None:
        """Remove all cached entries and reset IDF state."""
        self._store.clear()
        self._doc_freq.clear()
        self._total_docs = 0
        self._recent_hits = 0
        self._recent_misses = 0
        self._threshold = self._base_threshold
