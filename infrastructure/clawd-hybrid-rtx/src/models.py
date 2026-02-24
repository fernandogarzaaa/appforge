"""Pydantic models for Clawd Hybrid RTX API — shared by api_server and streaming."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------- Chat Messages ----------

class ChatMessage(BaseModel):
    """A single chat message (OpenAI-compatible, extra fields ignored)."""

    class Config:
        extra = "ignore"

    role: str
    content: Optional[str] = None
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    tool_calls: Optional[list[dict[str, Any]]] = None


# ---------- Chat Completion Request ----------

class ChatCompletionRequest(BaseModel):
    """OpenAI-compatible chat completion request."""

    class Config:
        extra = "ignore"

    model: str = "clawd-hybrid-rtx"
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None
    stop: Optional[list[str] | str] = None
    n: Optional[int] = None
    stream: bool = False
    user: Optional[str] = None
    tools: Optional[list[dict[str, Any]]] = None
    tool_choice: Optional[Any] = None
    response_format: Optional[dict[str, Any]] = None
    seed: Optional[int] = None
    logprobs: Optional[bool] = None
    top_logprobs: Optional[int] = None


# ---------- Non-streaming Response ----------

class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class Choice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: Optional[str] = "stop"


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[Choice]
    usage: Usage


# ---------- Streaming Response ----------

class StreamDelta(BaseModel):
    """Delta payload inside a streaming chunk."""
    role: Optional[str] = None
    content: Optional[str] = None


class StreamChoice(BaseModel):
    """A single choice inside a streaming chunk."""
    index: int = 0
    delta: StreamDelta
    finish_reason: Optional[str] = None


class StreamChunk(BaseModel):
    """A single SSE chunk in OpenAI streaming format."""
    id: str
    object: str = "chat.completion.chunk"
    created: int
    model: str
    choices: list[StreamChoice]


# ---------- Model / Health ----------

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
