# CHIMERA QUANTUM LLM - API Documentation

Complete API reference for CHIMERA QUANTUM LLM v3.0.0

## Base URL

```
http://localhost:7860
```

## Authentication

No authentication required for local deployment. The server uses OpenRouter API keys internally.

---

## Endpoints

### 1. Chat Completions

**Endpoint:** `POST /v1/chat/completions`

**Description:** OpenAI-compatible chat completion endpoint with multi-model consensus.

**Request Body:**

```json
{
  "model": "chimera-quantum",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 512,
  "stream": false
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model identifier (use "chimera-quantum") |
| `messages` | array | Yes | Array of message objects |
| `temperature` | float | No | Sampling temperature (0.0-2.0, default: 0.7) |
| `max_tokens` | integer | No | Maximum tokens to generate (default: 512) |
| `stream` | boolean | No | Enable streaming (default: false) |
| `top_p` | float | No | Nucleus sampling parameter |
| `frequency_penalty` | float | No | Frequency penalty (-2.0 to 2.0) |
| `presence_penalty` | float | No | Presence penalty (-2.0 to 2.0) |

**Response:**

```json
{
  "id": "chatcmpl-chimera-abc123",
  "object": "chat.completion",
  "created": 1709836800,
  "model": "chimera-quantum/meta-llama/llama-3.3-70b-instruct:free",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 20,
    "total_tokens": 45
  }
}
```

---

### 2. Health Check

**Endpoint:** `GET /health`

**Description:** Health check endpoint for load balancers and monitoring.

**Response:**

```json
{
  "status": "healthy",
  "name": "CHIMERA QUANTUM",
  "version": "1.0.0",
  "cache_size": 42,
  "models_configured": 5,
  "fallback_models": 3,
  "quantum_engine": true,
  "hyper_intelligence": true,
  "token_optimizer": true,
  "api_key_configured": true
}
```

---

### 3. List Models

**Endpoint:** `GET /v1/models`

**Description:** List all available models.

**Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "chimera-quantum",
      "object": "model",
      "owned_by": "chimera-quantum"
    },
    {
      "id": "meta-llama/llama-3.3-70b-instruct:free",
      "object": "model",
      "owned_by": "openrouter"
    }
  ]
}
```

---

### 4. Dashboard

**Endpoint:** `GET /dashboard`

**Description:** Live monitoring dashboard (HTML).

**Response:** HTML page with real-time statistics.

---

### 5. Statistics

**Endpoint:** `GET /v1/stats`

**Description:** Get cost tracking and usage statistics.

**Response:**

```json
{
  "total_calls": 150,
  "total_tokens": 45000,
  "estimated_cost": 0.0,
  "cache_hits": 75,
  "cache_misses": 75
}
```

---

### 6. Insights

**Endpoint:** `GET /v1/insights`

**Description:** Get meta-reasoning traces and blueprints.

**Response:**

```json
{
  "traces": [...],
  "blueprints": [...],
  "adaptive_memory": {...}
}
```

---

### 7. Endpoint Health

**Endpoint:** `GET /v1/endpoints`

**Description:** Get health summary for all model endpoints.

**Response:**

```json
{
  "meta-llama/llama-3.3-70b-instruct:free": {
    "consecutive_failures": 0,
    "total_failures": 2,
    "total_successes": 148,
    "in_cooldown": false,
    "last_error": ""
  }
}
```

---

## Code Examples

### Python

```python
import openai

# Configure client
client = openai.OpenAI(
    base_url="http://localhost:7860/v1",
    api_key="not-needed"
)

# Chat completion
response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing"}
    ],
    temperature=0.7,
    max_tokens=512
)

print(response.choices[0].message.content)
```

### JavaScript

```javascript
async function chatWithChimera() {
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
}

chatWithChimera();
```

### cURL

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

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized (API key issues) |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

---

## Rate Limiting

- **Per-model limit:** 10 calls per minute
- **Kimi fallback:** Exempt from rate limiting
- **Cache hits:** Not counted against rate limit

---

## Streaming

Enable streaming by setting `stream: true`:

```python
response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[...],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")
```

---

## Support

- **Documentation:** https://docs.appforge.ai
- **Issues:** https://github.com/fernandogarzaaa/appforge/issues
- **Dashboard:** http://localhost:7860/dashboard
