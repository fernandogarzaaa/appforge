# CHIMERA QUANTUM LLM v3.0.0

**Production-Ready Multi-Model Intelligence Gateway**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00a393.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

CHIMERA QUANTUM is a quantum-inspired multi-model LLM gateway that combines multiple free and paid models with intelligent routing, consensus voting, and semantic caching. It provides an OpenAI-compatible API for easy integration.

## 🚀 Features

### Core Capabilities
- **Multi-Model Consensus** - Queries multiple models in parallel and selects the best response
- **Quantum-Inspired Routing** - Score-based model selection with health monitoring
- **Semantic Caching** - Real cosine similarity matching for up to 60% cost savings
- **Intent Detection** - 5 intent types (coding, science, creative, analysis, general)
- **Conversation Memory** - Rolling conversation context with automatic compression
- **Response Quality Scoring** - Multi-factor quality evaluation (0.0-1.0)
- **Circuit Breakers** - Automatic failover when models are unhealthy
- **Kimi K2.5 Fallback** - Premium fallback when all free models fail

### Production Features
- **Live Dashboard** - Real-time monitoring at `/dashboard`
- **Health Endpoints** - `/health` for load balancer integration
- **Rate Limiting** - Per-model rate limiting (10 calls/min)
- **Request Deduplication** - Prevents duplicate API calls
- **Comprehensive Logging** - Structured logs with rotation
- **Benchmark Suite** - 10-test production validation

## 📊 Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Cache Hit Rate | 40-60% | ~50% |
| Cached Response | <300ms | ~150ms |
| LLM Response | 2-5s | 3-4s avg |
| Uptime | 99.9% | 99.9%+ |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHIMERA QUANTUM LLM                         │
├─────────────────────────────────────────────────────────────────┤
│  Request Flow:                                                  │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────────────────┐ │
│  │ Request  │──▶│ Deduplicate│──▶│ Intent Detection          │ │
│  └──────────┘   └──────────┘   └─────────────────────────────┘ │
│                                         │                       │
│  ┌──────────┐   ┌──────────┐           ▼                       │
│  │  Cache   │◀──│ Semantic │◀──┌─────────────────────────────┐│
│  │   Hit    │   │   Check  │   │ System Prompt Injection     ││
│  └──────────┘   └──────────┘   └─────────────────────────────┘│
│       │                              │                        │
│       │ Cache Miss                   ▼                        │
│       │                    ┌─────────────────────────────┐    │
│       │                    │ Model Routing Cascade       │    │
│       │                    │ • Primary Models (sorted)   │    │
│       │                    │ • Fallback Models           │    │
│       │                    │ • Kimi K2.5 Last Resort     │    │
│       │                    └─────────────────────────────┘    │
│       │                              │                        │
│       │                              ▼                        │
│       │                    ┌─────────────────────────────┐    │
│       │                    │ Quality Assurance           │    │
│       │                    │ • Response Scorer           │    │
│       │                    │ • Retry if Quality < 0.3    │    │
│       │                    └─────────────────────────────┘    │
│       │                              │                        │
│       └──────────────────────────────▶│ Response              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- OpenRouter API key (free tier available)
- Optional: Kimi API key for premium fallback

### Installation

```bash
# Clone the repository
git clone https://github.com/fernandogarzaaa/appforge.git
cd appforge/infrastructure/clawd-hybrid-rtx

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.clawd.example .env.clawd
# Edit .env.clawd with your OPENROUTER_API_KEY
```

### Start the Server

**Windows (PowerShell):**
```powershell
.\scripts\start_chimera.ps1
```

**Development mode (auto-reload):**
```powershell
.\scripts\start_chimera.ps1 -DevMode
```

**Manual start:**
```bash
python -m uvicorn src.chimera_server:app --host 0.0.0.0 --port 7860
```

### Verify Installation

```bash
# Run the benchmark suite
python benchmark.py
```

## 📡 API Usage

### OpenAI-Compatible Endpoint

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:7860/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ]
)

print(response.choices[0].message.content)
```

### cURL Example

```bash
curl -X POST http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chimera-quantum",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### JavaScript/TypeScript

```javascript
const response = await fetch('http://localhost:7860/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'chimera-quantum',
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

## 📊 Dashboard

Access the live dashboard at:
```
http://localhost:7860/dashboard
```

Features:
- Real-time model health status
- Cache hit rate statistics
- Kimi usage and cost tracking
- Recent request history
- Auto-refresh every 10 seconds

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key | Required |
| `KIMI_API_KEY` | Kimi API key (optional) | None |
| `CLAWD_PORT` | Server port | 7860 |
| `CLAWD_HOST` | Server host | 0.0.0.0 |
| `ENABLE_QUANTUM` | Enable quantum engine | 1 |
| `ENABLE_CACHE` | Enable semantic cache | 1 |
| `ENABLE_HYPER` | Enable hyper intelligence | 1 |
| `ENABLE_OPTIMIZER` | Enable token optimizer | 1 |
| `MAX_PRIMARY_MODELS` | Max primary models to query | 3 |
| `MAX_FALLBACK_MODELS` | Max fallback models | 5 |
| `CACHE_SIMILARITY_THRESHOLD` | Cache match threshold | 0.92 |
| `MAX_CALLS_PER_MINUTE` | Rate limit per model | 10 |

### Models Configuration

Default primary models (free tier):
- `meta-llama/llama-3.3-70b-instruct:free`
- `qwen/qwen3-coder:free`
- `deepseek/deepseek-r1-0528:free`
- `google/gemma-3-27b-it:free`
- `mistralai/mistral-small-3.1-24b-instruct:free`

Fallback models:
- `nousresearch/hermes-3-llama-3.1-405b:free`
- `arcee-ai/trinity-large-preview:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`

Last resort (requires API key):
- `moonshot/kimi-2.5` (paid, $0.012/1K tokens)

## 🧪 Testing

### Run Benchmark Suite

```bash
python benchmark.py
```

Tests 10 different query types:
1. Coding questions
2. Science explanations
3. Creative writing
4. Data analysis
5. General knowledge
6. Math problems
7. Debugging help
8. Historical analysis
9. Product descriptions
10. Technical architecture

### Health Check

```bash
curl http://localhost:7860/health
```

### List Models

```bash
curl http://localhost:7860/v1/models
```

## 📁 Project Structure

```
clawd-hybrid-rtx/
├── src/
│   ├── chimera_server.py      # Main FastAPI server
│   ├── config.py              # Configuration
│   ├── model_tracker.py       # Performance tracking
│   ├── semantic_cache.py      # Semantic caching
│   ├── conversation_memory.py # Conversation context
│   ├── response_scorer.py     # Quality scoring
│   ├── prompt_manager.py      # Intent detection
│   ├── kimi_client.py         # Kimi fallback
│   ├── openrouter_client.py   # OpenRouter client
│   └── logger.py              # Logging setup
├── scripts/
│   └── start_chimera.ps1      # Startup script
├── data/                      # Persistent data
├── logs/                      # Log files
├── benchmark.py               # Test suite
├── requirements.txt           # Dependencies
└── .env.clawd                 # Environment config
```

## 🔒 Security

- API keys stored in `.env.clawd` (never commit this file)
- Safety filter for content moderation
- Rate limiting to prevent abuse
- Circuit breakers for model failures

## 🤝 Comparison with Alternatives

| Feature | OpenRouter | LiteLLM | CHIMERA |
|---------|------------|---------|---------|
| Multi-Model | ✅ | ✅ | ✅ Consensus |
| Free Tier | ✅ | ❌ | ✅ |
| Caching | ❌ | ✅ | ✅ Semantic |
| Fallbacks | ✅ | ✅ | ✅ Kimi last-resort |
| Self-Hosted | ❌ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ Built-in |
| Intent Detection | ❌ | ❌ | ✅ |
| Cost Tracking | ❌ | ✅ | ✅ |

## 📝 License

Apache 2.0 - See [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

- OpenRouter for providing free model access
- Moonshot AI for Kimi K2.5 fallback
- FastAPI for the excellent web framework

---

**Built with ❤️ by the AppForge Team**
