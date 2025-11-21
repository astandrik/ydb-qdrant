<img src="https://ydb-qdrant.tech/logo.svg" alt="YDB Qdrant logo" height="56"> 

[![CI](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-ydb-qdrant.yml/badge.svg)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-ydb-qdrant.yml)
[![npm version](https://img.shields.io/npm/v/ydb-qdrant.svg)](https://www.npmjs.com/package/ydb-qdrant)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

# YDB Qdrant-compatible Service

Qdrant-compatible Node.js/TypeScript **service and npm library** that stores and searches vectors in YDB using single‑phase top‑k with an automatic YDB vector index (`vector_kmeans_tree`) and table‑scan fallback. Topics: ydb, vector-search, qdrant-compatible, nodejs, typescript, express, yql, ann, semantic-search, rag.

Modes:
- **HTTP server**: Qdrant-compatible REST API (`/collections`, `/points/*`) on top of YDB.
- **Node.js package**: programmatic client via `createYdbQdrantClient` for direct YDB-backed vector search without running a separate service.

Promo site: [ydb-qdrant.tech](http://ydb-qdrant.tech)  
Architecture diagrams: [docs page](http://ydb-qdrant.tech/docs/)

## How it works

![Architecture diagram](https://ydb-qdrant.tech/assets/diagram.svg)

## Requirements
- Node.js 18+
- A YDB endpoint and database path
- One of the supported auth methods (via environment)

## Install

As a dependency in another project (npm package):
```bash
npm install ydb-qdrant
```

For local development of this repo:
```bash
npm install
```

## Configure credentials
The server uses `getCredentialsFromEnv()` and supports these env vars (first match wins):

- Service account key file (recommended)
  ```bash
  export YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/abs/path/sa-key.json
  ```
  The JSON must contain: `service_account_id`, `id`, `private_key`.

- Metadata service (Yandex Cloud VM/Functions)
  ```bash
  export YDB_METADATA_CREDENTIALS=1
  ```

- Static IAM token (short‑lived)
  ```bash
  export YDB_ACCESS_TOKEN_CREDENTIALS=$(yc iam create-token)
  ```

- Anonymous (local/dev only)
  ```bash
  export YDB_ANONYMOUS_CREDENTIALS=1
  ```

Also set endpoint and database:
```bash
export YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
export YDB_DATABASE=/ru-central1/<cloud>/<db>
```

Optional env:
```bash
# Server
export PORT=8080
export LOG_LEVEL=info
```

## Use as a Node.js library (npm package)

The package entrypoint exports a programmatic API that mirrors the Qdrant HTTP semantics.

- Import and initialize a client (reuses the same YDB env vars as the server):
  ```ts
  import { createYdbQdrantClient } from "ydb-qdrant";

  async function main() {
    // defaultTenant is optional; defaults to "default"
    const client = await createYdbQdrantClient({ defaultTenant: "myapp" });

    await client.createCollection("documents", {
      vectors: {
        size: 1536,
        distance: "Cosine",
        data_type: "float",
      },
    });

    await client.upsertPoints("documents", {
      points: [
        { id: "doc-1", vector: [/* embedding */], payload: { title: "Doc 1" } },
      ],
    });

    const result = await client.searchPoints("documents", {
      vector: [/* query embedding */],
      top: 10,
      with_payload: true,
    });

    console.log(result.points);
  }
  ```

- Multi-tenant usage with `forTenant`:
  ```ts
  const client = await createYdbQdrantClient();
  const tenantClient = client.forTenant("tenant-a");

  await tenantClient.upsertPoints("sessions", {
    points: [{ id: "s1", vector: [/* ... */] }],
  });
  ```

The request/response shapes follow the same schemas as the HTTP API (`CreateCollectionReq`, `UpsertPointsReq`, `SearchReq`, `DeletePointsReq`), so code written against the REST API can usually be translated directly to the library calls.

### Example: in-process points search with a shared client

In a typical server application you create a single `ydb-qdrant` client once and reuse it across requests. Then you can perform vector search (points search) directly in your business logic:

```ts
import {createYdbQdrantClient} from 'ydb-qdrant';

let clientPromise: ReturnType<typeof createYdbQdrantClient> | null = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = createYdbQdrantClient({defaultTenant: 'myapp'});
  }
  return clientPromise;
}

export async function searchDocuments(collection: string, queryEmbedding: number[], top: number) {
  const client = await getClient();

  const result = await client.searchPoints(collection, {
    vector: queryEmbedding,
    top,
    with_payload: true,
  });

  return result.points ?? [];
}
```

This pattern avoids running a separate HTTP service: vector search is executed directly against YDB via the shared `createYdbQdrantClient` instance, while the rest of your code works with plain TypeScript functions.

## Quick Start

### Use with IDE agents (Roo Code, Cline)

**Option 1: Public Demo (No setup required)**
- Set Qdrant URL to `http://ydb-qdrant.tech:8080`
- No API key needed
- Free to use for testing and development
- Shared instance - use `X-Tenant-Id` header for isolation

**Option 2: Self-hosted (Local)**
- Set Qdrant URL to `http://localhost:8080`
- API key optional (not enforced)
- Full control and privacy

### cURL smoke test (Self-hosted)
```bash
# 1) Install & run
npm install
npm run dev

# 2) Create a collection (384-d Cosine floats)
curl -X PUT http://localhost:8080/collections/mycol \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": { "size": 384, "distance": "Cosine", "data_type": "float" }
  }'

# 3) Upsert points
curl -X POST http://localhost:8080/collections/mycol/points/upsert \
  -H 'Content-Type: application/json' \
  -d '{
    "points": [
      {"id": "1", "vector": [0.1,0.2, ... 384 vals ...], "payload": {"repo":"demo"}}
    ]
  }'

# 4) Semantic search (query)
curl -X POST http://localhost:8080/collections/mycol/points/query \
  -H 'Content-Type: application/json' \
  -d '{
    "vector": [0.1,0.2, ... 384 vals ...],
    "limit": 5,
    "with_payload": true,
    "score_threshold": 0.4
  }'
```

## Run
```bash
npm run build
npm start
# or during development
npm run dev
```

Health check:
```bash
curl -s http://localhost:8080/health
```

## API Reference

Create collection (PUT /collections/{collection}):
```bash
curl -X PUT http://localhost:8080/collections/mycol \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": {
      "size": 384,
      "distance": "Cosine",
      "data_type": "float"
    }
  }'
```

Upsert points (POST /collections/{collection}/points/upsert):
```bash
curl -X POST http://localhost:8080/collections/mycol/points/upsert \
  -H 'Content-Type: application/json' \
  -d '{
    "points": [
      {"id": "1", "vector": [0.1,0.2, ... 384 vals ...], "payload": {"repo":"demo"}}
    ]
  }'
```

Search (POST /collections/{collection}/points/search):
```bash
curl -X POST http://localhost:8080/collections/mycol/points/search \
  -H 'Content-Type: application/json' \
  -d '{
    "vector": [0.1,0.2, ... 384 vals ...],
    "top": 10,
    "with_payload": true
  }'
```

Delete points (POST /collections/{collection}/points/delete):
```bash
curl -X POST http://localhost:8080/collections/mycol/points/delete \
  -H 'Content-Type: application/json' \
  -d '{"points": ["1"]}'
```

## Notes
- One YDB table is created per collection; metadata is tracked in table `qdr__collections`.
- Each collection table schema: `point_id Utf8` (PK), `embedding String` (binary), `payload JsonDocument`.
- Vectors are serialized with `Knn::ToBinaryStringFloat` (or `Knn::ToBinaryStringUint8` if collection uses uint8).
- Search uses a single-phase top‑k over `embedding` with automatic YDB vector index (`emb_idx`) when available; falls back to table scan if missing.
- **Vector index auto-build**: After ≥100 points upserted + 5s quiet window, a `vector_kmeans_tree` index (levels=1, clusters=128) is built automatically. Incremental updates (<100 points) skip index rebuild.
- **Concurrency**: During index rebuilds, YDB may return transient `Aborted`/schema metadata errors. Upserts include bounded retries with backoff to handle this automatically.
- Filters are not yet modeled; can be added if needed.

## Scoring semantics
- Cosine/Dot: higher score is better; `score_threshold` filters with `>=`.
- Euclid/Manhattan: lower score is better; `score_threshold` filters with `<=`.

## Request normalization (Qdrant-compatible)
- Accepts `limit` as alias of `top`.
- Accepts `with_payload` as boolean/object/array (object/array treated as `true`).
- Extracts query vector from common shapes: `vector`, `embedding`, `query.vector`, `query.nearest.vector`, or nested keys.

## Qdrant compatibility scope
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
- `PUT /collections/:collection/index` is a no-op (Qdrant compatibility; Roo Code calls this for payload indexes). The YDB vector index (`emb_idx`) is built automatically after ≥100 points are upserted + 5-second quiet window. Incremental updates (<100 points) skip rebuild.

For broader Qdrant API coverage, extend routes in `src/routes/*`.

## Releasing & publishing (maintainers)

- **Versioning**
  - Use semantic versioning as described in the npm docs.
  - From `ydb-qdrant/`, run `npm version patch|minor|major` to bump the version and create a git tag (for example, `ydb-qdrant-v0.2.0`).
- **Manual publish**
  - Ensure you are logged in to npm (`npm whoami`).
  - From `ydb-qdrant/`, run:
    - `npm publish`  
    This will run tests and build via the `prepublishOnly` script before uploading the tarball.
- **CI publish**
  - GitHub Actions workflow `.github/workflows/publish-ydb-qdrant.yml` publishes on tags matching `ydb-qdrant-v*`.
  - Configure the `NPM_TOKEN` secret in the repository; the workflow runs `npm ci`, `npm test`, `npm run build`, and `npm publish`.

## References
- YDB docs (overview): https://ydb.tech/docs/en/
- YDB vector indexes (vector_kmeans_tree): https://ydb.tech/docs/en/dev/vector-indexes
- YDB VIEW syntax for indexes: https://ydb.tech/docs/en/yql/reference/syntax/select/secondary_index
- YQL getting started: https://ydb.tech/docs/en/getting_started/yql/
- YQL reference (syntax, functions): https://ydb.tech/docs/en/yql/reference/
- YQL functions index: https://ydb.tech/docs/en/yql/reference/functions/
- ydb-sdk (Node.js): https://github.com/ydb-platform/ydb-nodejs-sdk
- YDB Cloud (endpoints, auth): https://cloud.yandex.com/en/docs/ydb/
