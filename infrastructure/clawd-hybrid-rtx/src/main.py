"""
Clawd Hybrid RTX - Main Application Entry Point
FastAPI application with GPU-accelerated inference and cloud fallback
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "0.0.0.0")

# OpenRouter Ensemble Integration
ENSEMBLE_ENABLED = os.getenv("ENSEMBLE_ENABLED", "true").lower() == "true"


# =============================================================================
# Pydantic Models
# =============================================================================

class HealthResponse(BaseModel):
    status: str
    gpu_available: bool
    version: str = "1.0.0"

class CompletionRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    max_tokens: int = Field(default=512, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)
    use_local: Optional[bool] = None  # None = use hybrid strategy

class CompletionResponse(BaseModel):
    text: str
    model_used: str
    tokens_generated: int
    generation_time_ms: float
    from_cache: bool = False

class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)

class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimensions: int
    model_used: str

class GPUStatusResponse(BaseModel):
    available: bool
    name: Optional[str] = None
    memory_used_mb: Optional[int] = None
    memory_total_mb: Optional[int] = None
    utilization_percent: Optional[float] = None
    temperature_c: Optional[int] = None


# =============================================================================
# Application State
# =============================================================================

class AppState:
    def __init__(self):
        self.gpu_available = False
        self.local_model = None
        self.embedder = None
        self.cache = None
        self.monitor = None

app_state = AppState()


# =============================================================================
# Lifespan Management
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown"""
    # Startup
    print("🚀 Starting Clawd Hybrid RTX...")
    
    # Try to initialize GPU
    try:
        import torch
        if torch.cuda.is_available():
            app_state.gpu_available = True
            device_name = torch.cuda.get_device_name(0)
            vram_mb = torch.cuda.get_device_properties(0).total_memory // (1024 * 1024)
            print(f"✅ GPU detected: {device_name} ({vram_mb} MB VRAM)")
        else:
            print("⚠️  No GPU available - will use CPU fallback")
    except Exception as e:
        print(f"⚠️  GPU initialization error: {e}")
    
    # Initialize cache
    try:
        import redis
        redis_client = redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            socket_connect_timeout=5
        )
        redis_client.ping()
        app_state.cache = redis_client
        print("✅ Redis cache connected")
    except Exception as e:
        print(f"⚠️  Redis not available: {e}")
        app_state.cache = None
    
    # Initialize monitor
    try:
        from monitor import PerformanceDashboard, MonitorConfig
        config = MonitorConfig()
        app_state.monitor = PerformanceDashboard(config)
        app_state.monitor.start()
        print("✅ Performance monitor started")
    except Exception as e:
        print(f"⚠️  Monitor not available: {e}")
    
    # Initialize OpenRouter Ensemble
    if ENSEMBLE_ENABLED:
        try:
            import sys
            sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            from ensemble_integration import setup_ensemble_routes
            setup_ensemble_routes(app)
            print("✅ OpenRouter Ensemble routes registered")
        except Exception as e:
            print(f"⚠️  Ensemble initialization error: {e}")
    else:
        print("ℹ️  OpenRouter Ensemble disabled")
    
    print(f"🎯 Clawd Hybrid RTX ready on http://{API_HOST}:{API_PORT}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Clawd Hybrid RTX...")
    if app_state.monitor:
        app_state.monitor.stop()
    print("👋 Goodbye!")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="Clawd Hybrid RTX",
    description="GPU-accelerated AI inference with cloud fallback for RTX 2060",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/", tags=["General"])
async def root():
    """Root endpoint with basic info"""
    return {
        "name": "Clawd Hybrid RTX",
        "version": "1.0.0",
        "gpu_available": app_state.gpu_available,
        "ensemble_enabled": ENSEMBLE_ENABLED,
        "docs_url": "/docs",
        "endpoints": {
            "completions": "/v1/completions",
            "embeddings": "/v1/embeddings",
            "ensemble": "/ensemble" if ENSEMBLE_ENABLED else None,
            "coherence": "/coherence-monitor" if ENSEMBLE_ENABLED else None,
            "metrics": "/metrics/full"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        gpu_available=app_state.gpu_available,
    )


@app.get("/gpu/status", response_model=GPUStatusResponse, tags=["GPU"])
async def gpu_status():
    """Get current GPU status"""
    if not app_state.gpu_available:
        return GPUStatusResponse(available=False)
    
    try:
        import torch
        if app_state.monitor and app_state.monitor.gpu_monitor:
            metrics = app_state.monitor.gpu_monitor.get_metrics()
            return GPUStatusResponse(
                available=True,
                name=metrics.get("name"),
                memory_used_mb=metrics["memory"]["used_mb"],
                memory_total_mb=metrics["memory"]["total_mb"],
                utilization_percent=metrics["utilization"]["gpu_percent"],
                temperature_c=metrics.get("temperature_c"),
            )
        else:
            # Basic GPU info without monitor
            return GPUStatusResponse(
                available=True,
                name=torch.cuda.get_device_name(0),
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GPU status error: {str(e)}")


@app.post("/v1/completions", response_model=CompletionResponse, tags=["Completions"])
async def create_completion(request: CompletionRequest):
    """Generate text completion using local model or cloud API"""
    
    # TODO: Implement actual completion logic
    # This is a placeholder that returns mock data
    
    import time
    start_time = time.time()
    
    # Simulate processing
    await asyncio.sleep(0.1)
    
    generation_time = (time.time() - start_time) * 1000
    
    # Track in monitor if available
    if app_state.monitor:
        app_state.monitor.cache_monitor.record_request(
            cache_key=f"comp:{hash(request.prompt)}",
            hit=False,
            response_time_ms=generation_time
        )
    
    return CompletionResponse(
        text=f"This is a placeholder response for: {request.prompt[:50]}...",
        model_used="placeholder-model",
        tokens_generated=request.max_tokens // 2,
        generation_time_ms=generation_time,
        from_cache=False,
    )


@app.post("/v1/embeddings", response_model=EmbeddingResponse, tags=["Embeddings"])
async def create_embedding(request: EmbeddingRequest):
    """Generate embeddings for text"""
    
    # TODO: Implement actual embedding logic
    # Placeholder returning mock embedding
    
    return EmbeddingResponse(
        embedding=[0.0] * 384,  # 384-dim embedding
        dimensions=384,
        model_used="placeholder-embedder",
    )


@app.get("/metrics/full", tags=["Monitoring"])
async def get_full_metrics():
    """Get comprehensive performance metrics"""
    if app_state.monitor:
        return app_state.monitor.get_full_report()
    else:
        return {"error": "Monitor not initialized"}


@app.get("/metrics/cache", tags=["Monitoring"])
async def get_cache_metrics():
    """Get cache statistics"""
    if app_state.monitor:
        return app_state.monitor.cache_monitor.get_stats()
    else:
        return {"error": "Monitor not initialized"}


@app.get("/metrics/costs", tags=["Monitoring"])
async def get_cost_metrics():
    """Get API cost statistics"""
    if app_state.monitor:
        return app_state.monitor.cost_tracker.get_usage_stats()
    else:
        return {"error": "Monitor not initialized"}


# =============================================================================
# OpenRouter Ensemble Endpoints
# =============================================================================

@app.get("/ensemble/status", tags=["Ensemble"])
async def get_ensemble_status():
    """Get OpenRouter Ensemble status and statistics"""
    if not ENSEMBLE_ENABLED:
        return {
            "enabled": False,
            "message": "Ensemble is disabled. Set ENSEMBLE_ENABLED=true to enable."
        }
    
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from ensemble_integration import get_ensemble_status
        return await get_ensemble_status()
    except Exception as e:
        return {
            "enabled": True,
            "error": str(e),
            "message": "Ensemble routes may not be fully initialized"
        }


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        workers=1,  # RTX 2060: Single worker to manage VRAM
        reload=ENVIRONMENT == "development",
    )
