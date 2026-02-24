"""
Clawd Hybrid RTX LLM - API Server
FastAPI server providing OpenAI-compatible chat completions endpoint.
Uses RTX 2060 for embeddings/caching + OpenRouter free-tier ensemble + quantum consensus.
"""
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from .config import settings
from .openrouter_client import openrouter_client
from .quantum_consensus import quantum_consensus
from .semantic_cache import semantic_cache


# --- Pydantic Models ---

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "clawd-hybrid-rtx"
    messages: list[ChatMessage]
    max_tokens: int = 1024
    temperature: float = 0.7
    stream: bool = False
    ensemble_size: int = Field(default=5, ge=1, le=5)

class ChatCompletionChoice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: str = "stop"

class UsageInfo(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[ChatCompletionChoice]
    usage: UsageInfo
    coherence: float = 0.0
    confidence: float = 0.0
    cache_hit: bool = False
    ensemble_size: int = 0

class HealthResponse(BaseModel):
    status: str
    version: str
    cache: dict
    models: list[str]
    coherence_target: float


# --- App Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("  Clawd Hybrid RTX LLM Server")
    print("  RTX 2060 + OpenRouter Ensemble + Quantum Consensus")
    print("=" * 60)
    print(f"  Models: {len(settings.free_models)} free-tier")
    print(f"  Cache: {'enabled' if semantic_cache.enabled else 'disabled'}")
    print(f"  Coherence target: {settings.coherence_target}")
    print(f"  Port: {settings.port}")
    print("=" * 60)
    yield
    # Shutdown: save cache
    if semantic_cache.enabled:
        semantic_cache._save_cache()
        print("[Shutdown] Cache saved to disk")


# --- FastAPI App ---

app = FastAPI(
    title="Clawd Hybrid RTX LLM",
    description="Zero-cost LLM server: RTX 2060 local embeddings + OpenRouter free-tier ensemble + quantum consensus",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        cache=semantic_cache.stats,
        models=settings.free_models,
        coherence_target=settings.coherence_target,
    )


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "clawd-hybrid-rtx",
                "object": "model",
                "created": 1709251200,
                "owned_by": "clawd",
                "description": "Hybrid RTX 2060 + OpenRouter ensemble with quantum consensus",
            }
        ] + [
            {"id": m, "object": "model", "created": 1709251200, "owned_by": "openrouter"}
            for m in settings.free_models
        ],
    }


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(request: ChatCompletionRequest):
    start_time = time.time()
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    # Check semantic cache first
    cached = semantic_cache.get(messages)
    if cached:
        return ChatCompletionResponse(
            id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
            created=int(time.time()),
            model="clawd-hybrid-rtx",
            choices=[ChatCompletionChoice(
                message=ChatMessage(role="assistant", content=cached["content"]),
            )],
            usage=UsageInfo(),
            coherence=cached.get("coherence", 1.0),
            confidence=cached.get("confidence", 1.0),
            cache_hit=True,
            ensemble_size=0,
        )

    # Query OpenRouter ensemble
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.clawd",
        )

    responses = await openrouter_client.query_ensemble(
        messages=messages,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        num_models=request.ensemble_size,
    )

    if not responses:
        raise HTTPException(status_code=502, detail="No responses from any model")

    # Quantum consensus selection
    best = quantum_consensus.select_best(responses)

    # Cache the result
    semantic_cache.put(messages, best)

    latency_ms = (time.time() - start_time) * 1000

    return ChatCompletionResponse(
        id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
        created=int(time.time()),
        model=f"clawd-hybrid-rtx (via {best.get('model', 'unknown')})",
        choices=[ChatCompletionChoice(
            message=ChatMessage(role="assistant", content=best["content"]),
        )],
        usage=UsageInfo(
            prompt_tokens=best.get("usage", {}).get("prompt_tokens", 0),
            completion_tokens=best.get("usage", {}).get("completion_tokens", 0),
            total_tokens=best.get("usage", {}).get("total_tokens", 0),
        ),
        coherence=best.get("coherence", 0.0),
        confidence=best.get("confidence", 0.0),
        cache_hit=False,
        ensemble_size=best.get("ensemble_size", len(responses)),
    )


@app.get("/stats")
async def stats():
    return {
        "cache": semantic_cache.stats,
        "models": settings.free_models,
        "rate_limits": {
            "per_model": settings.max_requests_per_minute,
            "total": settings.max_requests_per_minute * len(settings.free_models),
        },
        "coherence_target": settings.coherence_target,
    }
