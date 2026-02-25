def quantum_consensus_voting(responses: list[ModelResponse]) -> dict:
    """Advanced consensus: multi-model voting, confidence scoring, and trace.
    Returns dict: { 'best': ModelResponse, 'votes': {model: count}, 'confidences': {model: float}, 'scores': {model: float}, 'details': ... }
    """
    valid = [r for r in responses if r.content and not r.error]
    if not valid:
        return {"best": None, "votes": {}, "confidences": {}, "scores": {}, "details": "No valid responses"}
    if len(valid) == 1:
        return {"best": valid[0], "votes": {valid[0].model: 1}, "confidences": {valid[0].model: 1.0}, "scores": {valid[0].model: 1.0}, "details": "Only one response"}

    # Vectorize all responses
    vectors = [_text_to_vector(r.content) for r in valid]
    lengths = [len(r.content) for r in valid]
    median_len = float(np.median(lengths))
    entropies = [_text_entropy(r.content) for r in valid]
    max_entropy = max(entropies) if entropies else 1.0
    if max_entropy == 0:
        max_entropy = 1.0

    # Compute pairwise agreement matrix
    n = len(valid)
    agreement_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                agreement_matrix[i, j] = _cosine_similarity(vectors[i], vectors[j])

    # Voting: each model votes for the most similar other response
    votes = {r.model: 0 for r in valid}
    for i in range(n):
        sims = [(agreement_matrix[i, j], j) for j in range(n) if i != j]
        if sims:
            sims.sort(reverse=True)
            best_j = sims[0][1]
            votes[valid[best_j].model] += 1

    # Confidence: normalized agreement score for each model
    confidences = {}
    scores = {}
    for i, resp in enumerate(valid):
        agreement = float(np.mean([agreement_matrix[i, j] for j in range(n) if i != j])) if n > 1 else 1.0
        l_score = _length_score(resp.content, median_len)
        e_score = entropies[i] / max_entropy
        total = 0.50 * agreement + 0.25 * l_score + 0.25 * e_score
        confidences[resp.model] = agreement
        scores[resp.model] = total

    # Winner: most votes, break ties by highest score
    max_votes = max(votes.values())
    candidates = [i for i, r in enumerate(valid) if votes[r.model] == max_votes]
    if len(candidates) == 1:
        best = valid[candidates[0]]
    else:
        # Break tie by highest score
        best_idx = max(candidates, key=lambda i: scores[valid[i].model])
        best = valid[best_idx]

    trace = {
        "votes": votes,
        "confidences": confidences,
        "scores": scores,
        "winner": best.model,
        "details": f"votes={votes}, confidences={confidences}, scores={scores}"
    }
    return {"best": best, **trace}
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
