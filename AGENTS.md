## Purpose
A small Node.js service that exposes a minimal Qdrant‑compatible REST API and stores/searches vectors in YDB. Intended as a drop‑in base URL for tools expecting Qdrant (e.g., Roo Code) while persisting to a remote YDB instance.

## Quick facts
- **Base URLs**:
  - Public demo: `http://ydb-qdrant.tech:8080` (no setup, free to use)
  - Self-hosted: `http://localhost:8080` (default)
- **Tenancy**: per‑client isolation via header `X-Tenant-Id`; each tenant+collection maps to its own YDB table.
- **Approx search**: coarse‑to‑fine without vector index. Quantized `embedding_u8` for preselect; float `embedding` for refine. Metrics cosine / inner_product / euclidean / manhattan.
- **Vectors**: stored as binary strings using Knn::ToBinaryStringFloat (float) and Knn::ToBinaryStringUint8 (quantized).

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
  - `point_id Utf8` (PK), `embedding String` (binary), `embedding_u8 String` (binary), `payload JsonDocument`

## YDB vector specifics (YQL)
- Approximate search without index (coarse/refine):
  - Coarse: `ORDER BY Knn::<Fn>(embedding_u8, $qbinu8) LIMIT preselect`
  - Refine: `JOIN` candidates, then `ORDER BY Knn::<Fn>(embedding, $qbinf) LIMIT top`
  - Similarity: `CosineSimilarity`, `InnerProductSimilarity` (DESC)
  - Distance: `EuclideanDistance`, `ManhattanDistance` (ASC)
- Serialization:
  - `embedding` via `Untag(Knn::ToBinaryStringFloat($vec), "FloatVector")`
  - `embedding_u8` via `Knn::ToBinaryStringUint8($vec)`

## Project structure (src/)
- `config/env.ts` — loads env (`dotenv/config`), exports `YDB_ENDPOINT`, `YDB_DATABASE`, `PORT`, `LOG_LEVEL`.
- `logging/logger.ts` — pino logger (level from env).
- `utils/tenant.ts` — `sanitizeTenantId`, `sanitizeCollectionName`, `metaKeyFor`, `tableNameFor`.
- `types.ts` — shared types and Zod schemas (CreateCollectionReq, UpsertPointsReq, SearchReq, DeletePointsReq).
- `ydb/client.ts` — ydb-sdk Driver init (CJS interop), `readyOrThrow`, `withSession`, and re‑exports `Types`, `TypedValues`.
- `ydb/schema.ts` — `ensureMetaTable()` (creates `qdr__collections` if missing).
- `repositories/collectionsRepo.ts` — create/get/delete collection metadata and tables.
- `repositories/pointsRepo.ts` — upsert/search/delete points for a collection table.
- `routes/collections.ts` — Express router for collection endpoints; uses `X-Tenant-Id`.
- `routes/points.ts` — Express router for points endpoints; uses `X-Tenant-Id`.
- `server.ts` — builds Express app, mounts routes, health endpoint.
- `index.ts` — bootstrap: ready check, ensure metadata table, start server.

## Conventions & constraints
- Tenancy via `X-Tenant-Id`; table names: `qdr_<tenant>__<collection>`.
- Sanitization keeps only `[a-z0-9_]`, lowercases.
- Vector type `float` (default) or `uint8` (quantized). Dimension enforced per collection.
- Approximate search characteristics: two‑phase coarse/refine; preselect tunable via env `APPROX_PRESELECT`.

## Scoring semantics
- Returned `score` follows Qdrant: higher‑is‑better for Cosine/Dot, lower‑is‑better for Euclid/Manhattan.
- `score_threshold` is applied accordingly (>= for Cosine/Dot; <= for Euclid/Manhattan).

## Request normalization
- Accepts `limit` as alias of `top`; `with_payload` may be boolean/object/array (object/array treated as true).
- Extracts query vector from `vector`, `embedding`, `query.vector`, `query.nearest.vector`, or nested keys.

## Compatibility routes
- PUT `/collections/{collection}/points` → upsert alias
- POST `/collections/{collection}/points/query` → search alias
- PUT `/collections/{collection}/index` → no‑op (compat only)

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
- JSON logs via pino middleware (method, url, tenant, status, ms). Search logs vector len, dimension, metric/type, hits, validation issues.

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
