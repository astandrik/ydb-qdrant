## Purpose
A small Node.js service that exposes a minimal Qdrant‑compatible REST API and stores/searches vectors in YDB. Intended as a drop‑in base URL for tools expecting Qdrant (e.g., Roo Code) while persisting to a remote YDB instance.

## Quick facts
- **Base URLs**:
  - Public demo: `http://ydb-qdrant.tech:8080` (no setup, free to use)
  - Self-hosted: `http://localhost:8080` (default)
- **Tenancy**: per‑client isolation via header `X-Tenant-Id`; each tenant+collection maps to its own YDB table.
- **Search**: single-phase top-k over `embedding` with automatic YDB vector index (`emb_idx`) if ≥100 points upserted. Falls back to table scan if index missing.
- **Vector index**: `vector_kmeans_tree` with levels=1, clusters=128 (optimized for <100k vectors). Built automatically after 5s quiet window following bulk upserts (≥100 points threshold).
- **Vectors**: stored as binary strings using Knn::ToBinaryStringFloat (float) or Knn::ToBinaryStringUint8 (uint8).

## API (Qdrant‑compatible subset)
- PUT `/collections/{collection}`
  - Body: `{ "vectors": { "size": number, "distance": "Cosine"|"Euclid"|"Dot"|"Manhattan", "data_type": "float"|"uint8" } }`
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
- Optional: `PORT` (default 8080), `LOG_LEVEL`.

## Run
- Dev: `npm run dev`  (tsx + watch)
- Build: `npm run build`
- Prod: `npm start`
- Health: `GET /health` → `{ status: "ok" }`

## Data model
- Metadata table: `qdr__collections`
  - Row key `collection`: tenant/collection string in form `<tenant>/<collection>`
  - Fields: `table_name`, `vector_dimension`, `distance`, `vector_type`, `created_at`
- Per‑collection table: `qdr_<tenant>__<collection>`
  - `point_id Utf8` (PK), `embedding String` (binary), `payload JsonDocument`
  - Vector index: `emb_idx` (auto-created after ≥100 points upserted; type `vector_kmeans_tree`)

## YDB vector specifics (YQL)
- Search: single-phase top-k using vector index when available
  - With index: `SELECT ... FROM <table> VIEW emb_idx ORDER BY Knn::<Fn>(embedding, $qbin) LIMIT k`
  - Fallback: `SELECT ... FROM <table> ORDER BY Knn::<Fn>(embedding, $qbin) LIMIT k` (table scan)
  - Similarity: `CosineSimilarity`, `InnerProductSimilarity` (DESC)
  - Distance: `EuclideanDistance`, `ManhattanDistance` (ASC)
- Serialization:
  - `embedding` via `Untag(Knn::ToBinaryString{Float|Uint8}($vec), "{Float|Uint8}Vector")`
- Vector index (`emb_idx`):
  - Type: `vector_kmeans_tree` (GLOBAL SYNC)
  - Defaults: levels=1, clusters=128 (tuned for <100k vectors)
  - Build trigger: ≥100 points upserted + 5s quiet window
  - Rebuild: DROP INDEX → ADD INDEX on each scheduled build
  - Search automatically uses VIEW emb_idx; falls back to table scan if missing

## Project structure (src/)
- `config/env.ts` — loads env (`dotenv/config`), exports `YDB_ENDPOINT`, `YDB_DATABASE`, `PORT`, `LOG_LEVEL`.
- `logging/logger.ts` — pino logger (level from env).
- `utils/tenant.ts` — `sanitizeTenantId`, `sanitizeCollectionName`, `metaKeyFor`, `tableNameFor`.
- `types.ts` — shared types and Zod schemas (CreateCollectionReq, UpsertPointsReq, SearchReq, DeletePointsReq).
- `ydb/client.ts` — ydb-sdk Driver init (CJS interop), `readyOrThrow`, `withSession`, and re‑exports `Types`, `TypedValues`.
- `ydb/schema.ts` — `ensureMetaTable()` (creates `qdr__collections` if missing).
- `repositories/collectionsRepo.ts` — create/get/delete collection metadata and tables; `buildVectorIndex()`.
- `repositories/pointsRepo.ts` — upsert/search/delete points; search tries VIEW emb_idx first.
- `indexing/IndexScheduler.ts` — deferred vector index build scheduler with threshold (≥100 points) and quiet window (5s).
- `routes/collections.ts` — Express router for collection endpoints; uses `X-Tenant-Id`.
- `routes/points.ts` — Express router for points endpoints; calls `requestIndexBuild()` after upserts.
- `server.ts` — builds Express app, mounts routes, health endpoint.
- `index.ts` — bootstrap: ready check, ensure metadata table, start server.

## Conventions & constraints
- Tenancy via `X-Tenant-Id`; table names: `qdr_<tenant>__<collection>`.
- Sanitization keeps only `[a-z0-9_]`, lowercases.
- Vector type `float` (default) or `uint8`. Dimension enforced per collection.
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

## Logging & diagnostics
- JSON logs via pino middleware (method, url, tenant, status, ms).
- Search logs: vector len, dimension, metric/type, hits, validation issues, index usage ("vector index found" or "falling back to table scan").
- Index scheduler logs: "index build (scheduled) starting/completed", "index build skipped (below threshold)" with point counts.
- Upserts: transient `Aborted`/schema metadata errors during index rebuild are retried with bounded backoff.

## Implementation notes for agents
- ydb-sdk is consumed via CJS interop (`createRequire`) even in ESM TS to avoid ESM default export issues.
- Use `withSession(fn, 15000)` for queries and declare parameters in YQL with `DECLARE`.
- Prefer repository layer for YDB access; routes should remain thin.
- Keep edits behavior‑preserving; avoid changing endpoint contracts without approval.

## References
- YDB docs (overview): https://ydb.tech/docs/en/
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- ydb-sdk (Node.js): https://github.com/ydb-platform/ydb-nodejs-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
