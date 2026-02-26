## Kimi-enhanced version
import json
import os
import threading
import time
from collections import defaultdict, deque
from typing import Dict, Any

MODEL_STATS_PATH = os.path.join(os.path.dirname(__file__), '../data/model_stats.json')
MAX_CALLS_PER_MINUTE = 10  # Can be overridden in config
KIMI_MODEL_ID = 'moonshot/kimi-2.5:free'

class ModelTracker:
    def __init__(self, max_calls_per_minute=MAX_CALLS_PER_MINUTE):
        self.lock = threading.Lock()
        self.stats = defaultdict(lambda: {
            'success_count': 0,
            'failure_count': 0,
            'empty_response_count': 0,
            'total_response_length': 0,
            'call_timestamps': deque(),
            'cooldown_until': 0
        })
        self.max_calls_per_minute = max_calls_per_minute
        self._load()

    def _load(self):
        if os.path.exists(MODEL_STATS_PATH):
            try:
                with open(MODEL_STATS_PATH, 'r') as f:
                    data = json.load(f)
                    for k, v in data.items():
                        self.stats[k].update(v)
            except Exception:
                pass

    def _save(self):
        try:
            with open(MODEL_STATS_PATH, 'w') as f:
                json.dump(self.stats, f)
        except Exception:
            pass

    def record_success(self, model_id, response_length):
        with self.lock:
            s = self.stats[model_id]
            s['success_count'] += 1
            s['total_response_length'] += response_length
            self._save()

    def record_failure(self, model_id):
        with self.lock:
            s = self.stats[model_id]
            s['failure_count'] += 1
            self._save()

    def record_empty(self, model_id):
        with self.lock:
            s = self.stats[model_id]
            s['empty_response_count'] += 1
            self._save()

    def get_score(self, model_id):
        s = self.stats[model_id]
        total = s['success_count'] + s['failure_count'] + s['empty_response_count']
        if total == 0:
            return 0.5
        success_rate = s['success_count'] / total
        avg_len = s['total_response_length'] / max(1, s['success_count'])
        return min(1.0, max(0.0, 0.7 * success_rate + 0.3 * (avg_len / 1000)))

    def mark_degraded(self, model_id, cooldown_seconds=300):
        with self.lock:
            self.stats[model_id]['cooldown_until'] = time.time() + cooldown_seconds
            self._save()

    def is_available(self, model_id):
        if model_id == KIMI_MODEL_ID:
            return True
        return time.time() >= self.stats[model_id]['cooldown_until']

    def can_call(self, model_id):
        if model_id == KIMI_MODEL_ID:
            return True
        now = time.time()
        dq = self.stats[model_id]['call_timestamps']
        while dq and dq[0] < now - 60:
            dq.popleft()
        return len(dq) < self.max_calls_per_minute

    def record_call(self, model_id):
        if model_id == KIMI_MODEL_ID:
            return
        now = time.time()
        dq = self.stats[model_id]['call_timestamps']
        dq.append(now)
        while dq and dq[0] < now - 60:
            dq.popleft()
        self._save()
