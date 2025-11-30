## Purpose
A small Node.js service and npm library that exposes a minimal Qdrant‑compatible REST API and stores/searches vectors in YDB. Intended as either:
- A drop‑in Qdrant base URL for tools expecting Qdrant (e.g., Roo Code) while persisting to a remote YDB instance.
- A programmatic client that can be imported directly from Node.js code without running a separate HTTP service.

## Quick facts
- **Base URLs**:
  - Public demo: `http://ydb-qdrant.tech:8080` (no setup, free to use)
  - Self-hosted: `http://localhost:8080` (default)
- **Tenancy**: per‑client isolation via header `X-Tenant-Id`; each tenant+collection maps to its own YDB table.
- **Search**: single-phase top-k over `embedding` with automatic YDB vector index (`emb_idx`) if ≥100 points upserted. Falls back to table scan if index missing.
- **Vector index**: `vector_kmeans_tree` with levels=1, clusters=128 (optimized for <100k vectors). Built automatically after 5s quiet window following bulk upserts (≥100 points threshold).
- **Vectors**: stored as binary strings using Knn::ToBinaryStringFloat.

## API (Qdrant‑compatible subset)
- PUT `/collections/{collection}`
  - Body: `{ "vectors": { "size": number, "distance": "Cosine"|"Euclid"|"Dot"|"Manhattan", "data_type": "float" } }`
  - Header (optional): `X-Tenant-Id: <tenant>`
- GET `/collections/{collection}` 
- DELETE `/collections/{collection}`
- POST `/collections/{collection}/points/upsert`
  - Body: `{ "points": [{ "id": string|number, "vector": number[], "payload"?: object }] }`
- POST `/collections/{collection}/points/search`
  - Body: `{ "vector": number[], "top"|"limit": number, "with_payload"?: boolean|object|array, "score_threshold"?: number }`
- POST `/collections/{collection}/points/delete`
  - Body: `{ "points": (string|number)[] }`

Notes
- Pass `X-Tenant-Id` to isolate tables per client (defaults to `default`).
- Collection and tenant names are sanitized to `[a-z0-9_]` before use.

## Environment & credentials
- Required env: `YDB_ENDPOINT`, `YDB_DATABASE`.
- Auth (first that matches via ydb-sdk getCredentialsFromEnv):
  - `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/abs/path/sa.json`
  - `YDB_METADATA_CREDENTIALS=1` (YC VM/Functions)
  - `YDB_ACCESS_TOKEN_CREDENTIALS=<token>` (short‑lived)
  - `YDB_ANONYMOUS_CREDENTIALS=1` (dev only)
- Optional:
  - `PORT` (default 8080)
  - `LOG_LEVEL`
  - `VECTOR_INDEX_BUILD_ENABLED` — `"true"`/`"false"` toggle for automatic vector index builds and search behavior (default `"true"` in `multi_table` mode, `"false"` in `one_table` mode). When `"true"`, upserts schedule automatic builds and search first uses the vector index `emb_idx`, falling back to a table scan if the index is missing. When `"false"`, no automatic builds are scheduled and search never uses the vector index (all queries are executed as table scans over `embedding`).
  - `YDB_QDRANT_COLLECTION_STORAGE_MODE` — `"multi_table"` or `"one_table"` (default `"multi_table"`). Controls whether points are stored in per‑collection tables or a single global table. Backed by the `CollectionStorageMode` enum in `config/env.ts`. The legacy `YDB_QDRANT_TABLE_LAYOUT` env is still accepted as an alias.

## Run
- Dev: `npm run dev`  (tsx + watch)
- Build: `npm run build`
- Prod: `npm start`
- Health: `GET /health` → `{ status: "ok" }`

## Docker images & compose
- Published image: `ghcr.io/astandrik/ydb-qdrant:latest` (public, pull-only), package page: https://github.com/users/astandrik/packages/container/package/ydb-qdrant.
- Typical `docker run`:
  - `docker run -d --name ydb-qdrant -p 8080:8080 ghcr.io/astandrik/ydb-qdrant:latest` + required YDB env (`YDB_ENDPOINT`, `YDB_DATABASE`, and one of `YDB_*_CREDENTIALS`; optionally mount an SA JSON at `/sa-key.json` and set `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json`).
- Minimal `docker-compose.yml` (for users/tools that prefer compose):
  - Service `ydb-qdrant` with `image: ghcr.io/astandrik/ydb-qdrant:latest`, `ports: ["8080:8080"]`, `env_file: [.env]`, env keys `YDB_ENDPOINT`, `YDB_DATABASE`, `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json`, and a volume `${YDB_SA_KEY_PATH}:/sa-key.json:ro`.
- Updating to a newer image when using compose (no rebuild):
  - `docker-compose pull ydb-qdrant && docker-compose up -d ydb-qdrant`.
- For agents that need a Qdrant base URL, point them at `http://localhost:8080` when this container/compose stack is running.

## Data model
- Metadata table: `qdr__collections`
  - Row key `collection`: tenant/collection string in form `<tenant>/<collection>`
  - Fields: `table_name`, `vector_dimension`, `distance`, `vector_type`, `created_at`
- Default (multi‑table) layout:
  - Per‑collection table: `qdr_<tenant>__<collection>`
    - `point_id Utf8` (PK), `embedding String` (binary), `payload JsonDocument`
    - Vector index: `emb_idx` (auto-created after ≥100 points upserted; type `vector_kmeans_tree`)
- One‑table layout:
  - Global points table: `qdrant_all_points`
    - `uid Utf8`, `point_id Utf8`, `embedding String` (binary float), `embedding_bit String` (bit‑quantized), `payload JsonDocument`
    - Primary key: `(uid, point_id)` where `uid` is derived from tenant+collection (uses the same naming as per‑collection tables).
    - **Note**: Vector indexes are not supported in one‑table mode. Searches use a two‑phase flow: (1) approximate candidate selection over `embedding_bit` using the corresponding distance function (Cosine→CosineDistance, Euclid→EuclideanDistance, Manhattan→ManhattanDistance, Dot→CosineDistance as proxy), then (2) exact re‑ranking over `embedding` with the configured distance metric.

## YDB vector specifics (YQL)
- Search: single-phase top-k using vector index when available
  - With index: `SELECT ... FROM <table> VIEW emb_idx ORDER BY Knn::<Fn>(embedding, $qbin) LIMIT k`
  - Fallback: `SELECT ... FROM <table> ORDER BY Knn::<Fn>(embedding, $qbin) LIMIT k` (table scan)
  - Similarity: `CosineSimilarity`, `InnerProductSimilarity` (DESC)
  - Distance: `EuclideanDistance`, `ManhattanDistance` (ASC)
- Serialization:
  - `embedding` via `Untag(Knn::ToBinaryStringFloat($vec), "FloatVector")`
- Vector index (`emb_idx`):
  - Type: `vector_kmeans_tree` (GLOBAL SYNC)
  - Defaults: levels=1, clusters=128 (tuned for <100k vectors)
  - Build trigger: ≥100 points upserted + 5s quiet window
  - Rebuild: DROP INDEX → ADD INDEX on each scheduled build
  - Search automatically uses VIEW emb_idx; falls back to table scan if missing

## Project structure (src/)
- `config/env.ts` — loads env (`dotenv/config`), exports `YDB_ENDPOINT`, `YDB_DATABASE`, `PORT`, `LOG_LEVEL`, `CollectionStorageMode` enum and `COLLECTION_STORAGE_MODE` helpers.
- `logging/logger.ts` — pino logger (level from env).
- `utils/tenant.ts` — `sanitizeTenantId`, `sanitizeCollectionName`, `metaKeyFor`, `tableNameFor`.
- `utils/normalization.ts` — vector extraction (`extractVectorLoose`, `isNumberArray`) and search body normalization (`normalizeSearchBodyForSearch`, `normalizeSearchBodyForQuery`).
- `utils/distance.ts` — distance mapping functions (`mapDistanceToKnnFn` for search, `mapDistanceToIndexParam` for index DDL).
- `utils/retry.ts` — generic retry wrapper (`withRetry`) with exponential backoff for transient YDB errors.
- `types.ts` — shared types and Zod schemas (CreateCollectionReq, UpsertPointsReq, SearchReq, DeletePointsReq).
- `ydb/client.ts` — ydb-sdk Driver init (CJS interop), `readyOrThrow`, `withSession`, and re‑exports `Types`, `TypedValues`.
- `ydb/schema.ts` — `ensureMetaTable()` (creates `qdr__collections` if missing).
- `repositories/collectionsRepo.ts` — facade for collection metadata/table operations; delegates to layout‑specific strategy modules (`collectionsRepo.multi-table.ts`, `collectionsRepo.one-table.ts`); `buildVectorIndex()`.
- `repositories/pointsRepo.ts` — facade for point upsert/search/delete; delegates to layout‑specific strategy modules (`pointsRepo.multi-table.ts`, `pointsRepo.one-table.ts`); multi‑table search tries VIEW `emb_idx` first; uses `withRetry` for transient errors.
- `indexing/IndexScheduler.ts` — deferred vector index build scheduler with threshold (≥100 points) and quiet window (5s); delegates to layout‑specific implementations in `IndexScheduler.multi-table.ts` / `IndexScheduler.one-table.ts`.
- `routes/collections.ts` — Express router for collection endpoints; uses `X-Tenant-Id`.
- `routes/points.ts` — Express router for points endpoints; calls `requestIndexBuild()` after upserts.
- `server.ts` — builds Express app, mounts routes, health endpoint.
- `index.ts` — bootstrap: ready check, ensure metadata table, start server.
- `services/errors.ts` — `QdrantServiceError` class and `QdrantServiceErrorPayload` interface.
- `services/CollectionService.ts` — collection operations (`createCollection`, `getCollection`, `deleteCollection`, `putCollectionIndex`); context normalization.
- `services/PointsService.ts` — points operations (`upsertPoints`, `searchPoints`, `queryPoints`, `deletePoints`); uses normalization utilities.
- `package/api.ts` — public programmatic API (`createYdbQdrantClient`, `buildTenantClient` factory) exposing Qdrant‑like operations directly to Node.js callers.
- `SmokeTest.ts` — minimal example/smoke test using the programmatic API to create a collection, upsert points, and run a search.
- `test/api/Api.test.ts` — Vitest unit tests for the programmatic API client (`createYdbQdrantClient`, `forTenant`, driver/schema wiring; YDB and service mocked).
- `test/services/QdrantService.test.ts` — service‑layer tests for collections and points (create/get/delete, upsert/search/delete, query alias, thresholds, error paths; repositories/YDB mocked).
- `test/routes/collections.test.ts`, `test/routes/points.test.ts` — HTTP route tests for Express routers (status codes, payload shapes, `QdrantServiceError` handling; service and logger mocked).
- `test/repositories/collectionsRepo.test.ts`, `test/repositories/pointsRepo.test.ts` — repository tests for YDB integration (`withSession`, YQL, vector index DDL, upsert/delete loops, index fallback).
- `test/ydb/helpers.test.ts` — tests for YDB helper utilities (`buildVectorParam`, `buildJsonOrEmpty`).

## Conventions & constraints
- Tenancy via `X-Tenant-Id`; table names: `qdr_<tenant>__<collection>`.
- Sanitization keeps only `[a-z0-9_]`, lowercases.
- Vector type `float`. Dimension enforced per collection.
- Vector index auto-build: threshold ≥100 points, quiet window 5s, defaults levels=1/clusters=128.

## Scoring semantics
- Returned `score` follows Qdrant: higher‑is‑better for Cosine/Dot, lower‑is‑better for Euclid/Manhattan.
- `score_threshold` is applied accordingly (>= for Cosine/Dot; <= for Euclid/Manhattan).

## Request normalization
- Accepts `limit` as alias of `top`; `with_payload` may be boolean/object/array (object/array treated as true).
- Extracts query vector from `vector`, `embedding`, `query.vector`, `query.nearest.vector`, or nested keys.

## Compatibility routes
- PUT `/collections/{collection}/points` → upsert alias
- POST `/collections/{collection}/points/query` → search alias
- PUT `/collections/{collection}/index` → no‑op (Qdrant payload index compatibility; YDB vector index builds automatically)

## Plugin integration (Roo Code, Cline)
**Public demo (no setup required)**:
- Qdrant URL: `http://ydb-qdrant.tech:8080`
- API key: Leave empty or use any value (not enforced)
- Isolation: Use unique collection names or `X-Tenant-Id` header

**Self-hosted**:
- Qdrant URL: `http://localhost:8080`
- API key: Optional (not enforced)
- Isolation: Full control via `X-Tenant-Id` header

Collection created automatically on first use.

## All-in-one local YDB + ydb-qdrant image

- Image: `ghcr.io/astandrik/ydb-qdrant-local:latest` (published from this repo on `ydb-qdrant-v*` tags).
- Purpose: single-container local dev/demo with both YDB (Embedded UI on 8765) and ydb-qdrant HTTP API (8080) inside.
- Typical run:
  - `docker run -d --name ydb-qdrant-local -p 8080:8080 -p 8765:8765 ghcr.io/astandrik/ydb-qdrant-local:latest`
- YDB config (env, all optional):
  - `YDB_LOCAL_GRPC_PORT` (default `2136`), `YDB_LOCAL_MON_PORT` (default `8765`), `YDB_DATABASE` (default `/local`), `YDB_ANONYMOUS_CREDENTIALS` (default `1`), `YDB_USE_IN_MEMORY_PDISKS`, `YDB_LOCAL_SURVIVE_RESTART`, `YDB_DEFAULT_LOG_LEVEL`, `YDB_FEATURE_FLAGS`, `YDB_ENABLE_COLUMN_TABLES`, `YDB_KAFKA_PROXY_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- ydb-qdrant config (env, same semantics as standalone image):
  - `PORT` (default `8080`), `LOG_LEVEL`, `VECTOR_INDEX_BUILD_ENABLED`, `YDB_QDRANT_COLLECTION_STORAGE_MODE` / `YDB_QDRANT_TABLE_LAYOUT`, `YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE`.
- Note: `YDB_ENDPOINT` is unconditionally set to `grpc://localhost:<YDB_LOCAL_GRPC_PORT>` by the entrypoint — any user-provided value is ignored. Use the standalone `ydb-qdrant` image to connect to an external YDB.

## Logging & diagnostics
- JSON logs via pino middleware (method, url, tenant, status, ms).
- Search logs: vector len, dimension, metric/type, hits, validation issues, index usage ("vector index found" or "falling back to table scan").
- Index scheduler logs: "index build (scheduled) starting/completed", "index build skipped (below threshold)" with point counts.
- Upserts: transient `Aborted`/schema metadata errors during index rebuild are retried with bounded backoff.

## Implementation notes for agents
- ydb-sdk is consumed via CJS interop (`createRequire`) even in ESM TS to avoid ESM default export issues.
- Use `withSession(fn, 15000)` for queries and declare parameters in YQL with `DECLARE`.
- Prefer repository layer for YDB access; routes and services should remain thin.
- Service layer is split by domain: `CollectionService.ts` for collection operations, `PointsService.ts` for points operations, `errors.ts` for error types.
- Utility functions are extracted to `utils/`: `normalization.ts` (vector extraction), `distance.ts` (KNN/index mapping), `retry.ts` (transient error handling).
- Keep edits behavior‑preserving; avoid changing endpoint contracts without approval.
- The npm package entrypoint is the programmatic API (`dist/package/api.js`); HTTP server entry (`dist/server.js` and `dist/index.js`) must remain stable so that `npm start` and existing deployments continue to work.
- Programmatic API consumers are expected to use `createYdbQdrantClient(options?)` and optional `client.forTenant(tenantId)`; keep these names and shapes stable unless doing a major version bump.

## Programmatic npm package

- Package name: `ydb-qdrant`.
- Default entry: programmatic API (`createYdbQdrantClient`) that:
  - Reuses the same YDB env configuration as the server (`YDB_ENDPOINT`, `YDB_DATABASE`, `YDB_*_CREDENTIALS`).
  - Exposes Qdrant‑like methods: `createCollection`, `getCollection`, `deleteCollection`, `upsertPoints`, `searchPoints`, `deletePoints`.
  - Supports multi‑tenant usage via `defaultTenant` option and `forTenant(tenantId)`.
- HTTP routes delegate to `CollectionService` and `PointsService`, so the same logic is used by both HTTP and programmatic paths.

## CI and release

- CI:
  - Workflow `ci-ydb-qdrant.yml` runs `npm ci`, `npm run lint`, `npm test`, and `npm run build` on pushes and pull requests targeting `main`.
- Release:
  - Workflow `publish-ydb-qdrant.yml` runs on tags matching `ydb-qdrant-v*` and publishes the package to npm with `npm publish` (using `NPM_TOKEN`).
  - `prepublishOnly` script in `package.json` enforces `npm test` and `npm run build` before any manual `npm publish`.

## References
- YDB docs (overview): https://ydb.tech/docs/en/
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- ydb-sdk (Node.js): https://github.com/ydb-platform/ydb-nodejs-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
