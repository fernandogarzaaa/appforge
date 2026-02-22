# AppForge MCP Server (Repo-Aware, JSON-RPC 2.0)

This MCP server is customized for the **AppForge** repository and provides safe, local-logic APIs for:

- tool discovery and invocation
- resource listing and reading
- repository-aware analysis (scripts, swarm commands, docs)

## Why this is AppForge-specific

At startup, the server scans `package.json` and key repo paths (`backend`, `docs`, `quantum-core`, `scripts`, `swarm`, `src`, etc.) to expose repository-aware context via tools/resources.

## Transport

- HTTP JSON-RPC: `POST /rpc`
- WebSocket JSON-RPC: `/ws`

## MCP Methods

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`

## Tool Schemas

### `repo_overview`
Returns core repository metadata inferred from root `package.json`.

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### `swarm_scripts`
Lists `swarm:*` scripts, optionally filtered by keyword.

```json
{
  "type": "object",
  "properties": {
    "keyword": { "type": "string" }
  },
  "additionalProperties": false
}
```

### `repo_search`
Searches repo text and returns snippets.

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 1 },
    "path": { "type": "string" },
    "max_hits": { "type": "integer", "minimum": 1, "maximum": 100 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

### `file_read`
Reads UTF-8 text from repo root with path traversal protection.

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

### `calculator`
Safe arithmetic expression evaluator.

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

## Output validation

Every tool response is validated against a standard MCP-style result envelope:

- `content[]`
- `structuredContent`
- `isError`

This enforces stable tool output shape for MCP clients.

## Resources

- `file://README.md`
- `file://backend/README.md`
- `file://quantum-core/README.md`
- `text://appforge/scan` (generated repository scan)

## Example Requests/Responses

### 1) Repo overview

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "repo_overview",
    "arguments": {}
  }
}
```

Response (shape):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "{...}" }],
    "structuredContent": {
      "repo": "base44-app",
      "scriptCount": 50,
      "swarmScriptCount": 20,
      "keyPaths": ["backend", "docs", "swarm", "src"]
    },
    "isError": false
  }
}
```

### 2) Filter swarm scripts

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "swarm_scripts",
    "arguments": { "keyword": "benchmark" }
  }
}
```

### 3) Read generated repo scan resource

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": { "uri": "text://appforge/scan" }
}
```

## Run

```bash
pip install fastapi uvicorn jsonschema pydantic
uvicorn mcp_server.server:app --host 0.0.0.0 --port 8000
```

## How an LLM/MCP client connects

1. Connect to `http://localhost:8000/rpc` or `ws://localhost:8000/ws`.
2. Call `initialize`.
3. Call `tools/list` and `resources/list`.
4. Use `tools/call` with schema-valid arguments.
5. Use `resources/read` for doc/scan ingestion.
6. Parse `result.content` for user display and `result.structuredContent` for machine decisions.

## Security posture

- No external LLM API dependency.
- File operations are root-scoped to this repository.
- Search skips heavy/generated directories (`node_modules`, `.git`, `dist`, `coverage`).
- JSON-RPC errors use standard codes (`-32601`, `-32602`, `-32000`).
