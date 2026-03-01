# CHIMERA QUANTUM LLM - API Documentation

Complete API reference for the CHIMERA QUANTUM LLM server.

**Base URL:** `http://localhost:7860`  
**Version:** 3.0.0  
**Protocol:** HTTP/REST + Server-Sent Events (SSE)

---

## Authentication

CHIMERA does not require authentication for local use. The server is designed to run locally or behind a reverse proxy that handles authentication.

---

## Endpoints

### 1. Chat Completions

Create a chat completion using the multi-model consensus system.

**Endpoint:** `POST /v1/chat/completions`  
**Content-Type:** `application/json`

#### Request Body

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

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | - | Must be `"chimera-quantum"` |
| `messages` | array | Yes | - | List of message objects |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |
| `max_tokens` | integer | No | 512 | Maximum tokens to generate |
| `stream` | boolean | No | false | Enable SSE streaming |

#### Response

```json
{
  "id": "chatcmpl-chimera-abc123",
  "object": "chat.completion",
  "created": 1709385600,
  "model": "chimera-quantum/meta-llama/llama-3.3-70b-instruct:free",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking."
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

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_configured": 5,
  "fallback_models": 3,
  "cache_size": 42
}
```

---

### 3. List Models

**Endpoint:** `GET /v1/models`

---

### 4. Dashboard

**Endpoint:** `GET /dashboard`

Live monitoring dashboard with auto-refresh.

---

## Code Examples

### Python

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:7860/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript

```javascript
const response = await fetch('http://localhost:7860/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'chimera-quantum',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### cURL

```bash
curl -X POST http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chimera-quantum",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request format |
| 422 | Validation Error | Request validation failed |
| 500 | Internal Server Error | Server error |

### Error Response

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

- Per-model rate limit: 10 calls per minute
- Kimi fallback: No rate limit (paid service)
- Cache hits: Unlimited

---

## Models

### Primary Models (Free Tier)
- `meta-llama/llama-3.3-70b-instruct:free`
- `qwen/qwen3-coder:free`
- `deepseek/deepseek-r1-0528:free`
- `google/gemma-3-27b-it:free`
- `mistralai/mistral-small-3.1-24b-instruct:free`

### Fallback Models
- `nousresearch/hermes-3-llama-3.1-405b:free`
- `arcee-ai/trinity-large-preview:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`

### Last Resort (Paid)
- `moonshot/kimi-2.5` - Requires KIMI_API_KEY
