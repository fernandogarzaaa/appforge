## Kimi-enhanced version
import re

class ResponseScorer:
    def __init__(self):
        pass

    def score(self, query: str, response: str) -> float:
        if not response or len(response.strip()) < 20:
            return 0.0
        # Query echo detection
        if response.strip().lower() == query.strip().lower():
            return 0.0
        # Repetition detection (same sentence 3+ times)
        sentences = re.split(r'[.!?]\s+', response)
        counts = {}
        for s in sentences:
            s = s.strip().lower()
            if not s:
                continue
            counts[s] = counts.get(s, 0) + 1
        if any(v >= 3 for v in counts.values()):
            return 0.1
        # Length ratio (simple heuristic: query complexity = #words)
        qlen = len(query.split())
        rlen = len(response.split())
        if qlen == 0:
            return 1.0 if rlen > 0 else 0.0
        ratio = rlen / qlen
        if ratio < 0.5:
            return 0.2
        if ratio > 5:
            return 0.7
        # Otherwise, scale between 0.3 and 1.0
        return min(1.0, max(0.3, 0.3 + 0.7 * (ratio - 0.5) / 4.5))
