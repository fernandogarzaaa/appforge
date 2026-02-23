"""
Clawd Omega Production API Server
FastAPI-based with async support, streaming, and metrics
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import time
import json
import psutil
import os

from omega_engine import get_omega_engine, InferenceConfig

app = FastAPI(
    title="Clawd Omega API",
    description="Production-grade quantum-hyper intelligent LLM",
    version="omega-2.0.0"
)

# CORS for AppForge integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class GenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = ""
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    top_k: Optional[int] = 50
    stream: Optional[bool] = False

class GenerateResponse(BaseModel):
    response: str
    generation_time_ms: float
    tokens_generated: int
    tokens_per_second: float
    model_used: str
    optimization: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False

class BatchRequest(BaseModel):
    prompts: List[str]
    context: Optional[str] = ""
    max_tokens: Optional[int] = 512

class BatchResponse(BaseModel):
    results: List[GenerateResponse]
    batch_time_ms: float

class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    gpu_utilization: Optional[float]
    requests_per_minute: float
    average_latency_ms: float
    active_models: int

# ============================================================================
# METRICS TRACKING
# ============================================================================

class MetricsCollector:
    def __init__(self):
        self.request_times: List[float] = []
        self.request_count = 0
        self.start_time = time.time()
        
    def record_request(self, latency_ms: float):
        self.request_times.append(latency_ms)
        self.request_count += 1
        # Keep only last 1000 requests
        if len(self.request_times) > 1000:
            self.request_times = self.request_times[-1000:]
    
    def get_metrics(self) -> Dict[str, Any]:
        recent_requests = [t for t in self.request_times if time.time() - self.start_time < 60]
        rpm = len(recent_requests)
        avg_latency = sum(self.request_times[-100:]) / len(self.request_times[-100:]) if self.request_times else 0
        
        return {
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'requests_per_minute': rpm,
            'average_latency_ms': avg_latency,
            'total_requests': self.request_count
        }

metrics = MetricsCollector()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize engine on startup"""
    print("🚀 Starting Clawd Omega Production Server...")
    get_omega_engine()  # Pre-load models
    print("✅ Server ready")

@app.get("/health")
async def health():
    """Health check with system metrics"""
    return {
        "status": "healthy",
        "version": "omega-2.0.0",
        "capabilities": [
            "speculative_decoding",
            "kv_cache_optimization", 
            "continuous_batching",
            "multi_model_ensemble",
            "flash_attention_2",
            "4bit_quantization"
        ],
        "metrics": metrics.get_metrics()
    }

@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Generate text with Clawd Omega"""
    try:
        start_time = time.time()
        
        config = InferenceConfig(
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k
        )
        
        engine = get_omega_engine()
        result = engine.generate(
            prompt=request.prompt,
            context=request.context,
            config=config
        )
        
        latency_ms = (time.time() - start_time) * 1000
        metrics.record_request(latency_ms)
        
        return GenerateResponse(
            response=result['response'],
            generation_time_ms=result['generation_time_ms'],
            tokens_generated=result['tokens_generated'],
            tokens_per_second=result['tokens_generated'] / (result['generation_time_ms'] / 1000),
            model_used=result['model_used'],
            optimization=result['optimization']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/stream")
async def generate_stream(request: GenerateRequest):
    """Stream tokens as they're generated"""
    try:
        engine = get_omega_engine()
        
        async def token_generator():
            for token in engine.stream_generate(request.prompt, request.context):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            token_generator(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    """OpenAI-compatible chat completions"""
    try:
        # Convert messages to prompt
        prompt_parts = []
        for msg in request.messages:
            if msg.role == "system":
                prompt_parts.append(f"System: {msg.content}")
            elif msg.role == "user":
                prompt_parts.append(f"User: {msg.content}")
            elif msg.role == "assistant":
                prompt_parts.append(f"Assistant: {msg.content}")
        
        prompt = "\n".join(prompt_parts)
        
        config = InferenceConfig(
            max_new_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        engine = get_omega_engine()
        result = engine.generate(prompt, config=config)
        
        return {
            "id": f"clawd-omega-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": "clawd-omega-ensemble",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": result['response']
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(prompt.split()),  # Approximate
                "completion_tokens": result['tokens_generated'],
                "total_tokens": len(prompt.split()) + result['tokens_generated']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch", response_model=BatchResponse)
async def batch_generate(request: BatchRequest):
    """Batch generation for multiple prompts"""
    try:
        start_time = time.time()
        
        config = InferenceConfig(max_new_tokens=request.max_tokens)
        engine = get_omega_engine()
        
        results = engine.batch_generate(request.prompts, config)
        
        batch_time_ms = (time.time() - start_time) * 1000
        
        response_results = []
        for result in results:
            response_results.append(GenerateResponse(
                response=result['response'],
                generation_time_ms=result['generation_time_ms'],
                tokens_generated=result['tokens_generated'],
                tokens_per_second=result['tokens_generated'] / (result['generation_time_ms'] / 1000),
                model_used=result['model_used'],
                optimization=result['optimization']
            ))
        
        return BatchResponse(
            results=response_results,
            batch_time_ms=batch_time_ms
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics():
    """Get detailed system metrics"""
    return metrics.get_metrics()

@app.get("/")
async def root():
    """API info"""
    return {
        "name": "Clawd Omega Production API",
        "version": "omega-2.0.0",
        "description": "Quantum-hyper intelligent LLM with superior performance",
        "endpoints": {
            "health": "/health",
            "generate": "/generate (POST)",
            "stream": "/generate/stream (POST)",
            "chat": "/v1/chat/completions (POST)",
            "batch": "/batch (POST)",
            "metrics": "/metrics"
        },
        "optimizations": [
            "Speculative decoding (2-3x speedup)",
            "Multi-model ensemble routing",
            "KV-cache optimization",
            "Flash Attention 2",
            "4-bit quantization (AWQ/GPTQ)",
            "Continuous batching"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
