# MCP Server (Python + FastAPI + JSON-RPC 2.0)

This folder contains a starter **Model Context Protocol (MCP)** server implementation.

## Features

- JSON-RPC 2.0 transport over:
  - HTTP `POST /rpc`
  - WebSocket `/ws`
- MCP-style methods:
  - `initialize`
  - `tools/list`
  - `tools/call`
  - `resources/list`
  - `resources/read`
- Example tools:
  - `web_search`
  - `calculator`
  - `file_read`
- Input validation with JSON Schema (`jsonschema.validate`)
- MCP-compatible `content` / `structuredContent` tool result format

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn jsonschema pydantic
```

## Run

```bash
uvicorn mcp_server.server:app --host 0.0.0.0 --port 8000
```

## Tool Schemas

### `calculator`

```json
{
  "type": "object",
  "properties": {
    "expression": { "type": "string" }
  },
  "required": ["expression"],
  "additionalProperties": false
}
```

### `web_search`

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 1 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

### `file_read`

```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string", "minLength": 1 },
    "max_chars": { "type": "integer", "minimum": 1, "maximum": 100000 }
  },
  "required": ["path"],
  "additionalProperties": false
}
```

## Example JSON-RPC Requests / Responses

### 1) `tools/list`

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Response (shape):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "calculator",
        "description": "Evaluate a safe arithmetic expression",
        "inputSchema": { "type": "object", "properties": { "expression": { "type": "string" } }, "required": ["expression"], "additionalProperties": false }
      }
    ]
  }
}
```

### 2) `tools/call` for calculator

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "expression": "(8 + 4) * 3"
    }
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "36" }],
    "structuredContent": { "value": 36 },
    "isError": false
  }
}
```

### 3) `resources/read`

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "text://server/info"
  }
}
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "contents": [
      {
        "uri": "text://server/info",
        "mimeType": "application/json",
        "text": "{\"name\":\"appforge-mcp\",\"version\":\"0.1.0\"}"
      }
    ]
  }
}
```

## How an LLM/MCP client connects

1. Start the server (`uvicorn ...`).
2. Connect with either:
   - HTTP JSON-RPC endpoint: `http://localhost:8000/rpc`
   - WebSocket JSON-RPC endpoint: `ws://localhost:8000/ws`
3. Send `initialize` first to discover capabilities.
4. Call `tools/list` and `resources/list`.
5. Use `tools/call` with a known tool name and JSON arguments matching each tool's schema.
6. Parse `result.content` for display text and `result.structuredContent` for machine-usable values.

## Notes

- The `file_read` tool is sandboxed to the repo root and rejects path traversal.
- `web_search` uses a static in-code corpus; replace with your own local index or service.
- Error responses follow JSON-RPC 2.0 conventions (`error.code`, `error.message`, optional `error.data`).
