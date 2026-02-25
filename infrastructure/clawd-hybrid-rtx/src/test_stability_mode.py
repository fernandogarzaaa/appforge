import pytest
from fastapi.testclient import TestClient
from chimera_server import app

client = TestClient(app)

def test_stability_mode(monkeypatch):
    monkeypatch.setenv("ENABLE_QUANTUM", "False")
    monkeypatch.setenv("MAX_PRIMARY_MODELS", "1")
    monkeypatch.setenv("MAX_FALLBACK_MODELS", "0")
    monkeypatch.setenv("MAX_TOTAL_MODEL_CALLS", "2")
    monkeypatch.setenv("MAX_REFINEMENT_DEPTH", "1")
    monkeypatch.setenv("MAX_TOTAL_TOKENS", "8000")
    payload = {
        "model": "chimera-quantum",
        "messages": [{"role": "user", "content": "Hello"}],
    }
    response = client.post("/v1/chat/completions", json=payload)
    data = response.json()
    assert "choices" in data
    assert len(data["choices"]) == 1
    assert data["choices"][0]["message"]["content"].strip() != ""
