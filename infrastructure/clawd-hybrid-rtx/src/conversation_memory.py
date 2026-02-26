## Kimi-enhanced version
import os
import json
from collections import deque
from typing import Dict, List

CONV_PATH = os.path.join(os.path.dirname(__file__), '../data/conversation_memory.json')
MAX_HISTORY = 6

class ConversationMemory:
    def __init__(self):
        self.memory: Dict[str, deque] = {}
        self._load()

    def _load(self):
        if os.path.exists(CONV_PATH):
            try:
                with open(CONV_PATH, 'r') as f:
                    data = json.load(f)
                    for k, v in data.items():
                        self.memory[k] = deque(v, maxlen=MAX_HISTORY)
            except Exception:
                pass

    def _save(self):
        try:
            with open(CONV_PATH, 'w') as f:
                json.dump({k: list(v) for k, v in self.memory.items()}, f)
        except Exception:
            pass

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.memory:
            self.memory[session_id] = deque(maxlen=MAX_HISTORY)
        self.memory[session_id].append({'role': role, 'content': content})
        self._save()

    def get_context(self, session_id: str) -> List[dict]:
        return list(self.memory.get(session_id, []))

    def compress_old(self, session_id: str, summarizer):
        # If more than MAX_HISTORY, compress oldest into summary using summarizer (never Kimi)
        if len(self.memory.get(session_id, [])) > MAX_HISTORY:
            old = list(self.memory[session_id])[:-MAX_HISTORY]
            summary = summarizer(old)
            self.memory[session_id] = deque([{'role': 'system', 'content': summary}] + list(self.memory[session_id])[-MAX_HISTORY:], maxlen=MAX_HISTORY)
            self._save()
