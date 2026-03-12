# Architectural Audit & Improvements V2

This report outlines completely new, previously unidentified key improvements across the AppForge codebase, specifically targeting race conditions, database index optimization, performance bottlenecks, and code duplication.

## 1. Critical Race Conditions in TS Swarm (`swarm/core/loop.ts`)

**Finding:**
In `swarm/core/loop.ts`, the core autonomous loop executes specialized agents concurrently using `Promise.all()`:
```typescript
const [sentinelRes, bugHunterRes, optimizerRes, poRes, agRes] = await Promise.all([
    sentinel.run(),
    bugHunter.run(),
    optimizer.run(),
    productOwner.run(),
    antigravity.run()
]);
```
**Impact:**
All of these agents (BugHunter, Optimizer, ProductOwner, Antigravity) actively modify the same underlying codebase, issue filesystem writes, and trigger Git operations. Executing them concurrently creates extreme race conditions, file corruption risks, and `index.lock` collisions in Git.

**Action Plan:**
* Implement an **Agent Mutex** or **Resource Lock Manager** so agents can reserve specific directories/files.
* Refactor the `Promise.all()` parallel execution into a **sequential pipeline** (e.g., BugHunter finds issues -> Optimizer fixes -> Sentinel verifies), OR enforce read-only parallel passes before a synchronized write-phase.

## 2. Missing Database Compound Indexes (`migrations/001_initial_schema.sql`)

**Finding:**
The PostgreSQL schema defines multiple individual indexes on the `metrics` table (`metric_name`, `timestamp`, `service`). 
However, typical time-series queries (e.g., fetching metrics for a specific service over a time range) rely on compound filtering. Postgres will often fail to efficiently combine single-column indexes for high-volume time-series data.

**Impact:**
As the `metrics` and `usage_logs` tables grow, queries grouping by `service` and ordering by `timestamp` will experience severe performance degradation (table scans or bitmap ANDing bottlenecks).

**Action Plan:**
* Add compound indexes for frequent query access paths:
  * `CREATE INDEX idx_metrics_service_time ON metrics(service, timestamp DESC);`
  * `CREATE INDEX idx_metrics_name_time ON metrics(metric_name, timestamp DESC);`

## 3. Performance Bottlenecks: Filesystem & LLM IO

**Finding:**
1. **Geometry Sidecars**: The `src/api/` folder contains hundreds of `.geometry.json` files corresponding to every source file. These micro-files bloat the filesystem tree, increasing disk I/O, slowing down TS compilation, Vite HMR, and IDE indexing.
2. **Parallel Inference Overload**: The swarm spins up dozens of concurrent LLM API calls without a central batching queue.

**Action Plan:**
* Consolidate the `.geometry.json` state into a single SQLite or centralized `.appforge_metadata.json` store rather than polluting the source tree.
* Implement a centralized `InferenceQueue` in `llmApi.js` and the TS swarm `loop.ts` to manage concurrent LLM calls, rate limit effectively, and leverage batch endpoints where applicable.

## 4. Code & Architectural Duplication

**Finding:**
There is a split-brain architecture regarding backend API logic. The repository maintains both:
* `api/` (Serverless-style functions: `factory.ts`, `sovereign.ts`, `embeddings.ts`)
* `src/api/` (A mix of frontend API clients and duplicate backend services like `apiKeyService.js`, `deploymentService.js`, `swaggerIntegration.js`)

**Impact:**
Domain logic is scattered. Modifying API behavior requires hunting through both the root `/api` directory and the `/src/api` directory, leading to inconsistent error handling and duplicated client wrappers.

**Action Plan:**
* **Strict Boundary Enforcement:** Move all backend/server execution logic exclusively to `/api` or `/backend`. 
* Restrict `/src/api/` strictly to typed Axios/Fetch client wrappers that communicate with the backend. 
* Deprecate and remove redundant `Service.js` files in `/src/api` that attempt to perform backend operations directly from the React context.