"""Score responses by coherence and return the best one.

Uses cosine similarity between responses, length normalization, and entropy
to pick the most coherent / representative answer from multiple models.
"""

import logging
import numpy as np

from .openrouter_client import ModelResponse

logger = logging.getLogger(__name__)


def _text_to_vector(text: str, dim: int = 256) -> np.ndarray:
    """Convert text to a simple bag-of-characters frequency vector.

    This is intentionally lightweight — no ML models required.
    Uses character n-gram (bigram) frequency as a proxy for semantic content.
    """
    vec = np.zeros(dim, dtype=np.float64)
    text_lower = text.lower()
    for i in range(len(text_lower) - 1):
        bigram_hash = hash(text_lower[i : i + 2]) % dim
        vec[bigram_hash] += 1.0
    # Normalize
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(dot / (na * nb))


def _text_entropy(text: str) -> float:
    """Compute Shannon entropy of character distribution (higher = more diverse)."""
    if not text:
        return 0.0
    freq: dict[str, int] = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    total = len(text)
    entropy = 0.0
    for count in freq.values():
        p = count / total
        if p > 0:
            entropy -= p * np.log2(p)
    return entropy


def _length_score(text: str, median_length: float) -> float:
    """Score based on how close the response length is to the median.

    Returns a value in (0, 1]. Responses close to the median score higher.
    """
    if median_length == 0:
        return 1.0
    ratio = len(text) / median_length
    # Gaussian-like penalty for deviation from median
    return float(np.exp(-0.5 * (ratio - 1.0) ** 2))


def select_best_response(responses: list[ModelResponse]) -> ModelResponse | None:
    """Score and rank model responses, returning the best one.

    Scoring components (weighted sum):
      - Agreement score (0.50): avg cosine similarity with other responses
      - Length score    (0.25): closeness to median response length
      - Entropy score  (0.25): normalized Shannon entropy (diversity of content)
    """
    # Filter to responses that actually have content
    valid = [r for r in responses if r.content and not r.error]

    if not valid:
        logger.warning("No valid responses to score")
        return None

    if len(valid) == 1:
        return valid[0]

    # Vectorize all responses
    vectors = [_text_to_vector(r.content) for r in valid]

    # Compute median length
    lengths = [len(r.content) for r in valid]
    median_len = float(np.median(lengths))

    # Compute entropy range for normalization
    entropies = [_text_entropy(r.content) for r in valid]
    max_entropy = max(entropies) if entropies else 1.0
    if max_entropy == 0:
        max_entropy = 1.0

    scores: list[float] = []

    for i, resp in enumerate(valid):
        # Agreement: average cosine similarity with all other responses
        sims = []
        for j, other_vec in enumerate(vectors):
            if i != j:
                sims.append(_cosine_similarity(vectors[i], other_vec))
        agreement = float(np.mean(sims)) if sims else 0.0

        # Length normalization
        l_score = _length_score(resp.content, median_len)

        # Entropy (normalized to [0, 1])
        e_score = entropies[i] / max_entropy

        # Weighted combination
        total = 0.50 * agreement + 0.25 * l_score + 0.25 * e_score
        scores.append(total)

        logger.debug(
            f"  {resp.model}: agreement={agreement:.3f} length={l_score:.3f} "
            f"entropy={e_score:.3f} total={total:.3f}"
        )

    best_idx = int(np.argmax(scores))
    best = valid[best_idx]
    logger.info(f"Quantum consensus winner: {best.model} (score={scores[best_idx]:.3f})")
    return best
