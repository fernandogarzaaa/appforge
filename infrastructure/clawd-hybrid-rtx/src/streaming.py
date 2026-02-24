"""SSE streaming support for Clawd Hybrid RTX.

Provides OpenAI-compatible Server-Sent Events streaming by splitting a
completed response into word-by-word chunks with small delays.
"""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import AsyncGenerator

from fastapi.responses import StreamingResponse

from .models import StreamChunk, StreamChoice, StreamDelta


async def stream_completion_response(
    best_response,
    model_name: str,
    completion_id: str,
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted chunks that simulate token-by-token streaming.

    Parameters
    ----------
    best_response:
        A ModelResponse (from quantum_consensus) with at least ``.content``.
    model_name:
        The model identifier to include in each chunk.
    completion_id:
        A unique ``chatcmpl-*`` identifier for the completion.
    """
    created = int(time.time())
    content: str = best_response.content or ""

    # --- First chunk: send the role ---
    role_chunk = StreamChunk(
        id=completion_id,
        created=created,
        model=model_name,
        choices=[
            StreamChoice(
                delta=StreamDelta(role="assistant", content=""),
                finish_reason=None,
            )
        ],
    )
    yield f"data: {role_chunk.model_dump_json()}\n\n"

    # --- Content chunks: word-by-word ---
    words = content.split(" ")
    for i, word in enumerate(words):
        # Re-insert space before every word except the first
        token = word if i == 0 else f" {word}"

        chunk = StreamChunk(
            id=completion_id,
            created=created,
            model=model_name,
            choices=[
                StreamChoice(
                    delta=StreamDelta(content=token),
                    finish_reason=None,
                )
            ],
        )
        yield f"data: {chunk.model_dump_json()}\n\n"

        # Small delay to feel natural (10-30 ms per word)
        await asyncio.sleep(0.015)

    # --- Final chunk: finish_reason = stop ---
    stop_chunk = StreamChunk(
        id=completion_id,
        created=created,
        model=model_name,
        choices=[
            StreamChoice(
                delta=StreamDelta(),
                finish_reason="stop",
            )
        ],
    )
    yield f"data: {stop_chunk.model_dump_json()}\n\n"

    # --- Done sentinel ---
    yield "data: [DONE]\n\n"


def create_streaming_response(best_response, completion_id: str | None = None) -> StreamingResponse:
    """Return a ready-to-use ``StreamingResponse`` for a completed model response.

    Parameters
    ----------
    best_response:
        A ModelResponse (must have ``.content`` and ``.model``).
    completion_id:
        Optional completion id; auto-generated if not supplied.
    """
    if completion_id is None:
        completion_id = f"chatcmpl-clawd-{uuid.uuid4().hex[:12]}"

    model_name = getattr(best_response, "model", "clawd-hybrid-rtx") or "clawd-hybrid-rtx"

    return StreamingResponse(
        content=stream_completion_response(best_response, model_name, completion_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering if present
        },
    )
