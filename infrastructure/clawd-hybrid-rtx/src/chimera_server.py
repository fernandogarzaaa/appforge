## Kimi-enhanced version
from .model_tracker import ModelTracker
from .conversation_memory import ConversationMemory
from .config import MAX_CALLS_PER_MINUTE
# Global model tracker and conversation memory
_model_tracker = ModelTracker(max_calls_per_minute=MAX_CALLS_PER_MINUTE)
_conversation_memory = ConversationMemory()
def wrap_openai_response(content):
    import uuid
    if not content or not content.strip():
        content = "Sorry, no valid response was generated."
    response = {
        "id": f"chimera-{uuid.uuid4()}",
        "object": "chat.completion",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": content
                },
                "finish_reason": "stop"
            }
        ]
    }
    logger.info(f"OpenAI response length: {len(content)}")
    return response
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
import threading
import json

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, ConfigDict

from .config import MODELS, FALLBACK_MODELS, OPENROUTER_API_KEY, CLAWD_PORT, CLAWD_HOST, REQUEST_TIMEOUT
from .chimera_memory import ChimeraMemory

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("chimera-quantum")

# ---------------------------------------------------------------------------
# Import CHIMERA modules with graceful fallback
# ---------------------------------------------------------------------------

try:
    from .openrouter_client import query_all_models, ModelResponse, get_model_health_summary, get_healthy_models
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
    from .model_discovery import fetch_free_models, save_discovered, needs_refresh, get_best_free_models
    _HAS_DISCOVERY = True
    logger.info("🔍 Model Auto-Discovery loaded")
except ImportError as e:
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
    from .quantum_consensus import select_best_response, quantum_consensus_voting
    _HAS_CONSENSUS = True
except ImportError:
    _HAS_CONSENSUS = False

try:
    from .extended_thinking import ExtendedThinking, get_thinking_engine
    _thinking_engine = get_thinking_engine()
    _HAS_THINKING = True
    logger.info("🤔 Extended Thinking loaded")
except Exception as e:
    logger.warning(f"Extended thinking unavailable: {e}")
    _HAS_THINKING = False
    _thinking_engine = None

try:
    from .semantic_cache import SemanticCache
    _cache = SemanticCache()
    _HAS_CACHE = True
except ImportError:
    _HAS_CACHE = False
    _cache = None

try:
    from .model_auto_discovery import ModelAutoDiscovery
    model_auto_discovery = ModelAutoDiscovery(refresh_interval=3600)
    _HAS_AUTO_DISCOVERY = True
except ImportError:
    _HAS_AUTO_DISCOVERY = False
    model_auto_discovery = None

try:
    from .local_model_adapter import LocalModelAdapter
    _HAS_LOCAL_MODELS = True
except ImportError:
    _HAS_LOCAL_MODELS = False
    LocalModelAdapter = None

try:
    from .safety_filter import safety_filter
    _HAS_SAFETY = True
except ImportError:
    _HAS_SAFETY = False
    def safety_filter(content):
        return True, None

# ---------------------------------------------------------------------------
# Local Model Support (llama.cpp, Ollama, vLLM, etc)
# ---------------------------------------------------------------------------
LOCAL_MODELS = []
if _HAS_LOCAL_MODELS:
    LOCAL_MODELS = [
        LocalModelAdapter("http://localhost:8080", name="qwen2.5-7b"),
    ]

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="CHIMERA QUANTUM",
    description="Quantum-Inspired Multi-Model Intelligence — Free LLM Server",
    version="1.0.0",
)

# --- Chimera Memory (Blueprints) ---
chimera_memory = ChimeraMemory()
_trace_log = []  # In-memory trace log for meta-reasoning/insights

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
# SSE Streaming Helper
# ---------------------------------------------------------------------------

async def _stream_response(content: str, model: str, completion_id: str):
    """Yield SSE chunks in OpenAI streaming format."""
    import asyncio
    
    # First chunk: role
    chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": model,
        "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}],
    }
    yield f"data: {json.dumps(chunk, ensure_ascii=False, separators=(',', ':'))}\n\n"

    # Content chunks: word by word
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
        yield f"data: {json.dumps(chunk, ensure_ascii=False, separators=(',', ':'))}\n\n"
        await asyncio.sleep(0.02)  # Natural streaming feel

    # Final chunk: finish_reason
    chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": int(time.time()),
        "model": model,
        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
    }
    yield f"data: {json.dumps(chunk, ensure_ascii=False, separators=(',', ':'))}\n\n"
    yield "data: [DONE]\n\n"


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

    # --- Step 0: Rolling Conversation Memory ---
    session_id = None
    for header in getattr(request, 'headers', []):
        if header.lower() == 'x-session-id':
            session_id = request.headers[header]
            break
    if not session_id:
        # Fallback: hash first user message
        session_id = str(hash(messages_raw[0]["content"])) if messages_raw else str(uuid.uuid4())
    context_msgs = _conversation_memory.get_context(session_id)
    if context_msgs:
        messages_raw = context_msgs + messages_raw

    # --- Step 0b: Retrieval-augmented generation (RAG) from ChimeraMemory ---
    user_query = messages_raw[-1]["content"] if messages_raw else ""
    similar_blueprints = chimera_memory.get_similar(user_query, top_k=2)
    if similar_blueprints:
        # Inject blueprint context as system prompt
        context = "\n\n".join(f"[Blueprint] {bp.get('consensus','')}" for bp in similar_blueprints)
        messages_raw.insert(0, {"role": "system", "content": f"Reference prior blueprints:\n{context}"})

    # --- Step 1: Token Optimization ---
    from .config import ENABLE_OPTIMIZER, ENABLE_CACHE, ENABLE_QUANTUM, ENABLE_HYPER, MAX_PRIMARY_MODELS, MAX_FALLBACK_MODELS
    if ENABLE_OPTIMIZER and _HAS_OPTIMIZER and _prompt_compressor:
        try:
            messages_raw = _prompt_compressor.deduplicate_messages(messages_raw)
        except Exception as e:
            logger.error(f"Token optimization failed: {e}")
            # Fallback: leave messages_raw unchanged

    # --- Step 2: Query Analysis ---
    query_profile = None
    if ENABLE_HYPER and _HAS_HYPER and _query_analyzer:
        try:
            query_profile = _query_analyzer.analyze(messages_raw)
            logger.info(
                f"Query profile: intent={query_profile.intent} "
                f"complexity={query_profile.complexity:.2f} "
                f"domain={query_profile.domain}"
            )
        except Exception as e:
            logger.error(f"Query analysis failed: {e}")

    # --- Step 3: Strategy Selection + ModelTracker sorting ---
    all_models = MODELS + LOCAL_MODELS
    remote_models = [m for m in all_models if isinstance(m, str)]
    healthy_remote = get_healthy_models(remote_models) if _HAS_CLIENT else remote_models
    healthy_local = [lm for lm in LOCAL_MODELS if lm.health()] if _HAS_LOCAL_MODELS else []
    # Sort healthy_remote by ModelTracker score (descending)
    healthy_remote = sorted(healthy_remote, key=lambda m: -_model_tracker.get_score(m))
    target_models = healthy_local + healthy_remote  # Local first
    if MAX_PRIMARY_MODELS > 0:
        target_models = target_models[:MAX_PRIMARY_MODELS]
    if not target_models:
        logger.error("No healthy models available! All endpoints in cooldown or offline.")
        return wrap_openai_response("All models failed. No valid response generated."), False
    # (Retain strategy selection logic if needed)

    # --- Step 4: Cache Check ---
    if ENABLE_CACHE and _HAS_CACHE and _cache:
        cached = _cache.get(messages_raw)
        if cached is not None:
            logger.info("⚡ Cache hit — serving from semantic cache")
            return cached, True  # (response_dict, is_cached)

    # --- Step 5: Query Models ---
    logger.info(f"🔄 Querying {len(target_models)} models...")
    # Query remote and local models
    remote_targets = [m for m in target_models if isinstance(m, str)]
    local_targets = [m for m in target_models if hasattr(m, 'chat_completion')]
    responses = []
    try:
        if remote_targets:
            responses += await query_all_models(
                messages=messages_raw,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                models=remote_targets,
            )
        for lm in local_targets:
            content = lm.chat_completion(messages_raw, max_tokens=request.max_tokens or 256, temperature=request.temperature)
            responses.append(type('LocalModelResponse', (), {"model": lm.name, "content": content, "error": None, "finish_reason": "stop", "usage": {}})())
    except Exception as e:
        logger.error(f"Exception during model querying: {e}")
    successful = [r for r in responses if r.content and not r.error]
    failed = [r for r in responses if r.error]
    logger.info(f"Results: {len(successful)} successful, {len(failed)} failed")
    for f in failed:
        logger.warning(f"  ✗ {f.model}: {f.error}")
        _model_tracker.record_failure(f.model)
    for s in successful:
        _model_tracker.record_success(s.model, len(s.content))

    # --- Step 6: Quantum Consensus ---
    best = None
    if ENABLE_QUANTUM and _HAS_CONSENSUS:
        try:
            consensus_result = quantum_consensus_voting(successful)
            best = consensus_result.get("best") if isinstance(consensus_result, dict) else None
        except Exception as e:
            logger.error(f"Quantum consensus failed: {e}")
    if best is None and successful:
        best = successful[0]
    if best is None:
        errors = "; ".join(f"{r.model}: {r.error}" for r in failed)
        logger.error(f"All models failed: {errors}")
        
        # --- NVIDIA fallback ---
        from .nvidia_client import NvidiaClient
        from .config import NVIDIA_API_KEY
        if NVIDIA_API_KEY:
            logger.warning("All OpenRouter models failed — trying NVIDIA Qwen fallback")
            try:
                nvidia_client = NvidiaClient(NVIDIA_API_KEY)
                nvidia_response = nvidia_client.chat_completion(
                    messages=messages_raw,
                    max_tokens=request.max_tokens or 512,
                    temperature=request.temperature or 0.7
                )
                if nvidia_response and nvidia_response.get('choices'):
                    content = nvidia_response['choices'][0].get('message', {}).get('content', '')
                    if content:
                        logger.info("NVIDIA Qwen fallback successful")
                        return wrap_openai_response(content), False
                logger.error("NVIDIA fallback returned empty response")
            except Exception as e:
                logger.error(f"NVIDIA fallback failed: {e}")
        
        # --- Hugging Face fallback ---
        try:
            from .hf_client import query_hf_fallback
            from .config import HF_API_KEY
            if HF_API_KEY:
                logger.warning("All OpenRouter/NVIDIA models failed — trying Hugging Face")
                hf_resp = await query_hf_fallback(messages_raw, request.temperature or 0.7, request.max_tokens or 256)
                if hf_resp.content:
                    logger.info("HF fallback successful")
                    return wrap_openai_response(hf_resp.content), False
        except Exception as hf_err:
            logger.error(f"HF fallback failed: {hf_err}")
        
        # All fallbacks exhausted
        logger.error("All models and fallbacks failed")
        return wrap_openai_response("All models failed. Please try again later or add OpenRouter/NVIDIA credits."), False

    # --- Step 7: Blueprint distillation and memory persistence ---
    blueprint = {
        "id": f"CHIMERA-{int(time.time())}-{uuid.uuid4().hex[:6]}",
        "input": user_query,
        "models": [{"model": r.model, "content": r.content, "error": r.error} for r in responses],
        "consensus": best.content,
        "consensus_model": best.model,
        "timestamp": int(time.time()),
    }
    chimera_memory.add_blueprint(blueprint)

    # --- Step 8: Meta-reasoning trace logging ---
    _trace_log.append({
        "timestamp": int(time.time()),
        "input": user_query,
        "blueprint_id": blueprint["id"],
        "consensus_model": best.model,
        "consensus": best.content,
    })
    if len(_trace_log) > 100:
        _trace_log.pop(0)

    # --- Step 9: Safety & Alignment Check ---
    is_safe, reason = safety_filter(best.content) if _HAS_SAFETY else (True, None)
    if not is_safe:
        logger.warning(f"Blocked unsafe completion: {reason}")
        raise HTTPException(status_code=400, detail=f"Blocked by safety filter: {reason}")

    # --- Step 10: Build Response ---
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
    
    # --- Step 11: Cache ---
    if _HAS_CACHE and _cache:
        _cache.put(messages_raw, result.model_dump())

    # --- Step 12: Adaptive Memory ---
    if _HAS_HYPER and _adaptive_memory and query_profile:
        try:
            _adaptive_memory.record(query_profile, best.model, 0.8)  # default quality
        except Exception:
            pass

    # --- Step 13: Cost Tracking ---
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

    # --- Step 14: Conversation Memory update ---
    # Store user and assistant turns
    if session_id:
        _conversation_memory.add_message(session_id, "user", user_query)
        _conversation_memory.add_message(session_id, "assistant", best.content)
    return result.model_dump(), False  # (response_dict, is_cached)


# ---------------------------------------------------------------------------
# API Endpoints
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
    result = {"traces": list(_trace_log), "blueprints": chimera_memory.all_blueprints()}
    if _HAS_HYPER and _adaptive_memory:
        try:
            result["adaptive_memory"] = _adaptive_memory.get_insights()
        except Exception:
            result["adaptive_memory"] = "unavailable"
    if _HAS_QUANTUM and _quantum_engine:
        result["quantum_engine"] = "active"
    return result


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


@app.get("/v1/local_models")
async def get_local_models():
    """Return status of configured local models."""
    if not _HAS_LOCAL_MODELS:
        return {"error": "Local model support not available"}
    return {lm.name: lm.health() for lm in LOCAL_MODELS}


@app.get("/v1/blueprint_clusters")
async def get_blueprint_clusters(n: int = 5):
    """Return clusters of blueprints by semantic similarity."""
    clusters = chimera_memory.cluster_blueprints(n_clusters=n)
    return {"n_clusters": n, "clusters": [[bp["id"] for bp in group] for group in clusters]}


@app.get("/v1/endpoints")
async def get_endpoints_health():
    """Return health summary for all model endpoints."""
    if not _HAS_CLIENT:
        return {"error": "Client module not available"}
    return get_model_health_summary()


@app.get("/v1/selfeval")
async def get_selfeval():
    """Return results of recent continuous self-evaluation runs."""
    return {"results": list(_selfeval_results)}


@app.get("/v1/trace")
async def get_trace_log():
    """Return the last 100 meta-reasoning traces (detailed pipeline logs)."""
    return {
        "count": len(_trace_log),
        "traces": list(_trace_log),
    }


@app.get("/v1/discovered_models")
async def list_discovered_models():
    if not _HAS_AUTO_DISCOVERY or not model_auto_discovery:
        return {"error": "Auto-discovery not available"}
    return {"models": model_auto_discovery.get_endpoints()}


# ---------------------------------------------------------------------------
# Continuous Self-Evaluation (Background Task)
# ---------------------------------------------------------------------------

_selfeval_results = []  # Store last 20 self-eval runs

def _self_evaluation_loop():
    import random
    while True:
        try:
            # Sample a recent blueprint
            blueprints = chimera_memory.all_blueprints()
            if not blueprints:
                time.sleep(600)
                continue
            blueprint = random.choice(blueprints[-10:]) if len(blueprints) > 10 else random.choice(blueprints)
            input_query = blueprint.get("input", "")
            orig_consensus = blueprint.get("consensus", "")
            # Re-query models for the same input
            messages = [{"role": "user", "content": input_query}]
            # Use same pipeline as normal, but only for self-eval
            query_profile = _query_analyzer.analyze(messages) if _HAS_HYPER and _query_analyzer else None
            target_models = MODELS
            if _HAS_OPTIMIZER and _smart_router and query_profile:
                best_model = _smart_router.select_model(messages, MODELS, adaptive_memory=_adaptive_memory, query_profile=query_profile)
                if best_model in MODELS:
                    target_models = [best_model] + [m for m in MODELS if m != best_model]
            responses = []
            try:
                responses = query_all_models(messages=messages, temperature=0.7, max_tokens=256, models=target_models)
                if hasattr(responses, "__await__"):  # If coroutine, await it
                    import asyncio
                    responses = asyncio.run(responses)
            except Exception as e:
                _selfeval_results.append({"input": input_query, "error": str(e), "ts": int(time.time())})
                if len(_selfeval_results) > 20:
                    _selfeval_results.pop(0)
                time.sleep(600)
                continue
            
            if _HAS_CONSENSUS:
                consensus_result = quantum_consensus_voting([r for r in responses if hasattr(r, "content") and r.content])
                new_consensus = consensus_result.get("best").content if consensus_result.get("best") else ""
            else:
                new_consensus = responses[0].content if responses else ""
            
            drift = (orig_consensus.strip() != new_consensus.strip())
            _selfeval_results.append({
                "input": input_query,
                "orig_consensus": orig_consensus,
                "new_consensus": new_consensus,
                "drift": drift,
                "ts": int(time.time()),
            })
            if len(_selfeval_results) > 20:
                _selfeval_results.pop(0)
        except Exception as e:
            _selfeval_results.append({"error": str(e), "ts": int(time.time())})
            if len(_selfeval_results) > 20:
                _selfeval_results.pop(0)
        time.sleep(600)  # Run every 10 minutes


# Start background threads
def _auto_update_registry_loop():
    while True:
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
        time.sleep(3600)


# Start background threads
threading.Thread(target=_self_evaluation_loop, daemon=True).start()
threading.Thread(target=_auto_update_registry_loop, daemon=True).start()


# ---------------------------------------------------------------------------
# Startup Banner
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_banner():
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


if __name__ == "__main__":
    main()




