import pytest
import numpy as np
from semantic_cache import SemanticCache

@pytest.fixture
def cache():
    return SemanticCache(threshold=0.92, dim=16)

def test_cache_key_extraction(cache):
    messages1 = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is AI?"}
    ]
    messages2 = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is AI?"}
    ]
    messages3 = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is ML?"}
    ]
    cache.put(messages1, {"choices": [{"message": {"content": "AI is..."}}]})
    assert cache.get(messages2) is not None
    assert cache.get(messages3) is None

def test_no_cache_empty_response(cache):
    messages = [{"role": "user", "content": "Test"}]
    cache.put(messages, {"choices": [{"message": {"content": ""}}]})
    assert cache.get(messages) is None

def test_cache_ttl(cache):
    messages = [{"role": "user", "content": "TTL test"}]
    cache.put(messages, {"choices": [{"message": {"content": "TTL"}}]})
    cache._entries[0].timestamp -= 4000  # Expire
    cache._evict_expired()
    assert cache.size == 0
