"""
Quantum Chimera LLM - Main Server
==================================
Fixed and enhanced with all stability improvements.
"""

import json
import time
import uuid
import threading
from datetime import datetime
from typing import Dict, List, Optional, Any, Generator
from dataclasses import dataclass

from fastapi import FastAPI, Request, Response, HTTPException, Header
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from config import get_config
from src.logger import get_logger, log_error_with_context
from src.model_tracker import get_model_tracker
from src.semantic_cache import get_semantic_cache
from src.conversation_memory import get_conversation_memory
from src.kimi_client import get_kimi_client
from src.openrouter_client import get_openrouter_client
from src.response_scorer import get_response_scorer
from src.prompt_manager import get_prompt_manager
from src.chimera_memory import get_chimera_memory

logger = get_logger()

# ============================================================================
# In-Flight Request Deduplication
# ============================================================================

@dataclass
class InFlightRequest:
    """Track an in-flight request for deduplication."""
    key: str
    started_at: float
    response: Optional[Dict] = None
    completed: bool = False
    error: Optional[str] = None


class RequestDeduplicator:
    """Deduplicate identical in-flight requests."""
    
    DEDUP_WINDOW_SECONDS = 5
    
    def __init__(self):
        self._requests: Dict[str, InFlightRequest] = {}
        self._lock = threading.Lock()
        self._cleanup_interval = 10  # seconds
        self._start_cleanup_thread()
    
    def _start_cleanup_thread(self):
        """Start background cleanup thread."""
        def cleanup():
            while True:
                time.sleep(self._cleanup_interval)
                self._cleanup_expired()
        
        thread = threading.Thread(target=cleanup, daemon=True)
        thread.start()
    
    def _cleanup_expired(self):
        """Remove expired in-flight requests."""
        now = time.time()
        with self._lock:
            expired = [
                k for k, v in self._requests.items()
                if now - v.started_at > self.DEDUP_WINDOW_SECONDS
            ]
            for k in expired:
                del self._requests[k]
    
    def _generate_key(self, messages: List[Dict], strategy: str) -> str:
        """Generate deduplication key from messages and strategy."""
        # Use first user message + strategy
        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", "")[:200]  # First 200 chars
                return f"{strategy}:{hash(content) & 0xFFFFFFFF}"
        return f"{strategy}:{uuid.uuid4()}"
    
    def check_or_register(
        self, 
        messages: List[Dict], 
        strategy: str
    ) -> tuple[bool, Optional[InFlightRequest]]:
        """
        Check for duplicate or register new request.
        
        Returns:
            (is_duplicate, in_flight_request)
        """
        key = self._generate_key(messages, strategy)
        
        with self._lock:
            if key in self._requests:
                existing = self._requests[key]
                # Check if still within window
                if time.time() - existing.started_at <= self.DEDUP_WINDOW_SECONDS:
                    logger.info(f"Duplicate request detected: {key}")
                    return True, existing
            
            # Register new request
            new_request = InFlightRequest(key=key, started_at=time.time())
            self._requests[key] = new_request
            return False, new_request
    
    def complete(self, key: str, response: Dict):
        """Mark request as completed."""
        with self._lock:
            if key in self._requests:
                self._requests[key].response = response
                self._requests[key].completed = True
    
    def fail(self, key: str, error: str):
        """Mark request as failed."""
        with self._lock:
            if key in self._requests:
                self._requests[key].error = error


# Global deduplicator
_deduplicator = RequestDeduplicator()


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="Quantum Chimera LLM",
    description="Multi-model LLM gateway with quantum routing",
    version="3.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get config
config = get_config()

# Initialize components
model_tracker = get_model_tracker()
semantic_cache = get_semantic_cache()
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
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        },
    }


def extract_query(messages: List[Dict[str, str]]) -> str:
    """Extract the query text from messages."""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return msg.get("content", "")
    return ""


def route_request(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    stream: bool,
) -> Dict[str, Any]:
    """
    Route request through models with fallback logic.
    
    Order:
    1. Check semantic cache (if enabled)
    2. Try primary models (sorted by score)
    3. Try fallback models (sorted by score)
    4. Kimi as last resort
    """
    query = extract_query(messages)
    
    # ========================================================================
    # ISSUE 1 FIX: Verify ENABLE_CACHE flag is enforced
    # ========================================================================
    if config.ENABLE_CACHE:
        # Check semantic cache
        query_embedding = chimera_memory.get_embedding(query)
        cached_response, similarity = semantic_cache.get(query, query_embedding)
        
        if cached_response:
            logger.info(f"Cache hit, returning cached response",
                       similarity=round(similarity, 4) if similarity else None)
            return {
                "id": f"chimera-cache-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "chimera-cache",
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": cached_response,
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": len(query) // 4,
                    "completion_tokens": len(cached_response) // 4,
                    "total_tokens": (len(query) + len(cached_response)) // 4,
                },
                "cached": True,
                "similarity": similarity,
            }
    
    # ========================================================================
    # ISSUE 1 FIX: Verify MAX_PRIMARY_MODELS flag is enforced
    # ========================================================================
    # Get available primary models
    primary_models = model_tracker.get_available_models(config.PRIMARY_MODELS)
    primary_models = primary_models[:config.MAX_PRIMARY_MODELS]  # ENFORCED
    
    # Sort by score (best first)
    primary_models = [m for m, _ in model_tracker.get_sorted_models(primary_models)]
    
    # ========================================================================
    # ISSUE 1 FIX: Verify MAX_FALLBACK_MODELS flag is enforced
    # ========================================================================
    # Get available fallback models
    fallback_models = model_tracker.get_available_models(config.FALLBACK_MODELS)
    fallback_models = fallback_models[:config.MAX_FALLBACK_MODELS]  # ENFORCED
    
    # Sort by score
    fallback_models = [m for m, _ in model_tracker.get_sorted_models(fallback_models)]
    
    all_models = primary_models + fallback_models
    
    logger.info(f"Routing request",
               primary_count=len(primary_models),
               fallback_count=len(fallback_models),
               query_preview=query[:50])
    
    # Try each model
    last_error = None
    
    for model in all_models:
        try:
            logger.debug(f"Trying model: {model}")
            
            response = openrouter_client.chat_completion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            # Check for error response
            if "error" in response:
                logger.debug(f"Model {model} returned error: {response['error']}")
                last_error = response["error"].get("message", "Unknown error")
                continue
            
            # Extract content
            content = ""
            if response.get("choices"):
                content = response["choices"][0].get("message", {}).get("content", "")
            
            # ========================================================================
            # ISSUE 2 FIX: No silent error swallowing - log everything
            # ========================================================================
            if not content or not content.strip():
                logger.error(f"Empty response from model {model}",
                           response_preview=str(response)[:200])
                model_tracker.record_empty(model)
                last_error = "Empty response"
                continue
            
            # ========================================================================
            # ISSUE 1 FIX: Verify ENABLE_OPTIMIZER flag is enforced
            # ========================================================================
            if config.ENABLE_OPTIMIZER:
                # Score response quality
                quality_score = response_scorer.score(query, content)
                
                if quality_score < config.MIN_QUALITY_SCORE:
                    logger.warning(f"Response quality too low: {quality_score}",
                                 model=model,
                                 min_required=config.MIN_QUALITY_SCORE)
                    model_tracker.record_failure(model)
                    last_error = f"Quality score {quality_score} below threshold"
                    continue
                
                # Update model tracker with quality score
                model_tracker.record_success(model, len(content), quality_score)
            else:
                model_tracker.record_success(model, len(content))
            
            # Cache the response
            if config.ENABLE_CACHE:
                semantic_cache.set(query, content, query_embedding)
            
            logger.info(f"Successful response from {model}")
            return response
        
        # ========================================================================
        # ISSUE 2 FIX: No silent error swallowing - log all exceptions
        # ========================================================================
        except Exception as e:
            logger.error(f"Exception with model {model}: {e}", exc_info=True)
            model_tracker.record_failure(model)
            last_error = str(e)
            continue
    
    # ========================================================================
    # All OpenRouter models failed - try Kimi as last resort
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
            
            # Check for error
            if "error" not in response:
                content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                if content and content.strip():
                    # Cache the response
                    if config.ENABLE_CACHE:
                        semantic_cache.set(query, content, query_embedding)
                    
                    logger.info("Kimi fallback successful")
                    return response
                else:
                    logger.error("Kimi returned empty response")
                    last_error = "Kimi empty response"
            else:
                logger.error(f"Kimi error: {response['error']}")
                last_error = response["error"].get("message", "Kimi error")
        
        except Exception as e:
            logger.error(f"Kimi exception: {e}", exc_info=True)
            last_error = f"Kimi exception: {str(e)}"
    else:
        logger.error("Kimi client not available")
        last_error = "Kimi not configured"
    
    # ========================================================================
    # ISSUE 3 FIX: Always return non-empty fallback response
    # ========================================================================
    logger.error(f"All models exhausted. Last error: {last_error}")
    return create_error_response(f"All models failed. {last_error}")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/v1/models")
async def list_models():
    """List available models."""
    models = []
    
    for model_id in config.PRIMARY_MODELS + config.FALLBACK_MODELS:
        score = model_tracker.get_score(model_id)
        available = model_tracker.is_available(model_id)
        
        models.append({
            "id": model_id,
            "object": "model",
            "created": int(time.time()),
            "owned_by": "openrouter",
            "chimera": {
                "score": round(score, 3),
                "available": available,
            }
        })
    
    return {"object": "list", "data": models}


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Main chat completions endpoint."""
    try:
        body = await request.json()
        
        # Extract parameters
        messages = body.get("messages", [])
        model = body.get("model", "chimera-auto")
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 4096)
        stream = body.get("stream", False)
        
        # Get session ID from header
        session_id = request.headers.get("X-Session-ID")
        
        # Validate messages
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # ========================================================================
        # Detect intent and inject system prompt
        # ========================================================================
        query = extract_query(messages)
        intent = prompt_manager.detect_intent(query)
        messages = prompt_manager.inject_system_prompt(messages, intent)
        
        # ========================================================================
        # Add conversation context
        # ========================================================================
        if config.ENABLE_CONVERSATION_MEMORY:
            session_id = conversation_memory.get_or_create_session(messages, session_id)
            context = conversation_memory.get_context(session_id)
            if context:
                # Prepend context (but keep user's system prompt if present)
                has_system = messages and messages[0].get("role") == "system"
                if has_system:
                    messages = [messages[0]] + context + messages[1:]
                else:
                    messages = context + messages
        
        # ========================================================================
        # Check for duplicate request
        # ========================================================================
        is_duplicate, in_flight = _deduplicator.check_or_register(messages, "auto")
        
        if is_duplicate:
            # Wait for original to complete
            logger.info("Waiting for duplicate request to complete")
            start_wait = time.time()
            
            while time.time() - start_wait < 30:  # Max 30 second wait
                if in_flight.completed:
                    if in_flight.response:
                        logger.info("Serving duplicate response")
                        return in_flight.response
                    elif in_flight.error:
                        break
                time.sleep(0.1)
            
            # If we get here, either timeout or error
            logger.warning("Duplicate wait timeout or error, proceeding with new request")
        
        # Route the request
        response = route_request(messages, temperature, max_tokens, stream)
        
        # Mark deduplicator as complete
        if not is_duplicate and in_flight:
            _deduplicator.complete(in_flight.key, response)
        
        # Store conversation turn
        if config.ENABLE_CONVERSATION_MEMORY and session_id:
            conversation_memory.add_message(session_id, "user", query)
            response_content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
            conversation_memory.add_message(session_id, "assistant", response_content)
        
        return response
    
    # ========================================================================
    # ISSUE 2 FIX: No silent error swallowing
    # ========================================================================
    except HTTPException:
        raise
    except Exception as e:
        error_data = log_error_with_context(
            e, 
            "chat_completions",
            fallback_action="returning error response"
        )
        return create_error_response(str(e))


# ============================================================================
# Dashboard Stats Endpoint
# ============================================================================

@app.get("/dashboard/stats")
async def dashboard_stats():
    """Get stats for the monitoring dashboard."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "models": model_tracker.get_stats_summary(),
        "cache": semantic_cache.get_stats(),
        "memory": conversation_memory.get_stats(),
        "kimi": kimi_client.get_usage_summary() if kimi_client.is_available() else None,
        "config": {
            "enable_cache": config.ENABLE_CACHE,
            "enable_optimizer": config.ENABLE_OPTIMIZER,
            "enable_conversation_memory": config.ENABLE_CONVERSATION_MEMORY,
            "cache_threshold": config.CACHE_SIMILARITY_THRESHOLD,
        }
    }


# ============================================================================
# Dashboard HTML
# ============================================================================

DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Quantum Chimera LLM - Dashboard</title>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 20px;
        }
        h1 { color: #60a5fa; margin-bottom: 20px; }
        h2 { color: #94a3b8; margin: 20px 0 10px; font-size: 1.2em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card {
            background: #1e293b;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #334155;
        }
        .metric { display: flex; justify-content: space-between; margin: 8px 0; }
        .metric-label { color: #94a3b8; }
        .metric-value { color: #60a5fa; font-weight: bold; }
        .status-healthy { color: #22c55e; }
        .status-cooldown { color: #f59e0b; }
        .status-degraded { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #334155; }
        th { color: #94a3b8; font-weight: normal; }
        .refresh-info { color: #64748b; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Quantum Chimera LLM Dashboard</h1>
    <div class="refresh-info">Auto-refreshes every 10 seconds</div>
    
    <div class="grid">
        <div class="card">
            <h2>Cache Statistics</h2>
            <div id="cache-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h2>Kimi Usage (Today)</h2>
            <div id="kimi-stats">Loading...</div>
        </div>
        
        <div class="card">
            <h2>Conversation Memory</h2>
            <div id="memory-stats">Loading...</div>
        </div>
    </div>
    
    <div class="card" style="margin-top: 20px;">
        <h2>Model Health</h2>
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
            // Cache stats
            const cache = data.cache;
            document.getElementById('cache-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Entries:</span><span class="metric-value">${cache.total_entries}</span></div>
                <div class="metric"><span class="metric-label">Hit Rate:</span><span class="metric-value">${cache.hit_rate_percent}%</span></div>
                <div class="metric"><span class="metric-label">Hits:</span><span class="metric-value">${cache.total_hits}</span></div>
                <div class="metric"><span class="metric-label">Misses:</span><span class="metric-value">${cache.total_misses}</span></div>
            `;
            
            // Kimi stats
            const kimi = data.kimi;
            if (kimi) {
                document.getElementById('kimi-stats').innerHTML = `
                    <div class="metric"><span class="metric-label">Calls Today:</span><span class="metric-value">${kimi.calls_today}</span></div>
                    <div class="metric"><span class="metric-label">Total Tokens:</span><span class="metric-value">${kimi.total_tokens.toLocaleString()}</span></div>
                    <div class="metric"><span class="metric-label">Est. Cost:</span><span class="metric-value">$${kimi.estimated_cost_usd}</span></div>
                    <div class="metric"><span class="metric-label">Monthly Proj:</span><span class="metric-value">$${kimi.projected_monthly_cost}</span></div>
                `;
            } else {
                document.getElementById('kimi-stats').innerHTML = '<div style="color: #64748b;">Kimi not configured</div>';
            }
            
            // Memory stats
            const mem = data.memory;
            document.getElementById('memory-stats').innerHTML = `
                <div class="metric"><span class="metric-label">Conversations:</span><span class="metric-value">${mem.total_conversations}</span></div>
                <div class="metric"><span class="metric-label">Total Messages:</span><span class="metric-value">${mem.total_messages}</span></div>
                <div class="metric"><span class="metric-label">Avg/Conversation:</span><span class="metric-value">${mem.avg_messages_per_conversation.toFixed(1)}</span></div>
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
        
        // Initial load and auto-refresh
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


# ============================================================================
# Startup
# ============================================================================

@app.on_event("startup")
async def startup():
    """Startup event."""
    logger.info("=" * 60)
    logger.info("Quantum Chimera LLM v3.0.0 starting up")
    logger.info("=" * 60)
    
    # Validate config
    errors = config.validate()
    if errors:
        for error in errors:
            logger.error(f"Config error: {error}")
    
    # Log config
    logger.info("Configuration", **config.to_dict())
    
    # Log component status
    logger.info("Components",
               openrouter=openrouter_client.is_available(),
               kimi=kimi_client.is_available(),
               cache=config.ENABLE_CACHE,
               optimizer=config.ENABLE_OPTIMIZER,
               conversation_memory=config.ENABLE_CONVERSATION_MEMORY)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info",
    )
