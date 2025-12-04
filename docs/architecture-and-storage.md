## Architecture, Storage Layout, and Vector Indexing

YDB Qdrant-compatible service is a Node.js/TypeScript service and npm library that stores and searches vectors in YDB using single-phase top‑k with an automatic YDB vector index (`vector_kmeans_tree`) and a table‑scan fallback.

### Storage Layout

- **multi_table** (default): one YDB table per collection; metadata is tracked in `qdr__collections`.
- **one_table**: a single global table `qdrant_all_points` with `(uid, point_id)` PK, where `uid` encodes tenant+collection.
  - Columns: `uid Utf8`, `point_id Utf8`, `embedding String` (binary float), `embedding_quantized String` (bit‑quantized), `payload JsonDocument`.

Per‑collection table schema (multi_table):

- `point_id Utf8` (PK)
- `embedding String` (binary)
- `payload JsonDocument`

### One-table Mode Migrations

In `one_table` mode, automatic schema/backfill steps for `qdrant_all_points` are disabled by default. To opt in, set:

- `YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true`

after backing up data; otherwise the service will error if the `embedding_quantized` column is missing and needs to be added (for example via `ALTER TABLE qdrant_all_points RENAME COLUMN embedding_bit TO embedding_quantized`).

### Vector Serialization and Index

- Vectors are serialized with `Knn::ToBinaryStringFloat`.
- Search uses a single-phase top‑k over `embedding` with automatic YDB vector index `emb_idx` when available; it falls back to a table scan if the index is missing.

Vector index auto-build (multi_table mode only):

- After ≥100 points upserted + 5s quiet window, a `vector_kmeans_tree` index (levels=1, clusters=128) is built automatically.
- Incremental updates (<100 points) skip index rebuild.

In `one_table` mode, vector indexes are not supported; searches use a two‑phase approximate+exact flow over `qdrant_all_points`:

1. Bit‑quantized candidates via `embedding_quantized` using `CosineSimilarity` DESC for Cosine, `EuclideanDistance`/`ManhattanDistance` ASC for Euclid/Manhattan.
2. Exact re‑ranking over `embedding` with `CosineDistance` ASC for Cosine, `InnerProductSimilarity` DESC for Dot, distance ASC for Euclid/Manhattan.

For Dot metric, phase 1 uses `CosineDistance` ASC as a proxy since there is no direct distance equivalent for inner product on bit vectors.

### Concurrency and Retries

During index rebuilds, YDB may return transient `Aborted`/schema metadata errors. Upserts include bounded retries with backoff to handle this automatically.

Filters are not yet modeled; they can be added if needed.

### Scoring Semantics

- Returned `score`:
  - Cosine: **similarity-like** (higher is better; derived approximately as `1 - Knn::CosineDistance` while preserving ranking).
  - Dot: **similarity** (higher is better; `Knn::InnerProductSimilarity`).
  - Euclid/Manhattan: **distance** (lower is better).
- `score_threshold` behavior:
  - Cosine: treated as **minimum similarity** in \[0, 1\] (UI/IDE-friendly) and applied directly as `score >= threshold`.
  - Dot: treated as **minimum similarity**; applied as `score >= threshold`.
  - Euclid/Manhattan: treated as **maximum distance**; applied as `score <= threshold`.

### Request Normalization (Qdrant-compatible)

- Accepts `limit` as alias of `top`.
- Accepts `with_payload` as boolean/object/array (object/array treated as `true`).
- Extracts query vector from common shapes: `vector`, `embedding`, `query.vector`, `query.nearest.vector`, or nested keys.

### Qdrant Compatibility Scope

This service implements a minimal subset expected by common tooling:

- Create/get/delete collection
- Upsert points
- Top‑k search with optional payload
- Delete points

Compatibility notes:

- Accepts `PUT /collections/:collection/points` as an alias of upsert.
- Accepts `POST /collections/:collection/points/query` as an alias of search.
- Accepts `limit` as an alias of `top`; honors `score_threshold`.
- Search response shape: `{ status: "ok", result: { points: [{ id, score, payload? }] } }`.
- `PUT /collections/:collection/index` is a no-op (Qdrant compatibility; some tools call this for payload indexes). The YDB vector index (`emb_idx`) is built automatically after ≥100 points are upserted + 5-second quiet window. Incremental updates (<100 points) skip rebuild.

### References

- YDB docs (overview): https://ydb.tech/docs/en/
- YDB vector indexes (vector_kmeans_tree): https://ydb.tech/docs/en/dev/vector-indexes
- YDB VIEW syntax for indexes: https://ydb.tech/docs/en/yql/reference/syntax/select/secondary_index
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- ydb-sdk (Node.js): https://github.com/ydb-platform/ydb-nodejs-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
- IR evaluation (precision/recall/F1, MAP, nDCG): https://nlp.stanford.edu/IR-book/pdf/08eval.pdf


