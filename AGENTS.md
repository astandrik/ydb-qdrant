## Purpose
A small Node.js service and npm library that exposes a minimal Qdrant‑compatible REST API and stores/searches vectors in YDB. Intended as either:
- A drop‑in Qdrant base URL for tools expecting Qdrant (e.g., Roo Code) while persisting to a remote YDB instance.
- A programmatic client that can be imported directly from Node.js code without running a separate HTTP service.

## Quick facts
- **Base URLs**:
  - Public demo: `http://ydb-qdrant.tech:8080` (no setup, free to use)
  - Self-hosted: `http://localhost:8080` (default)
- **Tenancy**: per‑client isolation via header `X-Tenant-Id`; collection names are additionally namespaced by a short hash of `api-key` and normalized `User-Agent` (when present). Each tenant+collection is stored under a unique `uid` partition in the global points table.
- **Search**: one-table global search over `qdrant_all_points` using either approximate two-phase KNN (bit‑quantized `embedding_quantized` + exact re‑ranking over `embedding`) or exact table scan, controlled by `YDB_QDRANT_SEARCH_MODE` (`approximate` or `exact`).
- **Vectors**: stored as binary strings (`embedding` full-precision, `embedding_quantized` bit-quantized) and serialized client-side before being sent to YDB.

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
- Auth (first that matches; resolved in `src/ydb/client.ts` using `@ydbjs/auth` plus a custom SA key-file provider):
  - `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/abs/path/sa.json`
  - `YDB_METADATA_CREDENTIALS=1` (YC VM/Functions)
  - `YDB_ACCESS_TOKEN_CREDENTIALS=<token>` (short‑lived)
  - `YDB_ANONYMOUS_CREDENTIALS=1` (dev only)
- Optional:
- `PORT` (default 8080)
- `LOG_LEVEL`
- `YDB_QDRANT_SEARCH_MODE` — `"exact"` (default) or `"approximate"`; in approximate mode searches use a two-phase flow over `embedding_quantized` + `embedding`, in exact mode they scan `embedding` only.
- `YDB_QDRANT_OVERFETCH_MULTIPLIER` — candidate overfetch multiplier for approximate search phase 1 (default `10`, min `1`).
- `YDB_QDRANT_UPSERT_BATCH_SIZE` — upsert batch size per YDB query (default `100`, min `1`).
- Collection deletion uses YDB `BATCH DELETE FROM qdrant_all_points WHERE uid = <uid>` for one-table mode.
- `YDB_SESSION_POOL_MIN_SIZE` — minimum number of sessions in the pool (default `5`, range 1–500).
- `YDB_SESSION_POOL_MAX_SIZE` — maximum number of sessions in the pool (default `100`, range 1–500).
- `YDB_SESSION_KEEPALIVE_PERIOD_MS` — interval in milliseconds for session health checks (default `5000`, range 1000–60000). Dead sessions are automatically removed from the pool.
- `YDB_QDRANT_STARTUP_PROBE_SESSION_TIMEOUT_MS` — session timeout used by the startup compilation probe (default `5000`, min `1000`).
- `YDB_QDRANT_UPSERT_TIMEOUT_MS` — per‑query YDB operation timeout in milliseconds for upsert batches (default `5000`); individual UPSERT statements are cancelled if they exceed this bound.
- `YDB_QDRANT_SEARCH_TIMEOUT_MS` — per‑query YDB operation timeout in milliseconds for search operations (default `20000`); search YQL statements are cancelled if they exceed this bound.
- `YDB_QDRANT_LAST_ACCESS_MIN_WRITE_INTERVAL_MS` — minimum interval between `last_accessed_at` updates per collection (default `60000`, min `1000`).

## Run
- Dev: `npm run dev`  (tsx + watch)
- Build: `npm run build`
- Prod: `npm start`
- Note: service startup does not block on YDB readiness; requests may fail until YDB becomes available.
- Health: `GET /health` returns JSON health status. It responds with `{ "status": "ok" }` only when the HTTP server is up, the YDB driver is ready, and a lightweight compilation probe over `qdr__collections` succeeds; if YDB is unavailable or the probe fails it returns HTTP 503 with an error payload and then terminates the process after sending the response so a supervisor/orchestrator can restart the service.

## Docker images & compose
- Published image: `ghcr.io/astandrik/ydb-qdrant:latest` (public, pull-only), package page: https://github.com/users/astandrik/packages/container/package/ydb-qdrant.
- Typical `docker run`:
  - `docker run -d --name ydb-qdrant -p 8080:8080 ghcr.io/astandrik/ydb-qdrant:latest` + required YDB env (`YDB_ENDPOINT`, `YDB_DATABASE`, and one of `YDB_*_CREDENTIALS`; optionally mount an SA JSON at `/sa-key.json` and set `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json`).
- Minimal `docker-compose.yml` (for users/tools that prefer compose):
  - Service `ydb-qdrant` with `image: ghcr.io/astandrik/ydb-qdrant:latest`, `ports: ["8080:8080"]`, `env_file: [.env]`, env keys `YDB_ENDPOINT`, `YDB_DATABASE`, `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json`, and a volume `${YDB_SA_KEY_PATH}:/sa-key.json:ro`.
- Updating to a newer image when using compose (no rebuild):
  - `docker-compose pull ydb-qdrant && docker-compose up -d ydb-qdrant`.
- For agents that need a Qdrant base URL, point them at `http://localhost:8080` when this container/compose stack is running.

### Restart behavior and fatal errors

- When running under Docker or an orchestrator, the Node.js process exiting with a non‑zero status (for example because `/health` detected that YDB is unavailable or a compilation probe failed, or because a YDB compilation error occurred during upsert/search) is treated as a signal that the instance is unhealthy.
- Without a restart policy, the container simply stops and remains down until restarted manually.
- With a restart policy (`--restart=on-failure` / `--restart=unless-stopped` in `docker run`, or `restart: unless-stopped` in Compose / a typical Kubernetes `Deployment`), a non‑zero exit causes the platform to tear down the failed container/pod and start a fresh one, so subsequent requests and IDE retries are routed to a healthy instance.

## Data model
- Metadata table: `qdr__collections`
  - Row key `collection`: tenant/collection string in form `<tenant>/<collection>`
  - Fields: `table_name`, `vector_dimension`, `distance`, `vector_type`, `created_at`, `last_accessed_at`
- Global points table (one-table layout only): `qdrant_all_points`
  - `uid Utf8`, `point_id Utf8`, `embedding String` (binary float), `embedding_quantized String` (bit‑quantized), `payload JsonDocument`
  - Primary key: `(uid, point_id)` where `uid` is derived from tenant+collection (uses the same naming as the historical per‑collection tables).
  - Vector indexes are not used; searches are executed directly over `embedding` / `embedding_quantized`.
  - Created via YDB SDK table profile with auto-partitioning enabled (by load and size) and a target partition size of 100 MB.

## YDB vector specifics (YQL)
- Search (one-table layout):
  - Exact mode (`YDB_QDRANT_SEARCH_MODE=exact`, default): single-phase top‑k over `embedding` using `Knn::<Fn>(embedding, $qbinf)` with the appropriate distance/similarity (`CosineDistance`, `InnerProductSimilarity`, `EuclideanDistance`, `ManhattanDistance`).
  - Approximate mode (`YDB_QDRANT_SEARCH_MODE=approximate`): two‑phase flow — phase 1 selects candidates using bit‑quantized `embedding_quantized` (`CosineSimilarity` DESC for Cosine, distance ASC for Euclid/Manhattan, `CosineDistance` ASC as proxy for Dot); phase 2 re‑ranks candidates over `embedding` with the exact metric.
- Serialization:
  - `embedding` and `embedding_quantized` are encoded client-side using the binary formats expected by YDB `Knn::*` functions.

## Project structure (src/)
- `config/env.ts` — loads env (`dotenv/config`), exports `YDB_ENDPOINT`, `YDB_DATABASE`, `PORT`, `LOG_LEVEL`, search mode/config (`SearchMode`, `SEARCH_MODE`, `OVERFETCH_MULTIPLIER`), and YDB session pool settings.
- `logging/logger.ts` — pino logger (level from env).
- `utils/tenant.ts` — `sanitizeTenantId`, `sanitizeCollectionName`, `metaKeyFor`, `tableNameFor`, `uidFor`, API key and User-Agent hashing for collection names.
- `utils/normalization.ts` — vector extraction (`extractVectorLoose`, `isNumberArray`) and search body normalization (`normalizeSearchBodyForSearch`, `normalizeSearchBodyForQuery`).
- `utils/distance.ts` — distance mapping functions (`mapDistanceToKnnFn` for exact search, `mapDistanceToBitKnnFn` for one-table phase 1 approximate search).
- `utils/retry.ts` — generic retry wrapper (`withRetry`) with exponential backoff for transient YDB errors.
- `types.ts` — shared types and Zod schemas (CreateCollectionReq, UpsertPointsReq, SearchReq, DeletePointsReq).
- `ydb/client.ts` — `@ydbjs/core` `Driver` init + `@ydbjs/query` query client, `readyOrThrow`, `withSession`, `destroyDriver`, `refreshDriver`. Credentials resolved via `@ydbjs/auth` (plus SA key-file provider for `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS`).
- `ydb/schema.ts` — `ensureMetaTable()` (creates `qdr__collections` if missing) and `ensureGlobalPointsTable()` (creates `qdrant_all_points`).
- `repositories/collectionsRepo.ts` — facade for collection metadata operations and delete‑collection logic over the global points table.
- `repositories/pointsRepo.ts` — facade for point upsert/search/delete; routes calls to the one-table strategy (`pointsRepo.one-table.ts`) and uses `withRetry` for transient errors.
- `routes/collections.ts` — Express router for collection endpoints; uses `X-Tenant-Id`.
- `routes/points.ts` — Express router for points endpoints; delegates to `PointsService` for upsert/search/delete.
- `server.ts` — builds Express app, mounts routes, health endpoint.
- `index.ts` — bootstrap: ready check, ensure metadata/global tables, start server.
- `services/errors.ts` — `QdrantServiceError` class and `QdrantServiceErrorPayload` interface.
- `services/CollectionService.ts` — collection operations (`createCollection`, `getCollection`, `deleteCollection`, `putCollectionIndex`); context normalization and one-table UID resolution.
- `services/PointsService.ts` — points operations (`upsertPoints`, `searchPoints`, `queryPoints`, `deletePoints`); uses normalization utilities and collection metadata.
- `package/api.ts` — public programmatic API (`createYdbQdrantClient`) exposing Qdrant‑like operations directly to Node.js callers.
- `SmokeTest.ts` — minimal example/smoke test using the programmatic API to create a collection, upsert points, and run a search.
- `test/api/Api.test.ts` — Vitest unit tests for the programmatic API client (`createYdbQdrantClient`, `forTenant`, driver/schema wiring; YDB and service mocked).
- `test/services/QdrantService.test.ts` — service‑layer tests for collections and points (create/get/delete, upsert/search/delete, query alias, thresholds, error paths; repositories/YDB mocked).
- `test/routes/collections.test.ts`, `test/routes/points.test.ts` — HTTP route tests for Express routers (status codes, payload shapes, `QdrantServiceError` handling; service and logger mocked).
- `test/repositories/collectionsRepo.test.ts`, `test/repositories/pointsRepo.test.ts` — repository tests for YDB integration (`withSession`, YQL, delete/migration flows, one-table upsert/search/delete).
- `test/ydb/helpers.test.ts` — tests for YDB helper utilities (`buildVectorBinaryParams`).

## Conventions & constraints
- Tenancy via `X-Tenant-Id`; logical collection keys use `uid = qdr_<tenant>__<collection>` in the global table.
- Sanitization keeps only `[a-z0-9_]`, lowercases.
- Vector type `float`. Dimension enforced per collection.

## Scoring semantics
- Returned `score`:
  - Cosine: **similarity-like** (higher is better; derived approximately as `1 - Knn::CosineDistance` while preserving ranking).
  - Dot: **similarity** (higher is better; based on `Knn::InnerProductSimilarity`).
  - Euclid/Manhattan: **distance** (lower is better).
- `score_threshold` behavior:
  - Cosine: treated as **minimum similarity** in \[0, 1\] (as described by common IDEs/UI); applied directly as `score >= threshold`.
  - Dot: treated as **minimum similarity**; applied as `score >= threshold`.
  - Euclid/Manhattan: treated as **maximum distance**; applied as `score <= threshold`.

## Request normalization
- Accepts `limit` as alias of `top`; `with_payload` may be boolean/object/array (object/array treated as true).
- Extracts query vector from `vector`, `embedding`, `query.vector`, `query.nearest.vector`, or nested keys.

## Compatibility routes
- PUT `/collections/{collection}/points` → upsert alias
- POST `/collections/{collection}/points/query` → search alias
- PUT `/collections/{collection}/index` → no‑op (Qdrant payload index compatibility only; has no effect on vector search)

## Plugin integration (Roo Code, Cline)
**Public demo (no setup required)**:
- Qdrant URL: `http://ydb-qdrant.tech:8080`
- API key: Optional (not enforced); if provided it is only used for namespacing (short hash) when deriving internal collection keys
- Isolation: Use unique collection names or `X-Tenant-Id` header

**Self-hosted**:
- Qdrant URL: `http://localhost:8080`
- API key: Optional (not enforced); if provided it is only used for namespacing (short hash) when deriving internal collection keys
- Isolation: Full control via `X-Tenant-Id` header

Collections are not auto-created: create them explicitly via `PUT /collections/{collection}`. Point operations return `404 collection not found` until the collection exists.

## All-in-one local YDB + ydb-qdrant image

- Image: `ghcr.io/astandrik/ydb-qdrant-local:latest` (published from this repo on `ydb-qdrant-v*` tags; see `.github/workflows/docker-ydb-qdrant.yml`).
- Purpose: single-container local dev/demo with both YDB (Embedded UI on 8765) and ydb-qdrant HTTP API (8080) inside.
- Typical run:
  - `docker run -d --name ydb-qdrant-local -p 8080:8080 -p 8765:8765 ghcr.io/astandrik/ydb-qdrant-local:latest`
- The typical run command is ephemeral (data lives inside the container filesystem). For an example that keeps embedded YDB data across restarts, see the “Persistence across restarts (optional)” subsection in `docs/deployment-and-docker.md`.
- YDB config (env, all optional):
  - `YDB_LOCAL_GRPC_PORT` (default `2136`), `YDB_LOCAL_MON_PORT` (default `8765`), `YDB_DATABASE` (default `/local`), `YDB_ANONYMOUS_CREDENTIALS` (default `1`), `YDB_USE_IN_MEMORY_PDISKS`, `YDB_LOCAL_SURVIVE_RESTART`, `YDB_DEFAULT_LOG_LEVEL`, `YDB_FEATURE_FLAGS`, `YDB_ENABLE_COLUMN_TABLES`, `YDB_KAFKA_PROXY_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- ydb-qdrant config (env, same semantics as standalone image):
  - `PORT` (default `8080`), `LOG_LEVEL`, `YDB_QDRANT_SEARCH_MODE`.
- Note: `YDB_ENDPOINT` is unconditionally set to `grpc://localhost:<YDB_LOCAL_GRPC_PORT>` by the entrypoint — any user-provided value is ignored. Use the standalone `ydb-qdrant` image to connect to an external YDB.

## Logging & diagnostics
- JSON logs via pino middleware (method, url, tenant, status, ms).
- Search logs: vector len, dimension, metric/type, hits, validation issues, search mode ("exact" or "approximate").
- Upserts: transient `Aborted`/schema metadata errors are retried with bounded backoff.

## Implementation notes for agents
- The project uses YDB JS SDK v6 modular packages (`@ydbjs/core`, `@ydbjs/query`, `@ydbjs/value`, `@ydbjs/auth`).
- Prefer the `@ydbjs/query` tagged-template API via `withSession(fn)`; bind parameters via interpolation or `.parameter(name, value)`.
- Always set `.timeout(ms)` on retryable operations and use `.idempotent(true)` only when safe-to-retry.
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
  - Workflows split by concern: `ci-tests.yml` (lint/typecheck/tests), `ci-build.yml` (build), `ci-integration.yml` (integration), `ci-recall.yml` (recall), `ci-load-soak.yml` and `ci-load-stress.yml` (k6 load tests).
- Release:
  - Workflow `release-please.yml` manages releases on `main`.
  - Workflow `publish-ydb-qdrant.yml` publishes to npm on GitHub Release `published` events (uses `NPM_TOKEN`).
  - `prepublishOnly` script in `package.json` enforces `npm test` and `npm run build` before any manual `npm publish`.

## Semantic recall/completeness tests

Integration tests include realistic recall benchmarks following [ANN-benchmarks](https://github.com/erikbern/ann-benchmarks) methodology:

- **Benchmark parameters** (in `test/integration/helpers/recall-test-utils.ts`):
  - Dimensions: 768 (matches transformer embeddings like sentence-transformers)
  - Dataset size: 5,000 random normalized vectors
  - Query count: 50 queries
  - K: 10 (top-K retrieval)
  - Distance: Cosine (angular)
  - Ground truth: exact brute-force k-NN computation
  - Pass threshold: 30% mean recall (realistic for approximate search)

- **Methodology**:
  - Random vectors instead of trivially-separated clusters
  - Ground truth computed via exact cosine similarity ranking
  - Expected recall: 30-70% depending on index/quantization configuration
  - References: [ANN-benchmarks](https://ann-benchmarks.com/), [Aumüller et al., SISAP 2017](https://itu.dk/~maau/additional/sisap2017-preprint.pdf)

- **Test files**:
  - `test/integration/YdbRealIntegration.one-table.test.ts` — one_table layout recall benchmark and end-to-end checks.

- **CI execution** via `npm run test:integration`:
  - Runs `YdbRealIntegration.test.ts` (basic end-to-end programmatic API flow).
  - Runs `YdbRealIntegration.one-table.test.ts` twice with `YDB_QDRANT_SEARCH_MODE=approximate` and `=exact` to exercise both search modes.

- **CI output** (for Shields.io badges):
  - `RECALL_MEAN_ONE_TABLE <value>`
  - `F1_MEAN_ONE_TABLE <value>`

## Load testing (k6)

k6 load tests verify HTTP API performance under sustained and increasing load.

- **Test scripts** (in `loadtest/`):
  - `soak-test.js` — constant load (10 VUs for ~2.5min) to verify sustained performance
  - `stress-test.js` — supports two modes:
      - **Ramp mode** (default, for manual runs): ramping load (5→100 VUs over ~4min) to find breaking point
      - **Fixed mode** (used by CI via BreakingPointRunner): constant VUs for capacity search
  - `config.js` — shared configuration, thresholds, vector generation helpers
  - `helpers/setup.js` — collection setup/teardown, health check utilities

- **Soak test profile**:
  | Stage | Duration | VUs |
  |-------|----------|-----|
  | Ramp up | 30s | 0 → 10 |
  | Steady | 2m | 10 |
  | Ramp down | 10s | 10 → 0 |

- **Soak test pass criteria**:
  - Error rate < 1%
  - Search p95 < 500ms
  - Search p99 < 1000ms

- **Stress test profile**:
  | Stage | Duration | VUs |
  |-------|----------|-----|
  | Warm up | 30s | 0 → 5 |
  | Ramp to 20 | 1m | 5 → 20 |
  | Ramp to 50 | 1m | 20 → 50 |
  | Ramp to 100 | 1m | 50 → 100 |
  | Max load | 30s | 100 |
  | Recovery | 30s | 100 → 0 |

- **Stress test metrics**:
  - Breaking point VUs (when error rate exceeds 5% or p95 latency exceeds threshold)
  - Max RPS before errors
  - Latency percentiles at various load levels

- **CI workflows**:
  - `.github/workflows/ci-load-soak.yml` — runs soak test on PRs and main
  - `.github/workflows/ci-load-stress.yml` — runs stress test on PRs and main

- **CI output** (for monitoring):
  - `SOAK_OPS_PER_SEC`, `SOAK_SEARCH_P95`, `SOAK_SEARCH_P99`, `SOAK_ERROR_RATE`
  - `STRESS_MAX_VUS`, `STRESS_AVG_RPS`, `STRESS_BREAKING_POINT_VUS`, `STRESS_BREAKING_POINT_RPS`

- **Benchmark storage & regression detection**:
  - Uses `benchmark-action/github-action-benchmark` for historical tracking
  - Results stored in `gh-pages` branch under `dev/bench/`
  - Automatic regression detection with 150% threshold (alerts if metric degrades by 50%)
  - PR comments show comparison against baseline from `main`
  - Benchmark JSON output files: `soak-benchmark.json`, `stress-benchmark.json`, `soak-benchmark-capacity.json`, `stress-benchmark-capacity.json`
  - Tracked metrics (per test):
    - Latencies: p95, p99, max (smaller is better)
    - Error rate (smaller is better)
    - Throughput (bigger is better)
    - Stress-specific: Max VUs, Breaking Point VUs

## References
- YDB docs (overview): https://ydb.tech/docs/en/
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- YDB JavaScript/TypeScript SDK: https://github.com/ydb-platform/ydb-js-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
