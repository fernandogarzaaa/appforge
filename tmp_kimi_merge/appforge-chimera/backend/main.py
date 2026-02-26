"""
AppForge Chimera - Backend API
==============================
FastAPI backend that connects Desktop UI to AI Engine.
"""

import os
import sys
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from contextlib import asynccontextmanager

# Add ai-engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-engine'))

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiohttp

# Import Chimera components
from src.chimera_server import ChimeraServer
from src.config import ChimeraConfig
from src.logger import get_logger, set_correlation_id

# Configure logging
logger = get_logger("AppForgeBackend")

# Global state
chimera_server: Optional[ChimeraServer] = None
active_connections: List[WebSocket] = []


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    stream: bool = False


class ChatResponse(BaseModel):
    content: str
    model: str
    tokens_used: int
    latency_ms: float
    cached: bool = False


class SystemStatus(BaseModel):
    status: str
    chimera_ready: bool
    active_sessions: int
    uptime_seconds: float


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global chimera_server
    
    # Startup
    logger.info("Starting AppForge Chimera Backend...")
    
    config = ChimeraConfig(
        ENABLE_QUANTUM_ROUTING=True,
        ENABLE_PREDICTIVE_CACHE=True,
        ENABLE_TOKEN_OPTIMIZER=True,
        ENABLE_SEMANTIC_CACHE=True,
        ROUTING_ALGORITHM="multi_armed_bandit"
    )
    
    chimera_server = ChimeraServer(config)
    await chimera_server.start()
    
    logger.info("Backend ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if chimera_server:
        await chimera_server.stop()


# Create FastAPI app
app = FastAPI(
    title="AppForge Chimera API",
    description="Backend API for AppForge Chimera Desktop",
    version="4.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "AppForge Chimera API",
        "version": "4.0.0",
        "status": "running"
    }


@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get system status."""
    return SystemStatus(
        status="healthy",
        chimera_ready=chimera_server is not None,
        active_sessions=len(active_connections),
        uptime_seconds=0  # Would track actual uptime
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """Send a chat message."""
    if not chimera_server:
        raise HTTPException(status_code=503, detail="AI Engine not ready")
    
    try:
        # Set correlation ID
        correlation_id = f"chat_{datetime.now().timestamp()}"
        set_correlation_id(correlation_id)
        
        # Build messages
        messages = [{"role": "user", "content": request.message}]
        
        # Route through Chimera
        response = await chimera_server.route_request(
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=request.stream,
            preferred_model=request.model
        )
        
        return ChatResponse(
            content=response.get("content", ""),
            model=response.get("model", "unknown"),
            tokens_used=response.get("tokens", {}).get("total", 0),
            latency_ms=response.get("latency_ms", 0),
            cached=response.get("cached", False)
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat response."""
    if not chimera_server:
        raise HTTPException(status_code=503, detail="AI Engine not ready")
    
    from fastapi.responses import StreamingResponse
    
    async def generate():
        messages = [{"role": "user", "content": request.message}]
        
        try:
            async for chunk in chimera_server.route_request_stream(
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                preferred_model=request.model
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@app.get("/models")
async def get_models():
    """Get available models."""
    if not chimera_server:
        raise HTTPException(status_code=503, detail="AI Engine not ready")
    
    return {
        "models": chimera_server.config.PREFERRED_MODELS,
        "free_models": chimera_server.config.FREE_ONLY_MODELS
    }


@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    if not chimera_server:
        raise HTTPException(status_code=503, detail="AI Engine not ready")
    
    return {
        "router": chimera_server.router.get_stats() if chimera_server.router else {},
        "semantic_cache": chimera_server.semantic_cache.get_stats() if chimera_server.semantic_cache else {},
        "model_tracker": chimera_server.model_tracker.get_summary() if chimera_server.model_tracker else {}
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "chat":
                # Process chat message
                response = await chat(
                    ChatRequest(**data.get("payload", {})),
                    BackgroundTasks()
                )
                await websocket.send_json({
                    "type": "chat_response",
                    "data": response.dict()
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)


@app.post("/feedback")
async def submit_feedback(feedback: Dict[str, Any]):
    """Submit feedback for learning."""
    # Would integrate with autonomous core
    logger.info(f"Received feedback: {feedback}")
    return {"status": "received"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "chimera_ready": chimera_server is not None,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
