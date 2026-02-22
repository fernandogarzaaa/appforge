"""Minimal MCP-compatible JSON-RPC server with HTTP and WebSocket transports.

Run:
  uvicorn mcp_server.server:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import ast
import json
from pathlib import Path
from typing import Any, Awaitable, Callable

from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse
from jsonschema import ValidationError, validate
from pydantic import BaseModel

JSONRPC_VERSION = "2.0"
SERVER_INFO = {"name": "appforge-mcp", "version": "0.1.0"}

APP_ROOT = Path(__file__).resolve().parents[1]
SAFE_READ_ROOT = APP_ROOT


class JsonRpcEnvelope(BaseModel):
    jsonrpc: str
    method: str
    params: dict[str, Any] | None = None
    id: str | int | None = None


class ToolDef(BaseModel):
    name: str
    description: str
    input_schema: dict[str, Any]


ToolHandler = Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, tuple[ToolDef, ToolHandler]] = {}

    def register(self, definition: ToolDef, handler: ToolHandler) -> None:
        self._tools[definition.name] = (definition, handler)

    def definitions(self) -> list[dict[str, Any]]:
        return [
            {
                "name": d.name,
                "description": d.description,
                "inputSchema": d.input_schema,
            }
            for d, _ in self._tools.values()
        ]

    async def call(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}")
        definition, handler = self._tools[name]
        validate(instance=arguments, schema=definition.input_schema)
        return await handler(arguments)


registry = ToolRegistry()


async def tool_calculator(args: dict[str, Any]) -> dict[str, Any]:
    expression = args["expression"]
    parsed = ast.parse(expression, mode="eval")
    allowed_nodes = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Constant,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.Mod,
        ast.Pow,
        ast.USub,
        ast.UAdd,
        ast.FloorDiv,
        ast.Load,
    )
    for node in ast.walk(parsed):
        if not isinstance(node, allowed_nodes):
            raise ValueError("Unsupported expression")
    value = eval(compile(parsed, "<calculator>", "eval"), {"__builtins__": {}}, {})
    return {
        "content": [{"type": "text", "text": str(value)}],
        "structuredContent": {"value": value},
        "isError": False,
    }


async def tool_web_search(args: dict[str, Any]) -> dict[str, Any]:
    query = args["query"].strip().lower()
    corpus = [
        {"title": "Model Context Protocol", "url": "https://modelcontextprotocol.io", "snippet": "Open protocol for tool and context exchange."},
        {"title": "JSON-RPC 2.0", "url": "https://www.jsonrpc.org/specification", "snippet": "Lightweight remote procedure call protocol."},
        {"title": "FastAPI", "url": "https://fastapi.tiangolo.com", "snippet": "Modern async web framework for Python APIs."},
    ]
    hits = [item for item in corpus if query in item["title"].lower() or query in item["snippet"].lower()]
    return {
        "content": [{"type": "text", "text": json.dumps(hits, indent=2)}],
        "structuredContent": {"results": hits},
        "isError": False,
    }


async def tool_file_read(args: dict[str, Any]) -> dict[str, Any]:
    rel_path = Path(args["path"]).as_posix()
    target = (SAFE_READ_ROOT / rel_path).resolve()
    if not str(target).startswith(str(SAFE_READ_ROOT.resolve())):
        raise ValueError("Path escapes allowed root")
    if not target.exists() or not target.is_file():
        raise ValueError("File not found")
    text = target.read_text(encoding="utf-8")
    return {
        "content": [{"type": "text", "text": text[: args.get("max_chars", 4000)]}],
        "structuredContent": {"path": rel_path, "chars": len(text)},
        "isError": False,
    }


registry.register(
    ToolDef(
        name="calculator",
        description="Evaluate a safe arithmetic expression",
        input_schema={
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"],
            "additionalProperties": False,
        },
    ),
    tool_calculator,
)
registry.register(
    ToolDef(
        name="web_search",
        description="Search a local demonstration index and return matching snippets",
        input_schema={
            "type": "object",
            "properties": {"query": {"type": "string", "minLength": 1}},
            "required": ["query"],
            "additionalProperties": False,
        },
    ),
    tool_web_search,
)
registry.register(
    ToolDef(
        name="file_read",
        description="Read UTF-8 file content from within the server workspace",
        input_schema={
            "type": "object",
            "properties": {
                "path": {"type": "string", "minLength": 1},
                "max_chars": {"type": "integer", "minimum": 1, "maximum": 100000},
            },
            "required": ["path"],
            "additionalProperties": False,
        },
    ),
    tool_file_read,
)

RESOURCES = [
    {
        "uri": "file://README.md",
        "name": "Project README",
        "description": "Top-level project readme",
        "mimeType": "text/markdown",
    },
    {
        "uri": "text://server/info",
        "name": "Server Info",
        "description": "MCP server metadata",
        "mimeType": "application/json",
    },
]


async def dispatch(method: str, params: dict[str, Any] | None) -> dict[str, Any]:
    params = params or {}
    if method == "initialize":
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": SERVER_INFO,
            "capabilities": {
                "tools": {"listChanged": False},
                "resources": {"subscribe": False, "listChanged": False},
            },
        }
    if method == "tools/list":
        return {"tools": registry.definitions()}
    if method == "tools/call":
        name = params.get("name")
        arguments = params.get("arguments", {})
        if not isinstance(name, str):
            raise ValueError("tools/call requires string 'name'")
        if not isinstance(arguments, dict):
            raise ValueError("tools/call requires object 'arguments'")
        return await registry.call(name, arguments)
    if method == "resources/list":
        return {"resources": RESOURCES}
    if method == "resources/read":
        uri = params.get("uri")
        if uri == "text://server/info":
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(SERVER_INFO),
                    }
                ]
            }
        if uri == "file://README.md":
            text = (APP_ROOT / "README.md").read_text(encoding="utf-8")
            return {"contents": [{"uri": uri, "mimeType": "text/markdown", "text": text[:4000]}]}
        raise ValueError(f"Unknown resource uri: {uri}")
    raise ValueError(f"Method not found: {method}")


def ok_response(request_id: str | int | None, result: dict[str, Any]) -> dict[str, Any]:
    return {"jsonrpc": JSONRPC_VERSION, "id": request_id, "result": result}


def error_response(request_id: str | int | None, code: int, message: str, data: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "jsonrpc": JSONRPC_VERSION,
        "id": request_id,
        "error": {"code": code, "message": message},
    }
    if data is not None:
        payload["error"]["data"] = data
    return payload


async def handle_rpc(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        env = JsonRpcEnvelope.model_validate(payload)
        if env.jsonrpc != JSONRPC_VERSION:
            return error_response(env.id, -32600, "Invalid Request: jsonrpc must be 2.0")
        result = await dispatch(env.method, env.params)
        return ok_response(env.id, result)
    except ValidationError as exc:
        return error_response(payload.get("id"), -32602, "Invalid params", str(exc))
    except ValueError as exc:
        msg = str(exc)
        if msg.startswith("Method not found"):
            return error_response(payload.get("id"), -32601, msg)
        return error_response(payload.get("id"), -32602, msg)
    except Exception as exc:  # pylint: disable=broad-except
        return error_response(payload.get("id"), -32000, "Server error", str(exc))


app = FastAPI(title="AppForge MCP Server", version="0.1.0")


@app.post("/rpc")
async def rpc_http(payload: dict[str, Any]) -> JSONResponse:
    return JSONResponse(await handle_rpc(payload))


@app.websocket("/ws")
async def rpc_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    while True:
        raw = await websocket.receive_text()
        payload = json.loads(raw)
        response = await handle_rpc(payload)
        await websocket.send_text(json.dumps(response))
