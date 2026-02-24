"""
╔══════════════════════════════════════════════════════╗
║          CHIMERA QUANTUM LLM v1.0                    ║
║    Quantum-Inspired Multi-Model Intelligence         ║
║                                                      ║
║  Engine: Quantum Consensus + Hyper Intelligence      ║
║  Cost:   Free (OpenRouter free tier)                 ║
╚══════════════════════════════════════════════════════╝

CHIMERA QUANTUM — The ultimate free LLM server.
Combines multiple free models with quantum-inspired consensus,
hyper-intelligence routing, token optimization, and adaptive memory.
"""

import logging
import time
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, ConfigDict

from .config import MODELS, FALLBACK_MODELS, OPENROUTER_API_KEY, CLAWD_PORT, CLAWD_HOST, REQUEST_TIMEOUT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("chimera-quantum")

# ---------------------------------------------------------------------------
# Import CHIMERA modules with graceful fallback
# ---------------------------------------------------------------------------

try:
    from .openrouter_client import query_all_models, ModelResponse
    _HAS_CLIENT = True
except ImportError as e:
    logger.warning(f"openrouter_client unavailable: {e}")
    _HAS_CLIENT = False

try:
    from .chimera_quantum_engine import ChimeraQuantumEngine, HyperIntelligence as QHyperIntelligence, QuantumCache
    _quantum_engine = ChimeraQuantumEngine()
    _HAS_QUANTUM = True
    logger.info("⚛️  Quantum Engine loaded")
except Exception as e:
    logger.warning(f"Quantum engine unavailable: {e}")
    _HAS_QUANTUM = False
    _quantum_engine = None

try:
    from .model_discovery import needs_refresh, get_best_free_models, fetch_free_models, save_discovered
    _HAS_DISCOVERY = True
    logger.info("🔍 Model Auto-Discovery loaded")
except Exception as e:
    logger.warning(f"Model discovery unavailable: {e}")
    _HAS_DISCOVERY = False

try:
    from .hyper_intelligence import QueryAnalyzer, StrategySelector, ResponseSynthesizer, AdaptiveMemory
    _query_analyzer = QueryAnalyzer()
    _strategy_selector = StrategySelector()
    _response_synthesizer = ResponseSynthesizer()
    _adaptive_memory = AdaptiveMemory()
    _HAS_HYPER = True
    logger.info("🧠 Hyper Intelligence loaded")
except ImportError as e:
    logger.warning(f"Hyper Intelligence unavailable: {e}")
    _HAS_HYPER = False
    _query_analyzer = None
    _strategy_selector = None
    _response_synthesizer = None
    _adaptive_memory = None

try:
    from .token_optimizer import PromptCompressor, TokenCounter, SmartRouter, CostTracker
    _prompt_compressor = PromptCompressor()
    _token_counter = TokenCounter()
    _smart_router = SmartRouter()
    _cost_tracker = CostTracker()
    _HAS_OPTIMIZER = True
    logger.info("📈 Token Optimizer loaded")
except ImportError as e:
    logger.warning(f"Token optimizer unavailable: {e}")
    _HAS_OPTIMIZER = False
    _prompt_compressor = None
    _token_counter = None
    _smart_router = None
    _cost_tracker = None

try:
    from .quantum_consensus import select_best_response
    _HAS_CONSENSUS = True
except ImportError:
    _HAS_CONSENSUS = False

try:
    from .semantic_cache import SemanticCache
    _cache = SemanticCache()
    _HAS_CACHE = True
except ImportError:
    _HAS_CACHE = False
    _cache = None

try:
    from .model_discovery import fetch_free_models, save_discovered, needs_refresh, get_best_free_models
    _HAS_DISCOVERY = True
    logger.info("🔍 Model Auto-Discovery loaded")
except ImportError as e:
    logger.warning(f"Model discovery unavailable: {e}")
    _HAS_DISCOVERY = False

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="CHIMERA QUANTUM",
    description="Quantum-Inspired Multi-Model Intelligence — Free LLM Server",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "message": str(exc),
                "type": "invalid_request_error",
                "code": "validation_error",
            }
        },
    )


@app.exception_handler(Exception)
async def general_error_handler(request, exc):
    logger.exception("Unhandled error")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": str(exc),
                "type": "server_error",
                "code": "internal_error",
            }
        },
    )


# ---------------------------------------------------------------------------
# Pydantic Models (OpenAI-compatible, extra fields ignored)
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str
    content: str | list | None = None
    name: str | None = None
    tool_call_id: str | None = None
    tool_calls: list | None = None


class ChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    model: str = "chimera-quantum"
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = None
    stream: bool = False
    top_p: float | None = None
    frequency_penalty: float | None = None
    presence_penalty: float | None = None
    stop: str | list[str] | None = None
    n: int | None = 1
    user: str | None = None
    seed: int | None = None
    logprobs: bool | None = None
    top_logprobs: int | None = None
    response_format: dict | None = None
    tools: list | None = None
    tool_choice: str | dict | None = None


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class Choice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: str | None = "stop"


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[Choice]
    usage: Usage


class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    owned_by: str = "chimera-quantum"


class ModelList(BaseModel):
    object: str = "list"
    data: list[ModelInfo]


# ---------------------------------------------------------------------------
# SSE Streaming Helper
# ---------------------------------------------------------------------------

async def _stream_response(content: str, model: str, completion_id: str):
    """Yield SSE chunks in OpenAI streaming format."""
    # First chunk: role
    chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": model,
        "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}],
    }
    yield f"data: {_json_dumps(chunk)}\n\n"

    # Content chunks: word by word
    import asyncio
    words = content.split(" ")
    for i, word in enumerate(words):
        token = word if i == 0 else f" {word}"
        chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": model,
            "choices": [{"index": 0, "delta": {"content": token}, "finish_reason": None}],
        }
        yield f"data: {_json_dumps(chunk)}\n\n"
        await asyncio.sleep(0.02)  # Natural streaming feel

    # Final chunk: finish_reason
    chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": model,
        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
    }
    yield f"data: {_json_dumps(chunk)}\n\n"
    yield "data: [DONE]\n\n"


def _json_dumps(obj: dict) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


# ---------------------------------------------------------------------------
# Core Completion Logic
# ---------------------------------------------------------------------------

async def _process_completion(request: ChatCompletionRequest):
    """
    CHIMERA QUANTUM request pipeline:
    1. Token Optimization (compress prompts, deduplicate)
    2. Query Analysis (classify intent, complexity, domain)
    3. Strategy Selection (single model / ensemble / specialist)
    4. Cache Check
    5. Model Query (parallel with circuit breakers)
    6. Quantum Consensus / Response Synthesis
    7. Adaptive Memory Update
    8. Cost Tracking
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not configured. Get a free key at https://openrouter.ai/keys",
        )

    if not _HAS_CLIENT:
        raise HTTPException(status_code=500, detail="OpenRouter client module not available")

    messages_raw = [{"role": m.role, "content": m.content or ""} for m in request.messages]

    # --- Step 1: Token Optimization ---
    if _HAS_OPTIMIZER and _prompt_compressor:
        try:
            messages_raw = _prompt_compressor.deduplicate_messages(messages_raw)
        except Exception as e:
            logger.warning(f"Token optimization failed: {e}")

    # --- Step 2: Query Analysis ---
    query_profile = None
    if _HAS_HYPER and _query_analyzer:
        try:
            query_profile = _query_analyzer.analyze(messages_raw)
            logger.info(
                f"Query profile: intent={query_profile.intent} "
                f"complexity={query_profile.complexity:.2f} "
                f"domain={query_profile.domain}"
            )
        except Exception as e:
            logger.warning(f"Query analysis failed: {e}")

    # --- Step 3: Strategy Selection ---
    strategy = None
    target_models = MODELS
    if _HAS_HYPER and _strategy_selector and query_profile:
        try:
            strategy = _strategy_selector.select(query_profile, MODELS)
            if strategy and strategy.models:
                target_models = strategy.models
            logger.info(f"Strategy: {strategy.name if strategy else 'default'} → {target_models}")
        except Exception as e:
            logger.warning(f"Strategy selection failed: {e}")

    # --- Step 4: Cache Check ---
    if _HAS_CACHE and _cache:
        cached = _cache.get(messages_raw)
        if cached is not None:
            logger.info("⚡ Cache hit — serving from semantic cache")
            return cached, True  # (response_dict, is_cached)

    # --- Step 5: Query Models ---
    logger.info(f"🔄 Querying {len(target_models)} models ({strategy.name if strategy else 'default'})...")
    responses = await query_all_models(
        messages=messages_raw,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
        models=target_models,
    )

    successful = [r for r in responses if r.content and not r.error]
    failed = [r for r in responses if r.error]
    logger.info(f"Results: {len(successful)} successful, {len(failed)} failed")
    for f in failed:
        logger.warning(f"  ✗ {f.model}: {f.error}")

    # --- Step 6: Quantum Consensus ---
    best = None
    if _HAS_QUANTUM and _quantum_engine and len(successful) > 1:
        try:
            result = _quantum_engine.superposition_evaluate(
                [{"model": r.model, "content": r.content} for r in successful]
            )
            if result and "best" in result:
                best_model = result["best"].get("model", "")
                for r in successful:
                    if r.model == best_model:
                        best = r
                        break
            if best:
                logger.info(f"⚛️  Quantum consensus winner: {best.model}")
        except Exception as e:
            logger.warning(f"Quantum consensus failed, falling back: {e}")

    if best is None and _HAS_CONSENSUS and successful:
        try:
            best = select_best_response(responses)
        except Exception as e:
            logger.warning(f"Classic consensus failed: {e}")

    if best is None and successful:
        best = successful[0]

    if best is None:
        errors = "; ".join(f"{r.model}: {r.error}" for r in failed)
        raise HTTPException(status_code=502, detail=f"All models failed: {errors}")

    # --- Step 7: Build Response ---
    completion_id = f"chatcmpl-chimera-{uuid.uuid4().hex[:12]}"
    result = ChatCompletionResponse(
        id=completion_id,
        created=int(time.time()),
        model=f"chimera-quantum/{best.model}",
        choices=[
            Choice(
                message=ChatMessage(role="assistant", content=best.content),
                finish_reason=best.finish_reason or "stop",
            )
        ],
        usage=Usage(**(best.usage or {})),
    )

    # --- Step 8: Cache ---
    if _HAS_CACHE and _cache:
        _cache.put(messages_raw, result.model_dump())

    # --- Step 9: Adaptive Memory ---
    if _HAS_HYPER and _adaptive_memory and query_profile:
        try:
            _adaptive_memory.record(query_profile, best.model, 0.8)  # default quality
        except Exception:
            pass

    # --- Step 10: Cost Tracking ---
    if _HAS_OPTIMIZER and _cost_tracker:
        try:
            usage = best.usage or {}
            _cost_tracker.record(
                model=best.model,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
            )
        except Exception:
            pass

    return result.model_dump(), False  # (response_dict, is_cached)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    modules = []
    if _HAS_QUANTUM:
        modules.append("quantum-engine")
    if _HAS_HYPER:
        modules.append("hyper-intelligence")
    if _HAS_OPTIMIZER:
        modules.append("token-optimizer")
    if _HAS_CACHE:
        modules.append("semantic-cache")
    if _HAS_CONSENSUS:
        modules.append("quantum-consensus")

    return {
        "name": "CHIMERA QUANTUM",
        "version": "1.0.0",
        "tagline": "Quantum-Inspired Multi-Model Intelligence",
        "models_primary": len(MODELS),
        "models_fallback": len(FALLBACK_MODELS),
        "modules_active": modules,
        "endpoints": {
            "chat": "/v1/chat/completions",
            "models": "/v1/models",
            "health": "/health",
            "stats": "/v1/stats",
            "insights": "/v1/insights",
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "name": "CHIMERA QUANTUM",
        "version": "1.0.0",
        "cache_size": _cache.size if _HAS_CACHE and _cache else 0,
        "models_configured": len(MODELS),
        "fallback_models": len(FALLBACK_MODELS),
        "quantum_engine": _HAS_QUANTUM,
        "hyper_intelligence": _HAS_HYPER,
        "token_optimizer": _HAS_OPTIMIZER,
        "api_key_configured": bool(OPENROUTER_API_KEY),
    }


@app.get("/models")
@app.get("/v1/models")
async def list_models():
    models = [ModelInfo(id="chimera-quantum")]
    for m in MODELS:
        models.append(ModelInfo(id=m, owned_by="openrouter"))
    return ModelList(data=models)


@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    result_dict, is_cached = await _process_completion(request)

    if request.stream and not is_cached:
        # Extract content for streaming
        content = ""
        model = "chimera-quantum"
        completion_id = result_dict.get("id", f"chatcmpl-chimera-{uuid.uuid4().hex[:12]}")
        choices = result_dict.get("choices", [])
        if choices:
            msg = choices[0].get("message", {})
            content = msg.get("content", "")
            model = result_dict.get("model", model)

        return StreamingResponse(
            _stream_response(content, model, completion_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    return JSONResponse(content=result_dict)


@app.get("/v1/stats")
async def stats():
    if _HAS_OPTIMIZER and _cost_tracker:
        return _cost_tracker.report()
    return {"message": "Cost tracker not available", "tracking": False}


@app.get("/v1/insights")
async def insights():
    result = {}
    if _HAS_HYPER and _adaptive_memory:
        try:
            result["adaptive_memory"] = _adaptive_memory.get_insights()
        except Exception:
            result["adaptive_memory"] = "unavailable"
    if _HAS_QUANTUM and _quantum_engine:
        result["quantum_engine"] = "active"
    return result or {"message": "No intelligence modules loaded"}


@app.get("/v1/discover")
async def discover_models():
    """Trigger a fresh scan of OpenRouter for free models."""
    if not _HAS_DISCOVERY:
        return {"error": "Model discovery module not available"}
    try:
        models = fetch_free_models()
        if models:
            save_discovered(models)
        return {
            "status": "ok",
            "models_found": len(models),
            "top_10": [{"id": m.id, "name": m.name, "quality": round(m.quality_score, 2), "context": m.context_length} for m in models[:10]],
        }
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Startup Banner
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_banner():
    # Auto-discover new free models if cache is stale
    if _HAS_DISCOVERY:
        try:
            if needs_refresh(max_age_hours=24.0):
                logger.info("🔍 Refreshing free model list from OpenRouter...")
                fresh = fetch_free_models()
                if fresh:
                    save_discovered(fresh)
                    logger.info(f"🔍 Found {len(fresh)} free models")
        except Exception as e:
            logger.warning(f"Auto-discovery refresh failed: {e}")

    banner = f"""
╔══════════════════════════════════════════════════════╗
║          CHIMERA QUANTUM LLM v1.0                    ║
║    Quantum-Inspired Multi-Model Intelligence         ║
║                                                      ║
║  Models: {len(MODELS)} primary + {len(FALLBACK_MODELS)} fallback{' ' * (27 - len(str(len(MODELS))) - len(str(len(FALLBACK_MODELS))))}║
║  Engine: {'FULL' if _HAS_QUANTUM else 'BASIC'} (quantum={'✓' if _HAS_QUANTUM else '✗'} hyper={'✓' if _HAS_HYPER else '✗'} optim={'✓' if _HAS_OPTIMIZER else '✗'}){' ' * 3}║
║  Port:   {CLAWD_PORT}{' ' * (39 - len(str(CLAWD_PORT)))}║
║  API Key: {'✓ configured' if OPENROUTER_API_KEY else '✗ MISSING!'}{' ' * (37 - len('✓ configured' if OPENROUTER_API_KEY else '✗ MISSING!'))}║
╚══════════════════════════════════════════════════════╝
"""
    for line in banner.strip().split("\n"):
        logger.info(line)


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

def main():
    import uvicorn

    logger.info(f"Starting CHIMERA QUANTUM on {CLAWD_HOST}:{CLAWD_PORT}")
    logger.info(f"Primary models: {MODELS}")
    logger.info(f"Fallback models: {FALLBACK_MODELS}")
    uvicorn.run(app, host=CLAWD_HOST, port=CLAWD_PORT)
