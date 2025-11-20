## Goal

- **Primary objective**: Expose YDB–Qdrant logic as a reusable Node.js/TypeScript library while preserving the existing “run as HTTP server” mode.
- **Programmatic usage**: Allow Node applications to call collection and point operations directly (create, get, delete collection; upsert, search, delete points) without starting a separate HTTP service.

## Current Architecture Summary

- **Entry and bootstrap**
  - `src/index.ts` performs YDB readiness check, ensures the metadata table, and starts the HTTP server.
  - `src/server.ts` builds the Express app, mounts routes, and exposes the health endpoint.
- **HTTP routing layer**
  - `src/routes/collections.ts`:
    - Implements PUT/GET/DELETE `/collections/{collection}`.
    - Handles compatibility routes such as PUT `/collections/{collection}/points` (upsert alias).
  - `src/routes/points.ts`:
    - Implements POST `/collections/{collection}/points/{upsert|search|delete}`.
    - Implements POST `/collections/{collection}/points/query` (search alias).
  - Tenancy is derived from the `X-Tenant-Id` header and sanitized using helpers in `utils/tenant.ts`.
  - Request payloads are validated and normalized using shared Zod schemas in `types.ts` and route-level helpers.
- **Domain and data layer (YDB access)**
  - `src/repositories/collectionsRepo.ts`:
    - Manages the `qdr__collections` metadata table.
    - Creates and deletes per-collection tables and manages vector index lifecycle (`buildVectorIndex()`).
  - `src/repositories/pointsRepo.ts`:
    - Implements upsert, search, and delete operations over points.
    - Uses the vector index view `emb_idx` when available, with a fallback to table scan.
  - `src/indexing/IndexScheduler.ts`:
    - Schedules deferred index builds using a point-count threshold and quiet window.
- **Infrastructure and configuration**
  - `src/config/env.ts` reads `YDB_ENDPOINT`, `YDB_DATABASE`, `PORT`, and `LOG_LEVEL`.
  - `src/ydb/client.ts` encapsulates `ydb-sdk` driver initialization, `readyOrThrow`, and `withSession`.
  - `src/logging/logger.ts` exposes the pino logger used across the service.

The core logic is already factored into repositories and utilities; routes are intentionally thin wrappers over this domain layer.

## Target Public API (Library Surface)

- **Initialization**
  - Provide a factory such as `createYdbQdrantClient(options?)` that:
    - Configures and initializes the YDB driver (reusing `ydb/client.ts`).
    - Optionally ensures the metadata table exists (mirroring current bootstrap behavior).
    - Accepts configuration overrides (endpoint, database, logging) while still supporting env-based defaults.
- **Programmatic operations**
  - Collection operations:
    - `createCollection(tenant, collection, createReq)`.
    - `getCollection(tenant, collection)`.
    - `deleteCollection(tenant, collection)`.
  - Point operations:
    - `upsertPoints(tenant, collection, upsertReq)`.
    - `searchPoints(tenant, collection, searchReq)`.
    - `deletePoints(tenant, collection, deleteReq)`.
  - Optionally support a tenant-scoped interface, for example a `forTenant(tenant)` helper that returns methods without explicit tenant parameter.
- **Types and errors**
  - Re-export request and response types from `src/types.ts` so library users can rely on the same shapes as the HTTP API.
  - Define error types that correspond closely to HTTP semantics (e.g., errors that carry status-like codes) for straightforward mapping in caller code.

## Refactor and Packaging Steps

### 1) Introduce a shared service layer

- Create `src/services/qdrantService.ts` (or equivalent) that:
  - Accepts `tenant`, `collection`, and typed request payloads.
  - Calls into `collectionsRepo`, `pointsRepo`, and `IndexScheduler` as needed.
  - Centralizes request normalization:
    - Handles `limit` versus `top` aliases.
    - Normalizes `with_payload` (boolean, object, array) into a consistent internal form.
    - Extracts query vectors from all accepted field variants.
  - Preserves scoring semantics, threshold behavior, and logging fields currently implemented in the routes.
  - Returns plain data objects independent of HTTP concerns.

### 2) Refactor Express routes to use the service layer

- Update `src/routes/collections.ts` and `src/routes/points.ts` to:
  - Derive `tenant` from `X-Tenant-Id` and sanitize via `utils/tenant.ts`.
  - Extract `collection` from route parameters and validate request bodies via existing Zod schemas.
  - Delegate business logic to the shared service layer functions.
  - Translate service results into HTTP responses (status codes and JSON bodies) without changing observable behavior.
- Ensure logging output (structure and fields) remains identical to current behavior, either by moving logging into the service layer or keeping route-level logging aligned.

### 3) Define the public programmatic API module

- Add `src/api.ts` that:
  - Re-exports the relevant Zod-derived types (request/response shapes) from `src/types.ts`.
  - Exposes `createYdbQdrantClient(options?)` as the primary constructor for programmatic usage.
  - Implements client methods that:
    - Internally call the shared service layer.
    - Use the same YDB driver and configuration wiring as the server path.
  - Optionally offers tenant-scoped and/or collection-scoped helpers to simplify repeated usage.

### 4) Preserve and expose server mode explicitly

- Keep `src/server.ts` focused on building an Express app:
  - Export a `buildApp()` function (or similar) that returns the configured app instance.
- Keep `src/index.ts` as the bootstrap script:
  - Initialize the YDB driver and ensure metadata tables.
  - Start the HTTP server on the configured `PORT`.
  - Optionally export a `startServer()` helper for programmatic server startup while preserving current CLI behavior.
- Maintain existing health and routing endpoints without contract changes.

### 5) Update package metadata for dual usage

- Adjust `ydb-qdrant/package.json` to:
  - Define an `exports` map such as:
    - `"."` → programmatic API entry point (compiled `dist/api.js` and corresponding type declarations).
    - `"./server"` (or similar) → Express app/server entry (compiled `dist/server.js` or thin wrapper).
  - Ensure `main` and `types` point to the programmatic API entry for compatibility with tooling that does not yet honor `exports`.
  - Preserve any existing `bin` configuration used for running the HTTP server (e.g., mapping to `dist/index.js`).
  - Restrict published files to the compiled `dist` output and necessary metadata.

### 6) Configuration and environment handling for library consumers

- Allow library consumers to:
  - Use the same environment variable configuration (`YDB_ENDPOINT`, `YDB_DATABASE`, and auth-related env vars) as the server.
  - Override configuration programmatically through `createYdbQdrantClient(options)`.
- Validate configuration early in the client factory and fail fast with clear error messages when required settings are missing or inconsistent.
- Keep authentication semantics identical to `ydb/client.ts` (env-driven credential selection order).

## Implementation Checklist

- **Shared service layer**
  - [x] Design `qdrantService` API surface (methods, inputs, outputs).
  - [x] Implement `src/services/qdrantService.ts` using existing repositories and `IndexScheduler`.
  - [x] Move or duplicate request normalization logic from routes into the service layer.
  - [x] Align logging in the service layer with current route logging fields and semantics.

- **Routes refactor**
  - [x] Update `src/routes/collections.ts` to delegate to the shared service layer.
  - [x] Update `src/routes/points.ts` to delegate to the shared service layer.
  - [ ] Verify all existing routes and compatibility aliases still behave identically.

- **Programmatic API**
  - [x] Implement `src/api.ts` with `createYdbQdrantClient(options?)`.
  - [x] Re-export request and response types from `src/types.ts`.
  - [x] Implement a tenant-scoped helper (for example, `forTenant(tenantId)`) to simplify repeated usage in side projects.
  - [x] Ensure the programmatic API can be used without running the HTTP server (no Express-specific assumptions).

- **Server mode preservation**
  - [x] Ensure `src/server.ts` cleanly exposes a server or app builder function.
  - [x] Ensure `src/index.ts` remains a working bootstrap (YDB initialization plus `PORT` listen).
  - [ ] Confirm `npm start` or `node dist/index.js` still behave as they do today.

- **Package configuration**
  - [x] Update `package.json` `exports` to expose `.` (library API) and `./server` (server entry).
  - [x] Ensure `main` and `types` point to the correct compiled entries.
  - [x] Verify any `bin` entry still points to the server bootstrap.

- **Configuration and environment behavior**
  - [x] Support environment-based defaults in the programmatic client (YDB endpoint, database, credentials).
  - [ ] Implement and test explicit overrides via `createYdbQdrantClient(options)`.
  - [ ] Document configuration patterns for side projects (env-only versus explicit options, and their precedence).

- **Testing and verification**
  - [x] Add unit tests for the shared service layer (with mocked repositories and index scheduler).
  - [x] Add unit tests for `createYdbQdrantClient` (initialization, overrides, error conditions).
  - [ ] Add integration tests comparing HTTP versus programmatic flows (create, upsert, search, delete).
  - [ ] Run regression checks to confirm logs, status codes, and responses remain unchanged.
  - [x] Add a small example or smoke test that mimics a typical side-project usage (create collection, upsert a few vectors, search) using only the programmatic API.

- **Documentation**
  - [ ] Update `README.md` to describe the new programmatic API surface, configuration options, and typical usage scenarios for side projects.

## Verification and Testing Strategy

- **Usage and data-flow verification**
  - For each new service-layer function, identify and verify all usages of the underlying repository functions to ensure behavior is unchanged.
  - Trace data flow from:
    - Programmatic API → service layer → repositories → YDB.
    - HTTP routes → service layer → repositories → YDB.
- **Unit tests**
  - Add tests for the service layer with mocked repositories and index scheduler to verify:
    - Request normalization.
    - Correct repository calls for each operation.
    - Correct handling of score thresholds and result shaping.
  - Add tests for the programmatic client:
    - Proper initialization and reuse of the YDB driver.
    - Correct application of environment defaults and explicit overrides.
- **Integration tests**
  - For a test YDB environment, validate that performing a sequence of operations via:
    - HTTP endpoints, and
    - Programmatic client
    yields equivalent observable outcomes (collections, points, search results).
- **Server regression checks**
  - Confirm that:
    - Endpoint paths and HTTP methods are unchanged.
    - Response formats (including error shapes) remain compatible.
    - Logging output (fields and messages) matches pre-refactor behavior.


