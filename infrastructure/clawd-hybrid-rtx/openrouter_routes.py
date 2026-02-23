"""
OpenRouter Ensemble API Routes for Clawd Hybrid RTX
FastAPI routes for multi-model consensus with quantum coherence.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import json
import logging
from datetime import datetime

from openrouter_client import OpenRouterClient, create_openrouter_client
from quantum_consensus import QuantumConsensusEngine, create_consensus_engine

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ensemble", tags=["Ensemble"])

# Global state
_consensus_engine: Optional[QuantumConsensusEngine] = None
_openrouter_client: Optional[OpenRouterClient] = None


# ============================================================================
# Pydantic Models
# ============================================================================

class ConsensusRequest(BaseModel):
    """Request for ensemble consensus generation."""
    prompt: str = Field(..., min_length=1, max_length=8000, description="Input prompt")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(default=1024, ge=1, le=4096, description="Maximum tokens to generate")
    system_prompt: Optional[str] = Field(default=None, description="Optional system prompt")
    stream: bool = Field(default=False, description="Stream the response")
    allow_requery: bool = Field(default=True, description="Auto-requery on low coherence")


class ConsensusResponse(BaseModel):
    """Response from ensemble consensus."""
    consensus_response: str = Field(..., description="The consensus response")
    coherence_score: float = Field(..., description="Coherence score 0-1")
    coherence_percent: float = Field(..., description="Coherence as percentage")
    models_queried: int = Field(..., description="Number of models queried")
    successful_responses: int = Field(..., description="Number of successful responses")
    divergence_detected: bool = Field(..., description="Whether divergence was detected")
    requery_triggered: bool = Field(..., description="Whether auto-requery was triggered")
    processing_time_ms: float = Field(..., description="Total processing time")
    model_weights: Dict[str, float] = Field(..., description="Per-model weights")
    timestamp: str = Field(..., description="Response timestamp")


class StreamingConsensusResponse(BaseModel):
    """Chunk of streaming consensus response."""
    chunk: str = Field(..., description="Response chunk")
    coherence_score: Optional[float] = Field(default=None, description="Final coherence when done")
    done: bool = Field(default=False, description="Whether streaming is complete")


class ModelInfo(BaseModel):
    """Information about an available model."""
    id: str = Field(..., description="Model ID")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Model description")
    context_length: int = Field(..., description="Maximum context length")
    strengths: List[str] = Field(default_factory=list, description="Model strengths")
    is_free: bool = Field(default=True, description="Whether model is free tier")


class ModelsResponse(BaseModel):
    """Response listing available models."""
    models: List[ModelInfo] = Field(..., description="Available models")
    count: int = Field(..., description="Total model count")


class CoherenceMetricsResponse(BaseModel):
    """Real-time coherence metrics."""
    query_count: int = Field(..., description="Total queries processed")
    average_coherence: float = Field(..., description="Average coherence score")
    average_coherence_percent: float = Field(..., description="Average coherence as percentage")
    recent_average: float = Field(..., description="Recent average coherence")
    min_coherence: float = Field(..., description="Minimum coherence observed")
    max_coherence: float = Field(..., description="Maximum coherence observed")
    std_deviation: float = Field(..., description="Standard deviation of coherence")
    divergence_count: int = Field(..., description="Number of divergence events")
    divergence_rate: float = Field(..., description="Rate of divergence")
    requery_count: int = Field(..., description="Number of requeries")
    requery_rate: float = Field(..., description="Rate of requery")


class HealthStatus(BaseModel):
    """Health status of the ensemble system."""
    status: str = Field(..., description="Overall health status")
    consensus_engine_ready: bool = Field(..., description="Whether consensus engine is ready")
    openrouter_connected: bool = Field(..., description="Whether OpenRouter is accessible")
    model_health: Dict[str, Dict[str, Any]] = Field(..., description="Per-model health")


# ============================================================================
# Helper Functions
# ============================================================================

async def get_consensus_engine() -> QuantumConsensusEngine:
    """Get or initialize the consensus engine."""
    global _consensus_engine
    
    if _consensus_engine is None:
        _consensus_engine = await create_consensus_engine()
    
    return _consensus_engine


async def get_openrouter_client() -> OpenRouterClient:
    """Get or initialize the OpenRouter client."""
    global _openrouter_client
    
    if _openrouter_client is None:
        _openrouter_client = await create_openrouter_client()
    
    return _openrouter_client


# ============================================================================
# API Routes
# ============================================================================

@router.post(
    "/consensus",
    response_model=ConsensusResponse,
    summary="Generate multi-model consensus",
    description="""
    Queries 5 free LLM models in parallel and computes a quantum consensus response.
    
    Uses RTX 2060 to embed responses and calculate semantic similarity matrix.
    Models are weighted by their coherence with other models.
    
    Target: 95%+ coherence, < 5s latency
    """
)
async def post_consensus(request: ConsensusRequest):
    """
    Generate consensus response from multi-model ensemble.
    
    - Queries 5 free models from OpenRouter in parallel
    - Embeds responses using local RTX 2060
    - Calculates semantic similarity matrix
    - Weights models by coherence
    - Collapses to optimal consensus
    - Auto-requeries if coherence < 80%
    """
    try:
        engine = await get_consensus_engine()
        
        result = await engine.generate_consensus(
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt,
            allow_requery=request.allow_requery
        )
        
        # Count successful responses
        successful = sum(1 for r in result.individual_responses if not r.is_error)
        
        return ConsensusResponse(
            consensus_response=result.consensus_response,
            coherence_score=round(result.coherence_score, 4),
            coherence_percent=round(result.coherence_score * 100, 2),
            models_queried=len(result.individual_responses),
            successful_responses=successful,
            divergence_detected=result.divergence_detected,
            requery_triggered=result.requery_triggered,
            processing_time_ms=round(result.processing_time_ms, 2),
            model_weights=result.model_weights,
            timestamp=result.timestamp.isoformat()
        )
    
    except Exception as e:
        logger.error(f"Consensus generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Consensus generation failed: {str(e)}")


@router.post(
    "/stream",
    response_class=StreamingResponse,
    summary="Stream consensus response",
    description="""
    Stream a consensus response. First determines the best model via consensus,
    then streams from that model for optimal user experience.
    """
)
async def post_stream_consensus(request: ConsensusRequest):
    """
    Stream consensus response.
    
    For streaming, we first calculate consensus to find the best model,
    then stream from that model. This provides the benefits of model
    selection while maintaining streaming UX.
    """
    try:
        engine = await get_consensus_engine()
        
        async def event_generator():
            # First, get consensus to determine best model
            result = await engine.generate_consensus(
                prompt=request.prompt,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_prompt=request.system_prompt,
                allow_requery=False  # No requery for streaming
            )
            
            # Find best model
            if result.model_weights:
                best_model = max(result.model_weights.items(), key=lambda x: x[1])[0]
            else:
                best_model = "mistralai/mistral-7b-instruct:free"
            
            # Send coherence info as first chunk
            metadata = {
                "type": "metadata",
                "coherence_score": result.coherence_score,
                "best_model": best_model,
                "models_queried": len(result.individual_responses)
            }
            yield f"data: {json.dumps(metadata)}\n\n"
            
            # Stream from best model
            client = await get_openrouter_client()
            async for chunk in client.query_streaming(
                prompt=request.prompt,
                model=best_model,
                temperature=request.temperature,
                max_tokens=request.max_tokens
            ):
                data = {"type": "chunk", "content": chunk}
                yield f"data: {json.dumps(data)}\n\n"
            
            # Send completion
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
    except Exception as e:
        logger.error(f"Streaming consensus failed: {e}")
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")


@router.get(
    "/models",
    response_model=ModelsResponse,
    summary="List available free models",
    description="Returns all available free models from OpenRouter for ensemble queries."
)
async def get_models():
    """Get list of available free models for ensemble."""
    try:
        client = await get_openrouter_client()
        models = client.get_available_models()
        
        return ModelsResponse(
            models=[
                ModelInfo(
                    id=m.id,
                    name=m.name,
                    description=m.description,
                    context_length=m.context_length,
                    strengths=client.FREE_MODELS.get(m.id, {}).get("strengths", []),
                    is_free=m.is_free
                )
                for m in models
            ],
            count=len(models)
        )
    
    except Exception as e:
        logger.error(f"Failed to get models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get models: {str(e)}")


@router.get(
    "/coherence",
    response_model=CoherenceMetricsResponse,
    summary="Get coherence metrics",
    description="Returns real-time coherence statistics and model performance metrics."
)
async def get_coherence_metrics():
    """Get real-time coherence metrics."""
    try:
        engine = await get_consensus_engine()
        metrics = engine.get_metrics()
        coherence = metrics.get("coherence", {})
        
        return CoherenceMetricsResponse(
            query_count=coherence.get("query_count", 0),
            average_coherence=coherence.get("average_coherence", 0.0),
            average_coherence_percent=coherence.get("average_coherence_percent", 0.0),
            recent_average=coherence.get("recent_average", 0.0),
            min_coherence=coherence.get("min_coherence", 0.0),
            max_coherence=coherence.get("max_coherence", 0.0),
            std_deviation=coherence.get("std_deviation", 0.0),
            divergence_count=coherence.get("divergence_count", 0),
            divergence_rate=coherence.get("divergence_rate", 0.0),
            requery_count=coherence.get("requery_count", 0),
            requery_rate=coherence.get("requery_rate", 0.0)
        )
    
    except Exception as e:
        logger.error(f"Failed to get coherence metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="Get ensemble health status",
    description="Returns health status of all models and the consensus engine."
)
async def get_health():
    """Get health status of the ensemble system."""
    try:
        client = await get_openrouter_client()
        model_health = client.get_health_status()
        
        all_healthy = all(m["healthy"] for m in model_health.values())
        
        return HealthStatus(
            status="healthy" if all_healthy else "degraded",
            consensus_engine_ready=_consensus_engine is not None,
            openrouter_connected=True,  # If we got here, it's working
            model_health=model_health
        )
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthStatus(
            status="unhealthy",
            consensus_engine_ready=False,
            openrouter_connected=False,
            model_health={},
            error=str(e)
        )


@router.get(
    "/similarity-demo",
    summary="Demo similarity calculation",
    description="Calculate similarity between two texts using local embeddings."
)
async def get_similarity_demo(
    text1: str = Query(..., description="First text"),
    text2: str = Query(..., description="Second text")
):
    """Demo endpoint to calculate similarity between two texts."""
    try:
        engine = await get_consensus_engine()
        
        # Embed both texts
        embeddings = engine._embed_responses([text1, text2])
        
        # Calculate similarity
        similarity_matrix = engine._calculate_similarity_matrix(embeddings)
        similarity = float(similarity_matrix[0, 1])
        
        return {
            "text1": text1[:100],
            "text2": text2[:100],
            "similarity": round(similarity, 4),
            "similarity_percent": round(similarity * 100, 2),
            "interpretation": "Very similar" if similarity > 0.9 else (
                "Similar" if similarity > 0.7 else (
                    "Somewhat similar" if similarity > 0.5 else "Different"
                )
            )
        }
    
    except Exception as e:
        logger.error(f"Similarity demo failed: {e}")
        raise HTTPException(status_code=500, detail=f"Similarity calculation failed: {str(e)}")


# ============================================================================
# Integration with main FastAPI app
# ============================================================================

def register_openrouter_routes(app):
    """Register OpenRouter ensemble routes with FastAPI app."""
    app.include_router(router)
    logger.info("OpenRouter ensemble routes registered")


# ============================================================================
# Cleanup
# ============================================================================

async def shutdown_ensemble():
    """Clean up ensemble resources."""
    global _consensus_engine, _openrouter_client
    
    if _consensus_engine:
        await _consensus_engine.close()
        _consensus_engine = None
        logger.info("Consensus engine shut down")
    
    if _openrouter_client:
        await _openrouter_client.close()
        _openrouter_client = None
        logger.info("OpenRouter client shut down")
