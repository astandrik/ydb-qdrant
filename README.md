<img src="https://ydb-qdrant.tech/logo.svg" alt="YDB Qdrant logo" height="56"> 

[![Build](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-build.yml?branch=main&label=build)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-tests.yml?branch=main&label=tests)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-tests.yml)
[![Integration Tests](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-integration.yml?branch=main&label=integration%20tests)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-integration.yml)
[![k6 Soak Load Test](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-load-soak.yml?branch=main&label=k6%20soak%20load%20test)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-load-soak.yml)
[![k6 Stress Load Test](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-load-stress.yml?branch=main&label=k6%20stress%20load%20test)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-load-stress.yml)
[![Coverage](https://coveralls.io/repos/github/astandrik/ydb-qdrant/badge.svg?branch=main)](https://coveralls.io/github/astandrik/ydb-qdrant?branch=main)

[![Recall (multi_table)](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astandrik/ydb-qdrant/recall-badges/recall-multi-table.json)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-recall.yml)
[![Recall (one_table)](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astandrik/ydb-qdrant/recall-badges/recall-one-table.json)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-recall.yml)
[![F1 (multi_table)](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astandrik/ydb-qdrant/recall-badges/f1-multi-table.json)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-recall.yml)
[![F1 (one_table)](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astandrik/ydb-qdrant/recall-badges/f1-one-table.json)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-recall.yml)

[![npm version](https://img.shields.io/npm/v/ydb-qdrant.svg)](https://www.npmjs.com/package/ydb-qdrant)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fastandrik%2Fydb--qdrant-blue?logo=docker)](https://github.com/users/astandrik/packages/container/package/ydb-qdrant)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# YDB Qdrant-compatible Service

Qdrant-compatible Node.js/TypeScript **service and npm library** that stores and searches vectors in YDB using single‑phase top‑k with an automatic YDB vector index (`vector_kmeans_tree`) and table‑scan fallback. Topics: ydb, vector-search, qdrant-compatible, nodejs, typescript, express, yql, ann, semantic-search, rag.

Modes:
- **HTTP server**: Qdrant-compatible REST API (`/collections`, `/points/*`) on top of YDB.
- **Node.js package**: programmatic client via `createYdbQdrantClient` for direct YDB-backed vector search without running a separate service.

Promo site: [ydb-qdrant.tech](http://ydb-qdrant.tech)  
Architecture diagrams: [docs page](http://ydb-qdrant.tech/docs/)

## How it works

![Architecture diagram](https://ydb-qdrant.tech/assets/diagram.svg)

## Documentation

- **Vector dimensions and embedding models**: [docs/vector-dimensions.md](docs/vector-dimensions.md)
- **Deployment and Docker options**: [docs/deployment-and-docker.md](docs/deployment-and-docker.md)
- **Architecture, storage layout, and vector indexing**: [docs/architecture-and-storage.md](docs/architecture-and-storage.md)
- **Evaluation, CI, and release process**: [docs/evaluation-and-ci.md](docs/evaluation-and-ci.md)

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
# Collection storage mode (optional; default is multi_table)
export YDB_QDRANT_COLLECTION_STORAGE_MODE=multi_table   # or one_table
# One-table search tuning (one_table mode only)
export YDB_QDRANT_SEARCH_MODE=approximate               # or exact
export YDB_QDRANT_OVERFETCH_MULTIPLIER=10               # candidate multiplier in approximate mode
```

## Use as a Node.js library (npm package)

The package entrypoint exports a programmatic API that mirrors the Qdrant HTTP semantics.

- Import and initialize a client (reuses the same YDB env vars as the server):
  ```ts
  import { createYdbQdrantClient } from "ydb-qdrant";

  async function main() {
    // defaultTenant is optional; defaults to "default"
    const client = await createYdbQdrantClient({
      defaultTenant: "myapp",
      endpoint: "grpcs://lb.etn01g9tcilcon2mrt3h.ydb.mdb.yandexcloud.net:2135",
      database: "/ru-central1/b1ge4v9r1l3h1q4njclp/etn01g9tcilcon2mrt3h",
    });

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
  const client = await createYdbQdrantClient({
    endpoint: "grpcs://lb.etn01g9tcilcon2mrt3h.ydb.mdb.yandexcloud.net:2135",
    database: "/ru-central1/b1ge4v9r1l3h1q4njclp/etn01g9tcilcon2mrt3h",
  });
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
    clientPromise = createYdbQdrantClient({
      defaultTenant: 'myapp',
      endpoint: 'grpcs://lb.etn01g9tcilcon2mrt3h.ydb.mdb.yandexcloud.net:2135',
      database: '/ru-central1/b1ge4v9r1l3h1q4njclp/etn01g9tcilcon2mrt3h',
    });
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

## Recommended Vector Dimensions

For full tables of popular embedding models and their dimensions, see [docs/vector-dimensions.md](docs/vector-dimensions.md).

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

**Option 3: All-in-one local YDB + ydb-qdrant (Docker)**

Run a single container that includes both YDB and ydb-qdrant (no external YDB required):

```bash
docker run -d --name ydb-qdrant-local \
  -p 8080:8080 \
  -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

- HTTP API available at `http://localhost:8080`
- YDB Embedded UI at `http://localhost:8765`
- No credentials or env vars needed for local dev

For detailed configuration and env tuning, see [docs/deployment-and-docker.md](docs/deployment-and-docker.md).

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

### Docker (self-hosted HTTP server)

Published container: [`ghcr.io/astandrik/ydb-qdrant`](https://github.com/users/astandrik/packages/container/package/ydb-qdrant)

Basic example:

```bash
docker run -d --name ydb-qdrant \
  -p 8080:8080 \
  -e YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135 \
  -e YDB_DATABASE=/ru-central1/<cloud>/<db> \
  -e YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json \
  -v /abs/path/sa-key.json:/sa-key.json:ro \
  ghcr.io/astandrik/ydb-qdrant:latest
```

For full deployment options (local builds, all-in-one image, Docker Compose, Apple Silicon notes), see [docs/deployment-and-docker.md](docs/deployment-and-docker.md) — including an optional “Persistence across restarts” example for the `ydb-qdrant-local` image when you want embedded YDB data to survive container restarts.


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

## Architecture and Storage

For details on the YDB storage layout (multi_table vs one_table), vector serialization, vector index auto-build behavior, request normalization, and Qdrant compatibility semantics, see [docs/architecture-and-storage.md](docs/architecture-and-storage.md).

## Evaluation, CI, and Release

Badges at the top of this README link to build, test, integration, and recall/F1 workflows. For a deeper explanation of how recall is measured and how publishing to npm works, see [docs/evaluation-and-ci.md](docs/evaluation-and-ci.md).
