# CHIMERA QUANTUM LLM - API Documentation

Complete API reference for CHIMERA QUANTUM LLM v3.0.0

## Base URL

```
http://localhost:7860
```

## Authentication

No authentication required for local deployment. The server uses your OpenRouter API key configured in `.env.clawd`.

---

## Endpoints

### 1. Chat Completions

Create a chat completion using the multi-model consensus system.

**Endpoint:** `POST /v1/chat/completions`

**Headers:**
```
Content-Type: application/json
```

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

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `model` | string | Yes | - | Must be `"chimera-quantum"` |
| `messages` | array | Yes | - | Array of message objects |
| `temperature` | float | No | 0.7 | Sampling temperature (0.0-2.0) |
| `max_tokens` | integer | No | 512 | Maximum tokens to generate |
| `stream` | boolean | No | false | Enable SSE streaming |
| `top_p` | float | No | 1.0 | Nucleus sampling |
| `frequency_penalty` | float | No | 0.0 | Frequency penalty (-2.0 to 2.0) |
| `presence_penalty` | float | No | 0.0 | Presence penalty (-2.0 to 2.0) |

**Message Object:**
```json
{
  "role": "user",        // "system", "user", or "assistant"
  "content": "Hello!"    // Message content
}
```

**Response:**
```json
{
  "id": "chatcmpl-chimera-abc123",
  "object": "chat.completion",
  "created": 1709312400,
  "model": "chimera-quantum/meta-llama/llama-3.3-70b-instruct:free",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I assist you today?"
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

**Example - Python:**
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
    ],
    temperature=0.7,
    max_tokens=512
)

print(response.choices[0].message.content)
```

**Example - JavaScript:**
```javascript
const response = await fetch('http://localhost:7860/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'chimera-quantum',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing' }
    ],
    temperature: 0.7,
    max_tokens: 512
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

**Example - cURL:**
```bash
curl -X POST http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "chimera-quantum",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7,
    "max_tokens": 256
  }'
```

---

### 2. Health Check

Check server health and configuration status.

**Endpoint:** `GET /health`

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

**Example:**
```bash
curl http://localhost:7860/health
```

---

### 3. List Models

Get a list of available models.

**Endpoint:** `GET /v1/models`

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

**Example:**
```bash
curl http://localhost:7860/v1/models
```

---

### 4. Dashboard

Access the live monitoring dashboard (HTML).

**Endpoint:** `GET /dashboard`

**Description:** Returns an HTML dashboard with real-time metrics including:
- Model health status
- Cache statistics
- Kimi usage and costs
- Recent requests

**Example:**
```bash
# Open in browser
open http://localhost:7860/dashboard
```

---

### 5. Statistics

Get cost tracking statistics.

**Endpoint:** `GET /v1/stats`

**Response:**
```json
{
  "total_calls": 150,
  "total_prompt_tokens": 4500,
  "total_completion_tokens": 12000,
  "estimated_cost_usd": 0.05,
  "by_model": {
    "meta-llama/llama-3.3-70b-instruct:free": {
      "calls": 100,
      "tokens": 10000
    }
  }
}
```

---

### 6. Insights

Get meta-reasoning traces and blueprint data.

**Endpoint:** `GET /v1/insights`

**Response:**
```json
{
  "traces": [...],
  "blueprints": [...],
  "adaptive_memory": {...},
  "quantum_engine": "active"
}
```

---

### 7. Endpoint Health

Get detailed health status for all model endpoints.

**Endpoint:** `GET /v1/endpoints`

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

## Streaming

Enable streaming responses using Server-Sent Events (SSE).

**Request:**
```json
{
  "model": "chimera-quantum",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

**Response:** Stream of SSE chunks
```
data: {"id":"...","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"...","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"...","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid request format |
| 422 | Validation Error | Request validation failed |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | All models unavailable |

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

## Rate Limits

- **Per-model:** 10 calls per minute
- **Kimi fallback:** No limit (paid service)
- **Cache hits:** Not rate limited

---

## SDK Examples

### Python (OpenAI SDK)
```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:7860/v1",
    api_key="not-needed"
)

# Simple completion
response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Streaming
stream = client.chat.completions.create(
    model="chimera-quantum",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### JavaScript/TypeScript
```typescript
// Using fetch
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

### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    reqBody, _ := json.Marshal(map[string]interface{}{
        "model": "chimera-quantum",
        "messages": []map[string]string{
            {"role": "user", "content": "Hello!"},
        },
    })

    resp, _ := http.Post(
        "http://localhost:7860/v1/chat/completions",
        "application/json",
        bytes.NewBuffer(reqBody),
    )
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    fmt.Println(result["choices"].([]interface{})[0].(map[string]interface{})["message"].(map[string]interface{})["content"])
}
```

---

## Support

- **Documentation:** https://docs.appforge.ai
- **Issues:** https://github.com/fernandogarzaaa/appforge/issues
- **Discord:** https://discord.gg/appforge
