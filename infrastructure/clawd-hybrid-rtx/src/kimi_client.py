## Kimi-enhanced version
import requests
import time
import json
import os
from datetime import datetime

KIMI_USAGE_PATH = os.path.join(os.path.dirname(__file__), '../data/kimi_usage.json')
KIMI_COST_PER_1K = 0.012

class KimiClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.moonshot.ai/v1/chat/completions"

    def chat(self, messages, **kwargs):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "moonshot/kimi-2.5",
            "messages": messages
        }
        payload.update(kwargs)
        resp = requests.post(self.base_url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        # Cost tracking
        prompt_len = sum(len(m.get('content','')) for m in messages)
        resp_text = data['choices'][0]['message']['content'] if data.get('choices') else ''
        resp_len = len(resp_text)
        prompt_tokens = prompt_len // 4
        completion_tokens = resp_len // 4
        cost = ((prompt_tokens + completion_tokens) / 1000) * KIMI_COST_PER_1K
        entry = {
            'timestamp': int(time.time()),
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'prompt_tokens': prompt_tokens,
            'completion_tokens': completion_tokens,
            'cost_usd': round(cost, 6)
        }
        try:
            if os.path.exists(KIMI_USAGE_PATH):
                with open(KIMI_USAGE_PATH, 'r') as f:
                    usage = json.load(f)
            else:
                usage = []
            usage.append(entry)
            with open(KIMI_USAGE_PATH, 'w') as f:
                json.dump(usage, f)
        except Exception:
            pass
        return data

    @staticmethod
    def get_daily_summary():
        today = datetime.utcnow().strftime('%Y-%m-%d')
        calls = 0
        tokens = 0
        cost = 0.0
        if os.path.exists(KIMI_USAGE_PATH):
            try:
                with open(KIMI_USAGE_PATH, 'r') as f:
                    usage = json.load(f)
                for entry in usage:
                    if entry.get('date') == today:
                        calls += 1
                        tokens += entry.get('prompt_tokens',0) + entry.get('completion_tokens',0)
                        cost += entry.get('cost_usd',0)
            except Exception:
                pass
        projected_monthly_cost = cost * 30  # rough estimate
        return {
            'calls_today': calls,
            'tokens_today': tokens,
            'cost_today': round(cost, 4),
            'projected_monthly_cost': round(projected_monthly_cost, 2)
        }
