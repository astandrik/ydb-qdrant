## Architecture, Storage Layout, and Search

YDB Qdrant-compatible service is a Node.js/TypeScript service and npm library that stores and searches vectors in YDB using a global one-table layout (`qdrant_all_points`) with exact search over `embedding`.

### Storage Layout

- **One-table layout (current and default)**:
  - Metadata table `qdr__collections` stores per‑collection configuration (`table_name`, `vector_dimension`, `distance`, `vector_type`, `created_at`, `last_accessed_at`, `user_uid`).
  - A single global points table `qdrant_all_points` with `(collection, point_id)` PK, where `collection` is the resolved namespace + collection key.
    - Columns: `collection Utf8`, `point_id Utf8`, `embedding String` (binary float), `payload JsonDocument`, `payload_sign Utf8`, `path_prefix Optional<Utf8>`.
  - A lookup table `qdrant_points_by_file` stores `(collection, file_path, point_id)` for efficient path-based deletes.
    - Table is created with YDB auto-partitioning enabled (by load and by size) using the SDK table profile, with a target partition size of ~100 MB to allow the storage layer to split/merge partitions as load and size change.

### One-table Mode Migrations

This project does not perform automatic schema migrations. Tables are expected to be created with the correct schema from the beginning (including `collection`, `payload_sign`, `path_prefix` in `qdrant_all_points`, `user_uid` in `qdr__collections`, and the `qdrant_points_by_file` lookup table). If an existing deployment uses an older schema, apply a manual migration or recreate the tables before running the service.

### Vector Serialization and Search

- Vectors are serialized with `Knn::ToBinaryStringFloat` for full‑precision `embedding`.
- Searches in one-table mode use the global `qdrant_all_points` table and run exact top‑k over `embedding` with `Knn::<Fn>(embedding, $qbinf)` where the function depends on the distance metric (`CosineDistance`, `InnerProductSimilarity`, `EuclideanDistance`, `ManhattanDistance`).

### Concurrency and Retries

Upserts and deletes are wrapped in a bounded retry helper with exponential backoff to handle transient YDB errors (for example `Aborted` or temporary schema metadata issues).

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
- `PUT /collections/:collection/index` is a no-op (Qdrant compatibility; some tools call this for payload indexes). Vector indexes are not used; search is driven by the global table layout.

### References

- YDB docs (overview): https://ydb.tech/docs/en/
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- ydb-sdk (Node.js): https://github.com/ydb-platform/ydb-nodejs-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
- IR evaluation (precision/recall/F1, MAP, nDCG): https://nlp.stanford.edu/IR-book/pdf/08eval.pdf
