# Search Mode Implementation Plan

## Overview

This document outlines the proposed changes to implement two search scenarios for the `one_table` storage mode: **Normal (Exact)** and **Approximate (Bit Quantization)**.

## Background

The current implementation uses a two-phase search approach in `one_table` mode. The proposal introduces a switchable parameter to choose between:
1. **Normal mode**: Direct exact search (strict consistency, immediate updates)
2. **Approximate mode**: Two-phase search with bit quantization (faster for large datasets)

Vector indexes are deferred to YDB 25-4 release when:
- Indexes become updateable
- Index performance improves
- Atomic rebuild/replace becomes feasible

## Proposed SQL Queries

### Normal (Exact) Scenario

```sql
DECLARE $Embedding as String;
DECLARE $uid as Uint64;
DECLARE $K as Uint64;

SELECT point_id FROM qdrant_all_points
WHERE uid = $uid
ORDER BY Knn::CosineDistance(embedding, $Embedding)
LIMIT $K
```

### Approximate Scenario (Two-Phase with Bit Quantization)

```sql
DECLARE $Embedding as String;
DECLARE $uid as Uint64;
DECLARE $K as Uint64;
DECLARE $KMulti as Uint64;

$TargetFloat = $Embedding;
$TargetBit = Knn::ToBinaryStringBit(Knn::FloatFromBinaryString($Embedding));

$Points = (
    SELECT point_id
    FROM qdrant_all_points
    WHERE uid = $uid
    ORDER BY Knn::CosineDistance(embedding_quantized, $TargetBit)
    LIMIT $K * $KMulti
);

SELECT point_id AS id
FROM qdrant_all_points
WHERE uid = $uid AND point_id IN $Points
ORDER BY Knn::CosineDistance(embedding, $TargetFloat)
LIMIT $K;
```

## Key Differences from Current Implementation

| Aspect | Current (`AGENTS.md`) | Proposed |
|--------|----------------------|----------|
| Column name | `embedding_bit` | `embedding_quantized` |
| UID type | `Utf8` | `Uint64` |
| Over-fetch multiplier | Not parameterized | `$KMulti` parameter |
| Search mode selection | Not switchable | Parameter-controlled |
| Vector index | Not used in one_table | Deferred to YDB 25-4 |

## Data Model

### Table Schema

```sql
CREATE TABLE qdrant_all_points (
    uid                 Uint64,
    point_id            Utf8,
    embedding           String,           -- binary float vector
    embedding_quantized String,           -- bit-quantized vector
    payload             JsonDocument,
    PRIMARY KEY(uid, point_id)
) 
WITH (
    AUTO_PARTITIONING_BY_SIZE = ENABLED,
    AUTO_PARTITIONING_PARTITION_SIZE_MB = 1000,
    AUTO_PARTITIONING_BY_LOAD = ENABLED,
    READ_REPLICAS_SETTINGS = 'PER_AZ:3'
)
```

## Vector Serialization

### Two Approaches: Client-side vs Server-side Conversion

According to YDB documentation, there are two ways to pass vectors for INSERT/UPSERT/SELECT:

#### Approach 1: Client-side Serialization (Recommended)

**Pros:**
- Better performance (no server-side conversion overhead)
- Reduced CPU load on YDB cluster
- Vector arrives ready-to-store

**Implementation:**
```typescript
// Node.js: Serialize vector to binary format
function convertVectorToBytes(vector: number[]): Buffer {
  // Allocate buffer: 4 bytes per float + 1 byte for type marker
  const buffer = Buffer.alloc(vector.length * 4 + 1);
  
  // Write floats in little-endian format
  vector.forEach((value, index) => {
    buffer.writeFloatLE(value, index * 4);
  });
  
  // Write type marker (1 = Float)
  buffer.writeUInt8(1, vector.length * 4);
  
  return buffer;
}

// Bit quantization for approximate search
function convertVectorToBitBytes(vector: number[]): Buffer {
  const byteCount = Math.ceil(vector.length / 8);
  const buffer = Buffer.alloc(byteCount + 1);
  
  // Pack bits: value > 0 → 1, otherwise → 0
  for (let i = 0; i < vector.length; i++) {
    if (vector[i] > 0) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      buffer[byteIndex] |= (1 << bitIndex);
    }
  }
  
  // Write type marker (10 = Bit)
  buffer.writeUInt8(10, byteCount);
  
  return buffer;
}
```

**YQL Query (vector passed as String):**
```sql
DECLARE $embedding AS String;

UPSERT INTO table (id, embedding)
SELECT id, embedding FROM AS_TABLE($items);

-- Search
SELECT point_id FROM table
ORDER BY Knn::CosineDistance(embedding, $embedding)
LIMIT $K;
```

#### Approach 2: Server-side Conversion (Alternative)

**Pros:**
- Simpler client code (just pass array of floats)
- No need to implement binary serialization

**Cons:**
- Server performs conversion for every operation
- Higher latency and CPU usage on large batches

**YQL Query (vector passed as List<Float>):**
```sql
DECLARE $embedding AS List<Float>;

-- Server converts to binary format
$target = Knn::ToBinaryStringFloat($embedding);

UPSERT INTO table (id, embedding)
SELECT id, Untag(Knn::ToBinaryStringFloat(embedding), "FloatVector")
FROM AS_TABLE($items);

-- Search
SELECT point_id FROM table
ORDER BY Knn::CosineDistance(embedding, $target)
LIMIT $K;
```

### Binary Format Specification

Vectors are stored as binary strings with the following format (from [knn-serializer.h](https://github.com/ydb-platform/ydb/blob/main/ydb/library/yql/udfs/common/knn/knn-serializer.h)):

| Component | Description |
|-----------|-------------|
| Main part | Contiguous array of elements (little-endian for floats) |
| Type marker | 1 byte at the end specifying data type |

**Type markers** (from [knn-defines.h](https://github.com/ydb-platform/ydb/blob/main/ydb/library/yql/udfs/common/knn/knn-defines.h)):

| Value | Type | Bytes per element |
|-------|------|-------------------|
| `1` | Float | 4 bytes |
| `2` | Uint8 | 1 byte |
| `3` | Int8 | 1 byte |
| `10` | Bit | 1 bit (packed, 8 elements per byte) |

**Example:** A vector of 5 Float elements = 4×5 + 1 = 21 bytes.

### Bit Quantization Details

The `ToBinaryStringBit` function performs binary quantization:
- Coordinates > 0 → `1`
- Coordinates ≤ 0 → `0`

This reduces storage by 32× compared to Float vectors and enables faster approximate search at the cost of some accuracy.

### Recommendation for ydb-qdrant

Based on YDB documentation recommendation:

> "В YDB таблицах же вектора хранятся в виде сериализованной последовательности байт. Конвертацию в такое представление **рекомендуется выполнять на клиенте**."

We should:
1. **Implement client-side serialization** in Node.js for both Float and Bit vectors
2. **Pass vectors as `String`** (not `List<Float>`) to YQL queries
3. **Benchmark both approaches** with realistic workloads to confirm performance difference

## Implementation Tasks

### Phase 1: Schema Updates

1. **Column rename**: `embedding_bit` → `embedding_quantized`
   - Update `pointsRepo.one-table.ts`
   - Update `AGENTS.md` documentation
   - Migration script for existing data

2. **UID type consideration**: `Utf8` → `Uint64`
   - Evaluate migration complexity
   - Consider keeping `Utf8` for backward compatibility
   - Update type declarations if changing

### Phase 2: Search Mode Parameter

3. **Add search mode configuration**:
   - New env variable: `YDB_QDRANT_SEARCH_MODE` = `"exact"` | `"approximate"`
   - Update `config/env.ts` with new enum
   - Default: `"approximate"` for one_table mode

4. **Add over-fetch multiplier configuration**:
   - New env variable: `YDB_QDRANT_OVERFETCH_MULTIPLIER` (default: `10`)
   - Used as `$KMulti` in approximate mode

### Phase 3: Repository Layer Changes

5. **Update `pointsRepo.one-table.ts`**:
   - Implement `searchExact()` function
   - Implement `searchApproximate()` function
   - Add mode selection logic in `searchPoints()`

6. **Update `pointsRepo.ts` facade**:
   - Pass search mode to one-table implementation
   - Ensure multi-table mode is unaffected

### Phase 4: Binary Serialization Optimization

7. **Add Node.js vector serialization utility**:
   - Create `src/utils/vectorBinary.ts`
   - Implement `vectorToFloatBinary(vector: number[]): Buffer`
   - Implement `vectorToBitBinary(vector: number[]): Buffer`

8. **Update upsert logic**:
   - Pre-serialize float vectors in Node.js
   - Compute and store `embedding_quantized` during upsert
   - Update YQL queries to accept pre-serialized data

### Phase 5: Testing

9. **Unit tests**:
   - Test vector serialization utilities
   - Test search mode selection logic

10. **Integration tests**:
    - Test exact search mode
    - Test approximate search mode
    - Compare recall between modes
    - Performance benchmarks

### Phase 6: Documentation

11. **Update documentation**:
    - `AGENTS.md`: New configuration options, data model changes
    - `docs/architecture-and-storage.md`: Search mode details
    - `README.md`: Configuration examples

## Configuration Summary

| Environment Variable | Values | Default | Description |
|---------------------|--------|---------|-------------|
| `YDB_QDRANT_SEARCH_MODE` | `exact`, `approximate` | `approximate` | Search algorithm selection |
| `YDB_QDRANT_OVERFETCH_MULTIPLIER` | integer | `10` | Candidate multiplier for approximate mode |

## Migration Considerations

### Backward Compatibility

- Existing `embedding_bit` column should be aliased or renamed
- UID type change requires careful migration if implemented
- Default search mode should maintain current behavior

### Data Migration

For existing `one_table` deployments:

```sql
-- Rename column (if needed)
ALTER TABLE qdrant_all_points RENAME COLUMN embedding_bit TO embedding_quantized;

-- Or update with new quantized values
UPDATE qdrant_all_points 
SET embedding_quantized = Unwrap(Untag(
    Knn::ToBinaryStringBit(Knn::FloatFromBinaryString(embedding)), 
    "BitVector"
))
WHERE uid = <uid>;
```

## Future Considerations (YDB 25-4)

When YDB 25-4 is available, consider:

1. **Vector index creation**:
```sql
ALTER TABLE qdrant_all_points
  ADD INDEX index_emb
  GLOBAL USING vector_kmeans_tree
  ON (uid, embedding)
  WITH (distance=cosine, vector_type="float", vector_dimension=3072, levels=1, clusters=250);
```

2. **Index-based search** as a third mode option
3. **Automatic index management** based on collection size

## References

- [YDB Vector Functions](https://ydb.tech/docs/en/yql/reference/functions/)
- [YDB KNN Serialization](https://github.com/ydb-platform/ydb/blob/main/ydb/library/yql/udfs/common/knn/knn-serializer.h)
- [AGENTS.md](../AGENTS.md) - Project documentation