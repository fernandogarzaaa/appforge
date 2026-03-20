# AppForge Backend SDK: Architecture & Extraction Plan

## Overview
This document outlines the extraction of core backend primitives (Postgres, Auth, S3 Storage) from the InsForge repository to form the `appforge-backend-sdk`. The target is a lightweight, offline-first, locally-deployable SDK that strips out all cloud-specific provisioning, UI dashboards, and telemetry bloat to align with the CHIMERA/AppForge ecosystem constraints.

## Architecture of `appforge-backend-sdk`
The extracted SDK will follow a modular service/provider pattern:
1. **Auth Module**: Core JWT/session management, OAuth providers, and user management services.
2. **Database Module**: Direct Postgres orchestration, schema management, and base driver wrappers.
3. **Storage Module**: S3-compatible storage wrappers (designed for local MinIO or direct S3).

## Extraction Plan (Keep vs. Burn)

### 🟢 KEEP (Core SDK Primitives)
These files form the backbone of the offline-first backend SDK:

**Database (Postgres)**
- `backend/src/infra/database/*` (Migrations and Database Manager)
- `backend/src/providers/database/base.provider.ts` (Core DB provider abstraction)
- `backend/src/services/database/*` (Database lifecycle and querying logic)

**Auth & OAuth**
- `backend/src/services/auth/*` (Authentication and session logic)
- `backend/src/providers/oauth/*` (All OAuth integrations: google, github, apple, base, etc.)
- `backend/src/infra/security/*` (Security primitives, hashing, JWT)

**Storage (S3)**
- `backend/src/providers/storage/s3.provider.ts` (S3 implementation)
- `backend/src/providers/storage/base.provider.ts` (Storage abstraction)
- `backend/src/services/storage/*` (Bucket and object management logic)

**Shared Infrastructure**
- `shared-schemas/*` (Core typings and Zod/validation schemas for DB/Auth/Storage)
- `backend/src/types/*`
- `backend/src/utils/*`

### 🔥 BURN (Cloud, UI, and Telemetry Bloat)
These files will be excluded from the `appforge-backend-sdk` to maintain a lightweight footprint:

**UI & Dashboards**
- `ui/*` (Dashboard UI components)
- `frontend/*` (Main web application frontend)
- `auth/*` (Frontend auth portal UI - assuming SDK handles headless auth)

**Cloud Deployments & Telemetry**
- `backend/src/providers/deployments/*` (Cloud provisioning logic)
- `backend/src/services/deployments/*` (Cloud deployment management)
- `backend/src/providers/database/cloud.provider.ts` (Cloud-specific DB provisioning - we want local/bare-metal)
- `backend/src/providers/logs/*` (Cloud logging)
- `backend/src/services/logs/*` (Telemetry/log ingestion)
- `backend/src/services/usage/*` (Usage tracking, billing, telemetry)
- `backend/src/services/schedules/*` (If tightly coupled to cloud workers)

### ⚠️ OUT OF SCOPE (Handled by other swarms)
- **AI Gateway**: `backend/src/providers/ai/*` and `backend/src/services/ai/*` (Handled by API Crafting Swarm for CHIMERA Ultimate integration)
- **Functions/Realtime**: `backend/src/functions/*`, `backend/src/services/functions/*`, `backend/src/services/realtime/*` (Handled by MCP extractor or evaluated later)

## Next Steps
1. Create a fresh repository/package structure for `appforge-backend-sdk`.
2. Migrate the `KEEP` modules into `src/auth`, `src/database`, and `src/storage`.
3. Refactor imports to eliminate dependencies on the `BURN` modules.
4. Export a cohesive API surface via an `index.ts` facade.