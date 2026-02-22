"""AppForge MCP server: JSON-RPC 2.0 over HTTP/WebSocket.

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
PROTOCOL_VERSION = "2024-11-05"
APP_ROOT = Path(__file__).resolve().parents[1]

SERVER_INFO = {
    "name": "appforge-mcp",
    "version": "0.2.0",
    "description": "Repo-aware MCP server for AppForge",
}

TOOL_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "content": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "text": {"type": "string"},
                },
                "required": ["type", "text"],
                "additionalProperties": True,
            },
        },
        "structuredContent": {"type": "object"},
        "isError": {"type": "boolean"},
    },
    "required": ["content", "structuredContent", "isError"],
    "additionalProperties": True,
}


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
        result = await handler(arguments)
        validate(instance=result, schema=TOOL_RESULT_SCHEMA)
        return result


registry = ToolRegistry()


def _load_package_json() -> dict[str, Any]:
    pkg_file = APP_ROOT / "package.json"
    if not pkg_file.exists():
        return {}
    return json.loads(pkg_file.read_text(encoding="utf-8"))


def _project_scan() -> dict[str, Any]:
    pkg = _load_package_json()
    scripts = pkg.get("scripts", {})
    deps = pkg.get("dependencies", {})
    dev_deps = pkg.get("devDependencies", {})

    swarm_scripts = sorted([k for k in scripts if k.startswith("swarm:")])
    test_scripts = sorted([k for k in scripts if k.startswith("test")])

    key_paths = [
        "backend",
        "docs",
        "functions",
        "quantum-core",
        "scripts",
        "src",
        "swarm",
        "sovereign-ui",
    ]
    existing_paths = [p for p in key_paths if (APP_ROOT / p).exists()]

    return {
        "name": pkg.get("name", "unknown"),
        "version": pkg.get("version", "unknown"),
        "scriptCount": len(scripts),
        "dependencyCount": len(deps),
        "devDependencyCount": len(dev_deps),
        "swarmScripts": swarm_scripts,
        "testScripts": test_scripts,
        "keyPaths": existing_paths,
    }


PROJECT_SCAN = _project_scan()


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
        "structuredContent": {"value": value, "expression": expression},
        "isError": False,
    }


async def tool_repo_overview(_: dict[str, Any]) -> dict[str, Any]:
    summary = {
        "repo": PROJECT_SCAN["name"],
        "version": PROJECT_SCAN["version"],
        "scriptCount": PROJECT_SCAN["scriptCount"],
        "dependencyCount": PROJECT_SCAN["dependencyCount"],
        "devDependencyCount": PROJECT_SCAN["devDependencyCount"],
        "keyPaths": PROJECT_SCAN["keyPaths"],
        "swarmScriptCount": len(PROJECT_SCAN["swarmScripts"]),
    }
    return {
        "content": [{"type": "text", "text": json.dumps(summary, indent=2)}],
        "structuredContent": summary,
        "isError": False,
    }


async def tool_swarm_scripts(args: dict[str, Any]) -> dict[str, Any]:
    keyword = args.get("keyword", "").lower()
    scripts = PROJECT_SCAN["swarmScripts"]
    if keyword:
        scripts = [s for s in scripts if keyword in s.lower()]
    payload = {"count": len(scripts), "scripts": scripts}
    return {
        "content": [{"type": "text", "text": json.dumps(payload, indent=2)}],
        "structuredContent": payload,
        "isError": False,
    }


async def tool_repo_search(args: dict[str, Any]) -> dict[str, Any]:
    query = args["query"].lower()
    subpath = args.get("path", ".")
    max_hits = args.get("max_hits", 20)

    base = (APP_ROOT / subpath).resolve()
    if not str(base).startswith(str(APP_ROOT.resolve())):
        raise ValueError("Search path escapes repository root")
    if not base.exists() or not base.is_dir():
        raise ValueError("Search path not found")

    hits: list[dict[str, Any]] = []
    for file in base.rglob("*"):
        if len(hits) >= max_hits:
            break
        if not file.is_file():
            continue
        if any(part in {"node_modules", ".git", "dist", "coverage"} for part in file.parts):
            continue
        try:
            text = file.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        idx = text.lower().find(query)
        if idx == -1:
            continue
        snippet_start = max(0, idx - 80)
        snippet_end = min(len(text), idx + 160)
        snippet = text[snippet_start:snippet_end].replace("\n", " ")
        hits.append({"file": str(file.relative_to(APP_ROOT)), "snippet": snippet})

    payload = {"query": query, "count": len(hits), "hits": hits}
    return {
        "content": [{"type": "text", "text": json.dumps(payload, indent=2)}],
        "structuredContent": payload,
        "isError": False,
    }


async def tool_file_read(args: dict[str, Any]) -> dict[str, Any]:
    rel_path = Path(args["path"])
    max_chars = args.get("max_chars", 4000)
    target = (APP_ROOT / rel_path).resolve()
    if not str(target).startswith(str(APP_ROOT.resolve())):
        raise ValueError("Path escapes repository root")
    if not target.exists() or not target.is_file():
        raise ValueError("File not found")
    text = target.read_text(encoding="utf-8", errors="ignore")
    payload = {
        "path": str(rel_path.as_posix()),
        "chars": len(text),
        "truncated": len(text) > max_chars,
    }
    return {
        "content": [{"type": "text", "text": text[:max_chars]}],
        "structuredContent": payload,
        "isError": False,
    }


registry.register(
    ToolDef(
        name="repo_overview",
        description="Return AppForge repository metadata: scripts, dependencies, and key directories",
        input_schema={
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    ),
    tool_repo_overview,
)
registry.register(
    ToolDef(
        name="swarm_scripts",
        description="List npm swarm scripts from package.json with optional keyword filtering",
        input_schema={
            "type": "object",
            "properties": {"keyword": {"type": "string"}},
            "additionalProperties": False,
        },
    ),
    tool_swarm_scripts,
)
registry.register(
    ToolDef(
        name="repo_search",
        description="Search repository text for a query and return contextual snippets",
        input_schema={
            "type": "object",
            "properties": {
                "query": {"type": "string", "minLength": 1},
                "path": {"type": "string"},
                "max_hits": {"type": "integer", "minimum": 1, "maximum": 100},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    ),
    tool_repo_search,
)
registry.register(
    ToolDef(
        name="file_read",
        description="Read UTF-8 file content from within the AppForge repository",
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
registry.register(
    ToolDef(
        name="calculator",
        description="Evaluate a safe arithmetic expression for quick numeric reasoning",
        input_schema={
            "type": "object",
            "properties": {"expression": {"type": "string"}},
            "required": ["expression"],
            "additionalProperties": False,
        },
    ),
    tool_calculator,
)

RESOURCES = [
    {
        "uri": "file://README.md",
        "name": "AppForge Root README",
        "description": "Top-level project overview",
        "mimeType": "text/markdown",
    },
    {
        "uri": "file://backend/README.md",
        "name": "Backend README",
        "description": "Backend architecture and APIs",
        "mimeType": "text/markdown",
    },
    {
        "uri": "file://quantum-core/README.md",
        "name": "Quantum Core README",
        "description": "Quantum core module notes",
        "mimeType": "text/markdown",
    },
    {
        "uri": "text://appforge/scan",
        "name": "AppForge scan",
        "description": "Repository summary generated by MCP server",
        "mimeType": "application/json",
    },
]


async def dispatch(method: str, params: dict[str, Any] | None) -> dict[str, Any]:
    params = params or {}
    if method == "initialize":
        return {
            "protocolVersion": PROTOCOL_VERSION,
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
        if uri == "text://appforge/scan":
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(PROJECT_SCAN),
                    }
                ]
            }
        if isinstance(uri, str) and uri.startswith("file://"):
            rel = uri.removeprefix("file://")
            target = (APP_ROOT / rel).resolve()
            if not str(target).startswith(str(APP_ROOT.resolve())):
                raise ValueError("Resource path escapes repository root")
            if not target.exists() or not target.is_file():
                raise ValueError("Resource not found")
            text = target.read_text(encoding="utf-8", errors="ignore")
            mime = "text/plain"
            if rel.endswith(".md"):
                mime = "text/markdown"
            elif rel.endswith(".json"):
                mime = "application/json"
            return {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": mime,
                        "text": text[:4000],
                    }
                ]
            }
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


app = FastAPI(title="AppForge MCP Server", version="0.2.0")


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
