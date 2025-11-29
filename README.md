<img src="https://ydb-qdrant.tech/logo.svg" alt="YDB Qdrant logo" height="56"> 

[![Build](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-build.yml?branch=main&label=build)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-tests.yml?branch=main&label=tests)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-tests.yml)
[![Integration Tests](https://img.shields.io/github/actions/workflow/status/astandrik/ydb-qdrant/ci-integration.yml?branch=main&label=integration%20tests)](https://github.com/astandrik/ydb-qdrant/actions/workflows/ci-integration.yml)
[![Coverage](https://coveralls.io/repos/github/astandrik/ydb-qdrant/badge.svg?branch=main)](https://coveralls.io/github/astandrik/ydb-qdrant?branch=main)
[![npm version](https://img.shields.io/npm/v/ydb-qdrant.svg)](https://www.npmjs.com/package/ydb-qdrant)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fastandrik%2Fydb--qdrant-blue?logo=docker)](https://github.com/users/astandrik/packages/container/package/ydb-qdrant)
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
# Collection storage mode (optional; default is multi_table)
export YDB_QDRANT_COLLECTION_STORAGE_MODE=multi_table   # or one_table
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

When creating a collection, you must specify the vector `size` matching your embedding model. Below are popular models with their dimensions and typical use cases:

### Commercial API Models

| Provider | Model | Dimensions | Use Cases |
|----------|-------|------------|-----------|
| **OpenAI** | `text-embedding-3-small` | 1536 (default, can reduce to 256-1536) | RAG, semantic search, general-purpose embeddings |
| **OpenAI** | `text-embedding-3-large` | 3072 (default, can reduce to 256, 512, 1024, 1536, 3072) | High-accuracy RAG, multilingual tasks |
| **OpenAI** | `text-embedding-ada-002` | 1536 | Legacy model, widely adopted |
| **OpenAI** (Legacy) | `text-search-curie-doc-001` | 4096 | Legacy GPT-3 model, deprecated |
| **OpenAI** (Legacy) | `text-search-davinci-doc-001` | 12288 | Legacy GPT-3 model, deprecated |
| **Cohere** | `embed-v4.0` | 256, 512, 1024, 1536 (default) | Multimodal (text + image), RAG, enterprise search |
| **Cohere** | `embed-english-v3.0` | 1024 | English text, semantic search, classification |
| **Cohere** | `embed-multilingual-v3.0` | 1024 | 100+ languages, long-document retrieval, clustering |
| **Google** | `gemini-embedding-001` | 3072 (configurable) | Multilingual, general-purpose, RAG |
| **Google** | `text-embedding-004` | 768 | General-purpose text embeddings |
| **Google** | `text-embedding-005` | 768 | Improved version of text-embedding-004 |
| **Google** | `text-multilingual-embedding-002` | 768 | Multilingual text embeddings |

### Open-Source Models (HuggingFace)

| Model | Dimensions | Use Cases |
|-------|------------|-----------|
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | Fast semantic search, low-resource environments |
| `BAAI/bge-base-en-v1.5` | 768 | RAG, retrieval, English text |
| `BAAI/bge-large-en-v1.5` | 1024 | High-accuracy RAG, English text |
| `BAAI/bge-m3` | 1024 | Multilingual, dense/sparse/multi-vector |
| `intfloat/e5-base-v2` | 768 | General retrieval, English text |
| `intfloat/e5-large-v2` | 1024 | High-accuracy retrieval, English text |
| `intfloat/e5-mistral-7b-instruct` | 4096 | High-dimensional embeddings, advanced RAG |
| `nomic-ai/nomic-embed-text-v1` | 768 | General-purpose, open weights |

### Choosing Dimensions

- **Higher dimensions (1024-4096)**: Better semantic fidelity, higher storage/compute costs
- **Lower dimensions (384-768)**: Faster queries, lower costs, suitable for many use cases
- **Variable dimensions**: Some models (OpenAI v3, Cohere v4) allow dimension reduction with minimal accuracy loss
- **Legacy models**: Older OpenAI GPT-3 models (Curie: 4096, Davinci: 12288) are deprecated but may still be in use

**References:**
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Cohere Embed Models](https://docs.cohere.com/docs/cohere-embed)
- [Google Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [HuggingFace Sentence Transformers](https://huggingface.co/sentence-transformers)

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

### Docker (self-hosted HTTP server)

Published container: [`ghcr.io/astandrik/ydb-qdrant`](https://github.com/users/astandrik/packages/container/package/ydb-qdrant)

**Option A – pull the published image (recommended)**

```bash
docker pull ghcr.io/astandrik/ydb-qdrant:latest

docker run -d --name ydb-qdrant \
  -p 8080:8080 \
  -e YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135 \
  -e YDB_DATABASE=/ru-central1/<cloud>/<db> \
  -e YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json \
  -v /abs/path/sa-key.json:/sa-key.json:ro \
  ghcr.io/astandrik/ydb-qdrant:latest
```

**Option B – build the image locally**

From the `ydb-qdrant/` directory:

```bash
docker build -t ydb-qdrant:latest .

docker run -d --name ydb-qdrant \
  -p 8080:8080 \
  -e YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135 \
  -e YDB_DATABASE=/ru-central1/<cloud>/<db> \
  -e YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS=/sa-key.json \
  -v /abs/path/sa-key.json:/sa-key.json:ro \
  ydb-qdrant:latest
```

#### Docker (all-in-one: local YDB + ydb-qdrant)

For a single-container local dev/demo setup with both YDB and ydb-qdrant inside:

```bash
docker pull ghcr.io/astandrik/ydb-qdrant-local:latest

docker run -d --name ydb-qdrant-local \
  -p 8080:8080 \
  -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

Key env vars (all optional; the image provides sensible defaults, override only when you need custom tuning):

- YDB / local YDB:
  - `YDB_LOCAL_GRPC_PORT` (default `2136`): internal YDB gRPC port; used to derive `YDB_ENDPOINT=grpc://localhost:<port>` when not set.
  - `YDB_LOCAL_MON_PORT` (default `8765`): internal YDB Embedded UI HTTP port.
  - `YDB_DATABASE` (default `/local`).
  - `YDB_ANONYMOUS_CREDENTIALS` (default `1` inside this image).
  - `YDB_USE_IN_MEMORY_PDISKS` (default `0`, values `0`/`1`): store data in RAM only when `1` (fast, non-persistent).
  - `YDB_LOCAL_SURVIVE_RESTART` (default `0`, values `0`/`1`): control persistence across restarts when using a mounted data volume.
  - `YDB_DEFAULT_LOG_LEVEL`, `YDB_FEATURE_FLAGS`, `YDB_ENABLE_COLUMN_TABLES`, `YDB_KAFKA_PROXY_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` – passed through to YDB as in the official `local-ydb` image.

- ydb-qdrant:
  - `PORT` (default `8080`): HTTP port inside the container.
  - `LOG_LEVEL` (default `info`).
  - `VECTOR_INDEX_BUILD_ENABLED`.
  - `YDB_QDRANT_COLLECTION_STORAGE_MODE` / `YDB_QDRANT_TABLE_LAYOUT` (`multi_table` or `one_table`).
  - `YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE`.

You can still override `YDB_ENDPOINT`/`YDB_DATABASE` to point ydb-qdrant at an external YDB; in that case the embedded local YDB startup is skipped.

#### Apple Silicon (Mac) notes

The `ydb-qdrant-local` image is built on top of the `local-ydb` Docker image, which is x86_64/amd64-only. On Apple Silicon (M1/M2/M3) you need to run it under x86_64/amd64 emulation:

- Enable Rosetta (x86_64/amd64 emulation) in your Docker backend:
  - Docker Desktop: enable Rosetta to run x86_64/amd64 containers.
  - Or use Colima as in the YDB docs:
    - `colima start --arch aarch64 --vm-type=vz --vz-rosetta`
- When running the container, force the amd64 platform explicitly:

```bash
docker run --platform linux/amd64 -d --name ydb-qdrant-local \
  -p 8080:8080 -p 8765:8765 \
  ghcr.io/astandrik/ydb-qdrant-local:latest
```

This keeps behavior aligned with the official YDB `local-ydb` image recommendations for macOS/Apple Silicon.

#### Docker Compose

Example `docker-compose.yml` (can be used instead of raw `docker run`):

```yaml
services:
  ydb-qdrant:
    image: ghcr.io/astandrik/ydb-qdrant:latest
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      YDB_ENDPOINT: ${YDB_ENDPOINT}
      YDB_DATABASE: ${YDB_DATABASE}
      YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS: /sa-key.json
      PORT: ${PORT:-8080}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    volumes:
      - ${YDB_SA_KEY_PATH}:/sa-key.json:ro
```

Example `.env` (per environment):

```bash
YDB_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
YDB_DATABASE=/ru-central1/<cloud>/<db>
YDB_SA_KEY_PATH=/abs/path/to/ydb-sa.json
PORT=8080
LOG_LEVEL=info
```

- **Updating to a newer image with Compose** (no rebuild):
  - Pull the latest tag and restart the service:
    ```bash
    docker-compose pull ydb-qdrant
    docker-compose up -d ydb-qdrant
    ```

- **Environment**: uses the same variables as documented in **Configure credentials** (`YDB_ENDPOINT`, `YDB_DATABASE`, one of the `YDB_*_CREDENTIALS` options, optional `PORT`/`LOG_LEVEL`).
- **Qdrant URL for tools/clients**: set to `http://localhost:8080` (or `http://<host>:<hostPort>` if you map a different port).
- **Health check inside container**: `GET http://localhost:8080/health`.


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
- Storage layout:
- **multi_table** (default): one YDB table per collection; metadata is tracked in `qdr__collections`.
- **one_table**: a single global table `qdrant_all_points` with `(uid, point_id)` PK, where `uid` encodes tenant+collection. Columns: `uid Utf8`, `point_id Utf8`, `embedding String` (binary float), `embedding_bit String` (bit‑quantized), `payload JsonDocument`.
- **Schema migrations** (one_table mode): automatic schema/backfill steps for `qdrant_all_points` are disabled by default. To opt in, set `YDB_QDRANT_GLOBAL_POINTS_AUTOMIGRATE=true` after backing up data; otherwise the service will error if the `embedding_bit` column is missing or needs backfill.
- Per‑collection table schema (multi_table): `point_id Utf8` (PK), `embedding String` (binary), `payload JsonDocument`.
- Vectors are serialized with `Knn::ToBinaryStringFloat`.
- Search uses a single-phase top‑k over `embedding` with automatic YDB vector index (`emb_idx`) when available; falls back to table scan if missing.
- **Vector index auto-build** (multi_table mode only): After ≥100 points upserted + 5s quiet window, a `vector_kmeans_tree` index (levels=1, clusters=128) is built automatically. Incremental updates (<100 points) skip index rebuild. In one_table mode, vector indexes are not supported; searches use a two‑phase approximate+exact flow over `qdrant_all_points` (bit‑quantized candidates via `embedding_bit` using the corresponding distance function, then exact re‑ranking over `embedding`). Note: For Dot metric, Phase 1 uses CosineDistance as a proxy since there is no direct distance equivalent for inner product on bit vectors.
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
