"""
Clawd Hybrid RTX LLM - Quantum Consensus Engine
Uses quantum-inspired algorithms to select the best response from an ensemble.
"""
import numpy as np
from typing import Optional


class QuantumConsensus:
    """
    Quantum-inspired consensus engine for multi-model ensemble.
    Uses superposition scoring, interference patterns, and coherence measurement.
    """

    def __init__(self, coherence_target: float = 0.95):
        self.coherence_target = coherence_target

    def _text_similarity(self, text1: str, text2: str) -> float:
        """Compute simple text similarity using character n-grams."""
        def ngrams(text: str, n: int = 3) -> set:
            text = text.lower().strip()
            return {text[i:i+n] for i in range(len(text) - n + 1)}

        g1 = ngrams(text1)
        g2 = ngrams(text2)
        if not g1 or not g2:
            return 0.0
        intersection = g1 & g2
        union = g1 | g2
        return len(intersection) / len(union) if union else 0.0

    def _compute_coherence_matrix(self, responses: list[str]) -> np.ndarray:
        """Build pairwise coherence matrix between responses."""
        n = len(responses)
        matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    matrix[i][j] = self._text_similarity(responses[i], responses[j])
        return matrix

    def _quantum_superposition_scores(self, coherence_matrix: np.ndarray) -> np.ndarray:
        """
        Compute superposition-based quality scores.
        Each response exists in superposition — its quality is determined by
        constructive/destructive interference with other responses.
        """
        n = len(coherence_matrix)
        scores = np.zeros(n)

        for i in range(n):
            # Constructive interference: high coherence with others = quality signal
            coherence_sum = np.sum(coherence_matrix[i]) - 1.0  # Exclude self
            avg_coherence = coherence_sum / (n - 1) if n > 1 else 1.0

            # Quantum amplitude: sqrt of coherence (wave function analogy)
            amplitude = np.sqrt(max(avg_coherence, 0.01))

            # Length bonus (prefer substantive responses)
            # Normalized to prevent domination
            scores[i] = amplitude

        return scores / np.sum(scores) if np.sum(scores) > 0 else np.ones(n) / n

    def _quantum_annealing_select(
        self,
        scores: np.ndarray,
        coherence_matrix: np.ndarray,
        temperature: float = 1.0,
        iterations: int = 100,
    ) -> int:
        """
        Use simulated quantum annealing to find the optimal response.
        Explores the solution space with decreasing temperature.
        """
        n = len(scores)
        current_idx = int(np.argmax(scores))
        best_idx = current_idx
        best_energy = -scores[current_idx]

        for step in range(iterations):
            # Decrease temperature (annealing schedule)
            t = temperature * (1 - step / iterations)
            if t < 0.001:
                break

            # Propose a random neighbor
            candidate = np.random.randint(0, n)

            # Energy function: negative score + coherence bonus
            current_energy = -scores[current_idx] - 0.1 * np.mean(coherence_matrix[current_idx])
            candidate_energy = -scores[candidate] - 0.1 * np.mean(coherence_matrix[candidate])

            # Accept based on Boltzmann probability
            delta = candidate_energy - current_energy
            if delta < 0 or np.random.random() < np.exp(-delta / t):
                current_idx = candidate

            if -scores[current_idx] < best_energy:
                best_energy = -scores[current_idx]
                best_idx = current_idx

        return best_idx

    def select_best(self, responses: list[dict]) -> dict:
        """
        Select the best response from the ensemble using quantum consensus.

        Args:
            responses: List of dicts with 'content' and 'model' keys

        Returns:
            Best response dict with added 'coherence' and 'confidence' fields
        """
        if not responses:
            return {"content": "No responses available", "coherence": 0.0, "confidence": 0.0}

        if len(responses) == 1:
            responses[0]["coherence"] = 1.0
            responses[0]["confidence"] = 0.5
            return responses[0]

        texts = [r["content"] for r in responses]

        # Build coherence matrix
        coherence_matrix = self._compute_coherence_matrix(texts)

        # Compute superposition scores
        scores = self._quantum_superposition_scores(coherence_matrix)

        # Quantum annealing selection
        best_idx = self._quantum_annealing_select(scores, coherence_matrix)

        # Compute final coherence
        overall_coherence = float(np.mean(coherence_matrix[best_idx]))

        result = responses[best_idx].copy()
        result["coherence"] = round(overall_coherence, 4)
        result["confidence"] = round(float(scores[best_idx]), 4)
        result["ensemble_size"] = len(responses)
        result["all_scores"] = [
            {"model": r.get("model", "unknown"), "score": round(float(s), 4)}
            for r, s in zip(responses, scores)
        ]

        return result


quantum_consensus = QuantumConsensus()
