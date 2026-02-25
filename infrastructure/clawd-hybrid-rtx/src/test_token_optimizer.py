import pytest
from token_optimizer import PromptCompressor, SmartRouter

@pytest.mark.parametrize("input_data,expected", [
    ([{"role": "user", "content": "Hello world"}], "hello world"),
    ("Just a string prompt", "just a string prompt"),
    ([{"role": "system", "content": "Ignore this"}, {"role": "user", "content": "Actual question"}], "actual question"),
    (None, ""),
])
def test_normalization(input_data, expected):
    pc = PromptCompressor()
    norm = pc._normalize(input_data)
    assert norm == expected

@pytest.mark.parametrize("messages,expected", [
    ([{"role": "user", "content": "A"}], 1),
    ([{"role": "user", "content": "A"}, {"role": "user", "content": "B"}], 2),
    ([{"role": "system", "content": "Ignore"}, {"role": "user", "content": "A"}], 1),
])
def test_deduplication(messages, expected):
    pc = PromptCompressor()
    deduped = pc.deduplicate_messages(messages)
    assert len(deduped) == expected

@pytest.mark.parametrize("messages", [
    ([{"role": "user", "content": "A"}],),
    ([{"role": "user", "content": "A"}, {"role": "user", "content": "B"}],),
])
def test_router_select_model(messages):
    router = SmartRouter()
    model = router.select_model(messages, ["ollama_local", "llama-3.3-70b"])
    assert model in ["ollama_local", "llama-3.3-70b"]
