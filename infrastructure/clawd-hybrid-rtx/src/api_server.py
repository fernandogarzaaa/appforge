"""FastAPI server providing OpenAI-compatible chat completions endpoint."""

import logging
import time
import uuid

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

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

cache = SemanticCache()


# ---------- Request / Response models ----------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = "clawd-hybrid-rtx"
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = None
    stream: bool = False


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


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
async def chat_completions(request: ChatCompletionRequest):
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


# ---------- Main entry point ----------

def main():
    import uvicorn
    from .config import CLAWD_PORT

    logger.info(f"Starting Clawd Hybrid RTX on port {CLAWD_PORT}")
    logger.info(f"Models: {MODELS}")
    uvicorn.run(app, host="0.0.0.0", port=CLAWD_PORT)
