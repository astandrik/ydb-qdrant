# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.2.1](https://github.com/astandrik/ydb-qdrant/compare/v2.2.0...v2.2.1) (2025-11-23)


### Bug Fixes

* docker badge and compose fix ([#28](https://github.com/astandrik/ydb-qdrant/issues/28)) ([f46dd97](https://github.com/astandrik/ydb-qdrant/commit/f46dd9714114a29095a6ed711bc3c1b1a281c969))
* use actual badges ([#38](https://github.com/astandrik/ydb-qdrant/issues/38)) ([7a94470](https://github.com/astandrik/ydb-qdrant/commit/7a94470cf517326327d70b1866344aa0b99480ff))

## [2.2.0](https://github.com/astandrik/ydb-qdrant/compare/v2.1.4...v2.2.0) (2025-11-23)


### Features

* add docker and docker-compose ([#26](https://github.com/astandrik/ydb-qdrant/issues/26)) ([819383f](https://github.com/astandrik/ydb-qdrant/commit/819383f2fb5349fae906de5ee8133200050a0481))

## [2.1.4](https://github.com/astandrik/ydb-qdrant/compare/v2.1.3...v2.1.4) (2025-11-20)


### Bug Fixes

* release ([#19](https://github.com/astandrik/ydb-qdrant/issues/19)) ([ad6e650](https://github.com/astandrik/ydb-qdrant/commit/ad6e6508de2ef6bf0eb3ad3a4f795e5f47052592))

## [2.1.3](https://github.com/astandrik/ydb-qdrant/compare/v2.1.2...v2.1.3) (2025-11-20)


### Bug Fixes

* release ([#17](https://github.com/astandrik/ydb-qdrant/issues/17)) ([72382aa](https://github.com/astandrik/ydb-qdrant/commit/72382aaf2560dab7bb8663e7326d17b6bfd52bae))

## [2.1.2](https://github.com/astandrik/ydb-qdrant/compare/v2.1.1...v2.1.2) (2025-11-20)


### Bug Fixes

* release ([#15](https://github.com/astandrik/ydb-qdrant/issues/15)) ([12f4b05](https://github.com/astandrik/ydb-qdrant/commit/12f4b05ec1c51c3427f262286187fb1537f67efd))

## [0.1.0] - 2025-10-27

### Added
- Automatic YDB vector index (`emb_idx`) creation after bulk upserts (≥100 points threshold)
- Deferred index scheduler with 5-second quiet window after last upsert
- Vector index support using `vector_kmeans_tree` (levels=1, clusters=128 for <100k vectors)
- Automatic fallback to table scan when vector index is not present
- `buildVectorIndex()` in `collectionsRepo` with DROP-then-ADD pattern for rebuilds
- Point count tracking in index scheduler to skip small incremental updates
- Idempotent collection creation: PUT /collections/{collection} checks if collection exists before creating

### Changed
- Table schema simplified to single `embedding String` (binary) column (removed `embedding_u8`)
- Search query now uses `VIEW emb_idx` to leverage vector index when available
- PUT `/collections/:collection/index` is now a no-op (Qdrant compatibility for payload indexes)
- Upsert batch tracking moved to end of batch (single `notifyUpsert` call per request)
- Search uses single-phase top-k query over `embedding` (no coarse/refine)

### Fixed
- Vector index rebuild error handling (drop existing index before recreating)
- Graceful fallback when vector index is missing or dropped
- Index scheduler no longer triggers on collection creation (only after actual upserts)
- Upserts now retry on transient `Aborted`/schema metadata errors during index rebuild with bounded backoff

## Implementation Details

### Vector Index Behavior
- **Threshold**: Index builds only if ≥100 points upserted since last build
- **Timing**: 5 seconds after last upsert (quiet window)
- **Parameters**: 
  - `levels=1`, `clusters=128` (optimized for <100k vectors)
  - `distance` or `similarity` from collection metadata
  - `vector_type` and `vector_dimension` from collection metadata
- **Rebuild strategy**: DROP INDEX → ADD INDEX on each build
- **Search**: tries VIEW emb_idx first; falls back to table scan if index missing

### Incremental Updates
- Small updates (<100 points) skip index rebuild
- Logs "index build skipped (below threshold)" with point count
- Counter resets after successful build

### Files Modified
- `src/repositories/collectionsRepo.ts` - schema, buildVectorIndex
- `src/repositories/pointsRepo.ts` - upsert notify, search VIEW fallback, upsert retry-on-abort
- `src/routes/collections.ts` - /index endpoint no-op
- `src/routes/points.ts` - requestIndexBuild calls
- `src/indexing/IndexScheduler.ts` - threshold logic, point counting
- `README.md` - documentation updates
- `AGENTS.md` - documentation updates
