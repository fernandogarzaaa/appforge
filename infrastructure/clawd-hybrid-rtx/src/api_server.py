"""FastAPI server providing OpenAI-compatible chat completions endpoint."""

import logging
import time
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict

from .config import MODELS, OPENROUTER_API_KEY
from .openrouter_client import query_all_models
from .quantum_consensus import select_best_response
from .semantic_cache import SemanticCache

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clawd Hybrid RTX",
    description="Multi-model consensus LLM server using free OpenRouter models",
    version="1.0.0",
)

# CORS middleware so dashboards / browsers can reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = SemanticCache()


# ---------- Validation error handler ----------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
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


# ---------- Request / Response models ----------

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: str
    content: str | list | None = None
    name: str | None = None
    tool_call_id: str | None = None
    tool_calls: list | None = None


class ChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model: str = "clawd-hybrid-rtx"
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = None
    stream: bool = False
    # Common OpenAI-compatible fields
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
    owned_by: str = "clawd-hybrid-rtx"


class ModelList(BaseModel):
    object: str = "list"
    data: list[ModelInfo]


class HealthResponse(BaseModel):
    status: str
    cache_size: int
    models_configured: int


# ---------- Endpoints ----------

@app.get("/")
async def root():
    return {
        "name": "Clawd Hybrid RTX",
        "version": "1.0.0",
        "description": "Multi-model consensus LLM server using free OpenRouter models",
        "endpoints": {
            "chat": "/v1/chat/completions",
            "models": "/v1/models",
            "health": "/health",
        },
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        cache_size=cache.size,
        models_configured=len(MODELS),
    )


@app.get("/models", response_model=ModelList)
@app.get("/v1/models", response_model=ModelList)
async def list_models():
    models = [ModelInfo(id="clawd-hybrid-rtx")]
    for m in MODELS:
        models.append(ModelInfo(id=m, owned_by="openrouter"))
    return ModelList(data=models)


async def _handle_chat_completions(request: ChatCompletionRequest) -> ChatCompletionResponse:
    """Shared handler for chat completions (both /v1/ and non-prefixed paths)."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

    if request.stream:
        raise HTTPException(status_code=400, detail="Streaming not supported yet")

    messages_raw = [{"role": m.role, "content": m.content} for m in request.messages]

    # Check semantic cache
    cached = cache.get(messages_raw)
    if cached is not None:
        logger.info("Serving from semantic cache")
        return ChatCompletionResponse(**cached)

    # Query all models in parallel
    logger.info(f"Querying {len(MODELS)} models in parallel...")
    responses = await query_all_models(
        messages=messages_raw,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
    )

    # Log results summary
    successful = [r for r in responses if r.content and not r.error]
    failed = [r for r in responses if r.error]
    logger.info(f"Received {len(successful)} successful, {len(failed)} failed responses")
    for f in failed:
        logger.warning(f"  Failed: {f.model} - {f.error}")

    # Run quantum consensus
    best = select_best_response(responses)

    if best is None:
        errors = "; ".join(f"{r.model}: {r.error}" for r in failed)
        raise HTTPException(status_code=502, detail=f"All models failed: {errors}")

    # Build response
    completion_id = f"chatcmpl-clawd-{uuid.uuid4().hex[:12]}"
    result = ChatCompletionResponse(
        id=completion_id,
        created=int(time.time()),
        model=best.model,
        choices=[
            Choice(
                message=ChatMessage(role="assistant", content=best.content),
                finish_reason=best.finish_reason or "stop",
            )
        ],
        usage=Usage(**(best.usage or {})),
    )

    # Cache the result
    cache.put(messages_raw, result.model_dump())

    return result


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions_v1(request: ChatCompletionRequest):
    return await _handle_chat_completions(request)


@app.post("/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(request: ChatCompletionRequest):
    return await _handle_chat_completions(request)


# ---------- Main entry point ----------

def main():
    import uvicorn
    from .config import CLAWD_PORT

    logger.info(f"Starting Clawd Hybrid RTX on port {CLAWD_PORT}")
    logger.info(f"Models: {MODELS}")
    uvicorn.run(app, host="0.0.0.0", port=CLAWD_PORT)
