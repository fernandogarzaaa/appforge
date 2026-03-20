# QUANTUM SYNCHRONIZATION: InsForge Assimilation
## PHASE 2: EXECUTION

## Directive
We are now executing the Assimilation Phase. The reconnaissance blueprints must be converted into physical codebase mutations.

## Target Architecture
1. **AppForge Backend SDK (`D:\appforge-main\appforge-backend-sdk`)**:
   - Strip all UI, Telemetry, and Cloud Bloat.
   - Keep only `shared-schemas`, `database`, `auth`, `storage`.
2. **Project Evo MCP (`D:\project-evo\mcp_server.py`)**:
   - Write the Python FastAPI MCP server to act as the Semantic Layer for Evo Swarms.
3. **CHIMERA AI Gateway Rewiring**:
   - Hardcode AI provider logic to strictly use `http://localhost:7870/v1` (CHIMERA Ultimate).

## Agent Assignments
* **Feature Forge Swarm (`execute-sdk-builder`)**: Create `D:\appforge-main\appforge-backend-sdk`. Copy the essential directories from `D:\appforge-main\InsForge\backend\src` and `shared-schemas`. Discard the burn list.
* **Archaeology Swarm (`execute-mcp-server`)**: Write the complete Python FastAPI MCP server code to `D:\project-evo\mcp_server.py`. Create `start_mcp.bat` to run it using uvicorn.
* **API Crafting Swarm (`execute-chimera-rewire`)**: Locate the AI provider files (like `openrouter.provider.ts`) and physically edit them to route all traffic to `http://localhost:7870/v1`.