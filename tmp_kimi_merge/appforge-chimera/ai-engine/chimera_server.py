"""
Quantum Chimera LLM v4.0 - Main Server
=======================================
Revolutionary LLM gateway with AI-powered optimization.
100x more powerful than v3.0
"""

import json
import time
import uuid
import asyncio
from typing import Dict, List, Optional, Any, Generator
from dataclasses import dataclass
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from config import get_config
from src.logger import get_logger

# Import all revolutionary components
from src.model_discovery import get_model_discovery
from src.adaptive_router import get_adaptive_router
from src.token_optimizer import get_token_optimizer
from src.rate_limit_optimizer import get_rate_limit_optimizer
from src.predictive_cache import get_predictive_cache
from src.semantic_cache import get_semantic_cache
from src.model_tracker import get_model_tracker
from src.conversation_memory import get_conversation_memory
from src.kimi_client import get_kimi_client
from src.openrouter_client import get_openrouter_client
from src.response_scorer import get_response_scorer
from src.prompt_manager import get_prompt_manager
from src.chimera_memory import get_chimera_memory

logger = get_logger()

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="Quantum Chimera LLM v4.0",
    description="Revolutionary LLM gateway with AI-powered optimization",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get config
config = get_config()

# Initialize all revolutionary components
model_discovery = get_model_discovery()
adaptive_router = get_adaptive_router()
token_optimizer = get_token_optimizer()
rate_limit_optimizer = get_rate_limit_optimizer()
predictive_cache = get_predictive_cache()
semantic_cache = get_semantic_cache()
model_tracker = get_model_tracker()
conversation_memory = get_conversation_memory()
kimi_client = get_kimi_client()
openrouter_client = get_openrouter_client()
response_scorer = get_response_scorer()
prompt_manager = get_prompt_manager()
chimera_memory = get_chimera_memory()


# ============================================================================
# Helper Functions
# ============================================================================

def create_error_response(error_message: str) -> Dict[str, Any]:
    """Create a consistent error response with NON-EMPTY content."""
    return {
        "id": f"chimera-error-{uuid.uuid4().hex[:8]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "chimera-fallback",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": f"I apologize, but I encountered an error: {error_message}. Please try again or rephrase your request.",
                },
                "finish_reason": "error",
            }
        ],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }


def extract_query(messages: List[Dict[str, str]]) -> str:
    """Extract the query text from messages."""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return msg.get("content", "")
    return ""


def calculate_reward(response: Dict, latency_ms: float, quality_score: float) -> float:
    """Calculate reward for adaptive routing."""
    # Success = 1.0, Failure = 0.0
    success = 1.0 if "error" not in response else 0.0
    
    # Normalize latency (lower is better, max 10s)
    latency_reward = max(0, 1 - latency_ms / 10000)
    
    # Quality score (0-1)
    
    # Combined reward
    return 0.5 * success + 0.3 * latency_reward + 0.2 * quality_score


async def route_request_revolutionary(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    stream: bool,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Revolutionary routing with AI-powered optimization.
    """
    query = extract_query(messages)
    start_time = time.time()
    
    # ========================================================================
    # STEP 1: Token Optimization (Compress Prompt)
    # ========================================================================
    if config.ENABLE_TOKEN_OPTIMIZER:
        messages, _, strategy = token_optimizer.optimize_request(
            messages, [], {}, 0
        )
        logger.debug(f"Token optimization: {strategy}")
    
    # ========================================================================
    # STEP 2: Predictive Cache Check
    # ========================================================================
    if config.PREDICTIVE_CACHE_ENABLED:
        query_embedding = chimera_memory.get_embedding(query)
        cached_response, confidence = predictive_cache.get(query, query_embedding)
        
        if cached_response:
            logger.info(f"Predictive cache hit!", confidence=round(confidence, 2))
            return {
                "id": f"chimera-predictive-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "chimera-predictive",
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": cached_response},
                        "finish_reason": "stop",
                    }
                ],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "cached": True,
                "predictive": True,
                "confidence": confidence,
            }
    
    # ========================================================================
    # STEP 3: Semantic Cache Check
    # ========================================================================
    if config.ENABLE_CACHE:
        query_embedding = chimera_memory.get_embedding(query)
        cached_response, similarity = semantic_cache.get(query, query_embedding)
        
        if cached_response:
            logger.info(f"Semantic cache hit!", similarity=round(similarity, 4))
            return {
                "id": f"chimera-cache-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "chimera-cache",
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": cached_response},
                        "finish_reason": "stop",
                    }
                ],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "cached": True,
                "similarity": similarity,
            }
    
    # ========================================================================
    # STEP 4: Auto-Discover Free Models
    # ========================================================================
    if config.ENABLE_AUTO_MODEL_DISCOVERY:
        free_models = model_discovery.get_free_models()
        available_models = [m.id for m in free_models if m.is_available]
    else:
        available_models = config.PRIMARY_MODELS + config.FALLBACK_MODELS
    
    # ========================================================================
    # STEP 5: Rate Limit Filtering
    # ========================================================================
    available_models = rate_limit_optimizer.get_available_models(available_models)
    
    if not available_models:
        logger.warning("All models rate limited, waiting...")
        # Wait a bit and try again
        await asyncio.sleep(1)
        available_models = rate_limit_optimizer.get_available_models(
            config.PRIMARY_MODELS + config.FALLBACK_MODELS
        )
    
    # ========================================================================
    # STEP 6: Adaptive Model Selection
    # ========================================================================
    if config.ENABLE_ADAPTIVE_ROUTING:
        selected_model = adaptive_router.select_model(available_models, {"query": query})
    else:
        selected_model = available_models[0] if available_models else ""
    
    logger.info(f"Selected model: {selected_model}",
               algorithm=config.ROUTING_ALGORITHM,
               available_count=len(available_models))
    
    # ========================================================================
    # STEP 7: Make Request with Fallback Cascade
    # ========================================================================
    last_error = None
    models_tried = []
    
    for model in [selected_model] + [m for m in available_models if m != selected_model]:
        if model in models_tried:
            continue
        models_tried.append(model)
        
        # Check rate limit
        if not rate_limit_optimizer.before_request(model):
            logger.debug(f"Rate limited: {model}")
            continue
        
        try:
            req_start = time.time()
            
            response = openrouter_client.chat_completion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            latency_ms = (time.time() - req_start) * 1000
            
            # Check for error
            if "error" in response:
                rate_limit_optimizer.after_request(model, False, True)
                last_error = response["error"].get("message", "Unknown error")
                continue
            
            # Extract content
            content = ""
            if response.get("choices"):
                content = response["choices"][0].get("message", {}).get("content", "")
            
            if not content or not content.strip():
                rate_limit_optimizer.after_request(model, False, False)
                model_tracker.record_empty(model)
                last_error = "Empty response"
                continue
            
            # ========================================================================
            # STEP 8: Quality Scoring
            # ========================================================================
            quality_score = response_scorer.score(query, content)
            
            if quality_score < config.MIN_QUALITY_SCORE:
                logger.warning(f"Quality too low: {quality_score}", model=model)
                rate_limit_optimizer.after_request(model, False, False)
                model_tracker.record_failure(model)
                last_error = f"Quality {quality_score} below threshold"
                continue
            
            # ========================================================================
            # STEP 9: Update All Trackers
            # ========================================================================
            rate_limit_optimizer.after_request(model, True, False)
            model_tracker.record_success(model, len(content), quality_score)
            model_discovery.update_model_stats(model, True, latency_ms)
            
            # Update adaptive router
            reward = calculate_reward(response, latency_ms, quality_score)
            adaptive_router.update(model, True, reward, latency_ms)
            
            # ========================================================================
            # STEP 10: Cache Response
            # ========================================================================
            if config.PREDICTIVE_CACHE_ENABLED:
                predictive_cache.set(query, content, query_embedding)
            
            if config.ENABLE_CACHE:
                semantic_cache.set(query, content, query_embedding)
            
            logger.info(f"Success!", model=model, latency_ms=round(latency_ms, 2))
            return response
        
        except Exception as e:
            logger.error(f"Exception with {model}: {e}", exc_info=True)
            rate_limit_optimizer.after_request(model, False, False)
            model_tracker.record_failure(model)
            last_error = str(e)
            continue
    
    # ========================================================================
    # STEP 11: Kimi Fallback (Last Resort)
    # ========================================================================
    logger.warning("⚠️ All OpenRouter models failed — falling back to Kimi K2.5")
    
    if kimi_client.is_available():
        try:
            response = kimi_client.chat_completion(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            if "error" not in response:
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                if content and content.strip():
                    # Cache
                    if config.PREDICTIVE_CACHE_ENABLED:
                        predictive_cache.set(query, content, query_embedding)
                    if config.ENABLE_CACHE:
                        semantic_cache.set(query, content, query_embedding)
                    
                    logger.info("Kimi fallback successful")
                    return response
        except Exception as e:
            logger.error(f"Kimi failed: {e}")
            last_error = f"Kimi: {str(e)}"
    
    # All failed
    return create_error_response(f"All models failed. {last_error}")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "4.0.0",
        "features": {
            "auto_discovery": config.ENABLE_AUTO_MODEL_DISCOVERY,
            "adaptive_routing": config.ENABLE_ADAPTIVE_ROUTING,
            "predictive_cache": config.PREDICTIVE_CACHE_ENABLED,
            "token_optimizer": config.ENABLE_TOKEN_OPTIMIZER,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/v1/models")
async def list_models():
    """List available models with discovery."""
    if config.ENABLE_AUTO_MODEL_DISCOVERY:
        models = model_discovery.get_free_models()
        return {
            "object": "list",
            "data": [
                {
                    "id": m.id,
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": m.provider,
                    "chimera": {
                        "is_free": m.is_free,
                        "success_rate": round(m.success_rate, 3),
                        "avg_latency_ms": round(m.avg_latency_ms, 2),
                        "is_available": m.is_available,
                    }
                }
                for m in models
            ]
        }
    else:
        # Return static list
        return {
            "object": "list",
            "data": [
                {"id": m, "object": "model", "created": int(time.time()), "owned_by": "openrouter"}
                for m in config.PRIMARY_MODELS + config.FALLBACK_MODELS
            ]
        }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Main chat completions endpoint with revolutionary optimization."""
    try:
        body = await request.json()
        
        messages = body.get("messages", [])
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 4096)
        stream = body.get("stream", False)
        session_id = request.headers.get("X-Session-ID")
        
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # Detect intent and inject system prompt
        query = extract_query(messages)
        intent = prompt_manager.detect_intent(query)
        messages = prompt_manager.inject_system_prompt(messages, intent)
        
        # Add conversation context
        if config.ENABLE_CONVERSATION_MEMORY:
            session_id = conversation_memory.get_or_create_session(messages, session_id)
            context = conversation_memory.get_context(session_id)
            if context:
                has_system = messages and messages[0].get("role") == "system"
                if has_system:
                    messages = [messages[0]] + context + messages[1:]
                else:
                    messages = context + messages
        
        # Route request
        response = await route_request_revolutionary(
            messages, temperature, max_tokens, stream, session_id
        )
        
        # Store conversation turn
        if config.ENABLE_CONVERSATION_MEMORY and session_id:
            conversation_memory.add_message(session_id, "user", query)
            content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            conversation_memory.add_message(session_id, "assistant", content)
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat_completions: {e}", exc_info=True)
        return create_error_response(str(e))


@app.get("/dashboard/stats")
async def dashboard_stats():
    """Get comprehensive stats for dashboard."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "models": model_tracker.get_stats_summary(),
        "discovered": {
            "total": len(model_discovery.get_all_models()),
            "free": len(model_discovery.get_free_models()),
        },
        "predictive_cache": predictive_cache.get_stats(),
        "semantic_cache": semantic_cache.get_stats(),
        "rate_limit": rate_limit_optimizer.get_stats(),
        "token_optimizer": token_optimizer.get_cost_report(),
        "kimi": kimi_client.get_usage_summary() if kimi_client.is_available() else None,
        "config": {
            "routing_algorithm": config.ROUTING_ALGORITHM,
            "adaptive_routing": config.ENABLE_ADAPTIVE_ROUTING,
            "auto_discovery": config.ENABLE_AUTO_MODEL_DISCOVERY,
        }
    }


DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Quantum Chimera LLM v4.0 - Dashboard</title>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            padding: 20px;
        }
        h1 { 
            color: #00d4ff; 
            margin-bottom: 10px;
            text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }
        h2 { color: #888; margin: 20px 0 10px; font-size: 1.2em; }
        .version { color: #666; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .card {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #2a2a4a;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .card h3 { color: #00d4ff; margin-bottom: 15px; font-size: 1em; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #2a2a4a; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #888; }
        .metric-value { color: #00ff88; font-weight: bold; }
        .status-healthy { color: #00ff88; }
        .status-cooldown { color: #ffaa00; }
        .status-degraded { color: #ff4444; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #2a2a4a; }
        th { color: #888; font-weight: normal; }
        .refresh-info { color: #666; font-size: 0.9em; margin-top: 20px; }
        .feature-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 8px;
        }
        .feature-enabled { background: #00ff8833; color: #00ff88; }
        .feature-disabled { background: #ff444433; color: #ff4444; }
    </style>
</head>
<body>
    <h1>Quantum Chimera LLM v4.0</h1>
    <div class="version">Revolutionary AI-Powered LLM Gateway</div>
    
    <div id="features" style="margin-bottom: 20px;"></div>
    
    <div class="grid">
        <div class="card">
            <h3>Predictive Cache</h3>
            <div id="predictive-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h3>Semantic Cache</h3>
            <div id="semantic-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h3>Rate Limiting</h3>
            <div id="rate-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h3>Token Optimizer</h3>
            <div id="token-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h3>Kimi Usage (Today)</h3>
            <div id="kimi-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h3>Model Discovery</h3>
            <div id="discovery-stats">Loading...</div>
        </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
        <h3>Model Health</h3>
        <table id="model-table">
            <thead>
                <tr>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Success</th>
                    <th>Failure</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div class="refresh-info">Auto-refreshes every 10 seconds</div>
    
    <script>
        async function fetchStats() {
            try {
                const res = await fetch('/dashboard/stats');
                const data = await res.json();
                updateDashboard(data);
            } catch (e) {
                console.error('Failed to fetch stats:', e);
            }
        }
        
        function updateDashboard(data) {
            // Features
            const features = data.config;
            document.getElementById('features').innerHTML = `
                <span class="feature-badge feature-${features.adaptive_routing ? 'enabled' : 'disabled'}">Adaptive Routing</span>
                <span class="feature-badge feature-${features.auto_discovery ? 'enabled' : 'disabled'}">Auto Discovery</span>
                <span class="feature-badge feature-enabled">${features.routing_algorithm}</span>
            `;
            
            // Predictive cache
            const pred = data.predictive_cache;
            document.getElementById('predictive-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Entries:</span><span class="metric-value">${pred.total_entries}</span></div>
                <div class="metric"><span class="metric-label">Active:</span><span class="metric-value">${pred.active_entries}</span></div>
                <div class="metric"><span class="metric-label">Utilization:</span><span class="metric-value">${(pred.utilization * 100).toFixed(1)}%</span></div>
            `;
            
            // Semantic cache
            const sem = data.semantic_cache;
            document.getElementById('semantic-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Entries:</span><span class="metric-value">${sem.total_entries}</span></div>
                <div class="metric"><span class="metric-label">Hit Rate:</span><span class="metric-value">${sem.hit_rate_percent}%</span></div>
                <div class="metric"><span class="metric-label">Hits/Misses:</span><span class="metric-value">${sem.total_hits}/${sem.total_misses}</span></div>
            `;
            
            // Rate limiting
            const rate = data.rate_limit;
            document.getElementById('rate-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Strategy:</span><span class="metric-value">${rate.strategy}</span></div>
                <div class="metric"><span class="metric-label">Max/Min:</span><span class="metric-value">${rate.max_calls_per_minute}</span></div>
                <div class="metric"><span class="metric-label">Burst:</span><span class="metric-value">${rate.burst_capacity}</span></div>
            `;
            
            // Token optimizer
            const token = data.token_optimizer;
            document.getElementById('token-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Compression:</span><span class="metric-value">${token.compression_enabled ? 'ON' : 'OFF'}</span></div>
                <div class="metric"><span class="metric-label">Target Ratio:</span><span class="metric-value">${(token.compression_ratio_target * 100).toFixed(0)}%</span></div>
                <div class="metric"><span class="metric-label">Cost Threshold:</span><span class="metric-value">$${token.token_cost_threshold}</span></div>
            `;
            
            // Kimi
            const kimi = data.kimi;
            if (kimi) {
                document.getElementById('kimi-stats').innerHTML = `
                    <div class="metric"><span class="metric-label">Calls:</span><span class="metric-value">${kimi.calls_today}</span></div>
                    <div class="metric"><span class="metric-label">Tokens:</span><span class="metric-value">${kimi.total_tokens.toLocaleString()}</span></div>
                    <div class="metric"><span class="metric-label">Cost:</span><span class="metric-value">$${kimi.estimated_cost_usd}</span></div>
                `;
            } else {
                document.getElementById('kimi-stats').innerHTML = '<div style="color: #666;">Not configured</div>';
            }
            
            // Discovery
            const disc = data.discovered;
            document.getElementById('discovery-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Total Models:</span><span class="metric-value">${disc.total}</span></div>
                <div class="metric"><span class="metric-label">Free Models:</span><span class="metric-value">${disc.free}</span></div>
            `;
            
            // Model table
            const tbody = document.querySelector('#model-table tbody');
            tbody.innerHTML = '';
            
            for (const [modelId, stats] of Object.entries(data.models.models)) {
                const statusClass = stats.available ? 'status-healthy' : 'status-cooldown';
                const statusText = stats.available ? 'Healthy' : 'Cooldown';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${modelId}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td>${(stats.score * 100).toFixed(1)}%</td>
                    <td>${stats.success}</td>
                    <td>${stats.failure}</td>
                `;
                tbody.appendChild(row);
            }
        }
        
        fetchStats();
        setInterval(fetchStats, 10000);
    </script>
</body>
</html>
"""


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    """Serve the monitoring dashboard."""
    return DASHBOARD_HTML


@app.on_event("startup")
async def startup():
    """Startup event."""
    logger.info("=" * 70)
    logger.info("Quantum Chimera LLM v4.0 - Revolutionary AI-Powered Gateway")
    logger.info("=" * 70)
    
    # Validate config
    errors = config.validate()
    if errors:
        for error in errors:
            logger.error(f"Config error: {error}")
    
    # Log features
    logger.info("Revolutionary Features",
               auto_discovery=config.ENABLE_AUTO_MODEL_DISCOVERY,
               adaptive_routing=config.ENABLE_ADAPTIVE_ROUTING,
               routing_algorithm=config.ROUTING_ALGORITHM,
               predictive_cache=config.PREDICTIVE_CACHE_ENABLED,
               token_optimizer=config.ENABLE_TOKEN_OPTIMIZER,
               rate_limit_strategy=config.RATE_LIMIT_STRATEGY)
    
    # Start auto-discovery
    if config.ENABLE_AUTO_MODEL_DISCOVERY:
        asyncio.create_task(model_discovery.discover_models())
        model_discovery.start_auto_discovery()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info",
    )
