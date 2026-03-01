# CHIMERA QUANTUM LLM - API Documentation

Complete API reference for the CHIMERA QUANTUM LLM server.

**Base URL:** `http://localhost:7860`  
**Version:** 3.0.0

## Endpoints

### POST /v1/chat/completions

Create a chat completion using multi-model consensus.

**Request:**
```json
{
  "model": "chimera-quantum",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 512
}
```

**Response:**
```json
{
  "id": "chatcmpl-chimera-abc123",
  "object": "chat.completion",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    }
  }]
}
```

### GET /health

Check server health and status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_configured": 5,
  "cache_size": 42
}
```

### GET /v1/models

List available models.

### GET /dashboard

Access live monitoring dashboard.

## Python Example

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:7860/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="chimera-quantum",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

## JavaScript Example

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
