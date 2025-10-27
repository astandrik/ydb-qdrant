# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

