# YDB Qdrant MCP Servers

YDB Qdrant exposes MCP through one npm package and two runtime surfaces:

- `@astandrik/ydb-qdrant-mcp` for local stdio agents. The default mode indexes a
  local checkout and searches indexed code chunks.
- Hosted Streamable HTTP at `https://code-indexer.ydb-qdrant.tech/mcp` for Code
  Indexer bearer tokens created by the dashboard.

The same npm package also contains the core vector MCP modes for direct
collection/point access. Core remote deployment is intentionally separate from
the first public Registry entry.

## Registry Package

The first MCP Registry target is:

```text
io.github.astandrik/ydb-qdrant-mcp
```

Its package metadata lives in `registry/ydb-qdrant-mcp/server.json`. The local
stdio package is:

```bash
npx -y --prefer-online --package @astandrik/ydb-qdrant-mcp ydb-qdrant-mcp
```

Default package mode is the local code indexer. It exposes:

| Tool | Purpose |
|------|---------|
| `index_repository` | Index a configured or explicitly allowed local repository root. |
| `get_index_status` | Return the latest local indexing status. |
| `search_code` | Search indexed code chunks. |
| `list_repository_indexes` | List local indexes, or hosted-accessible indexes when using hosted context. |

Local indexing requires a default root or an explicit tool `root`:

```bash
export YDB_QDRANT_ENDPOINT=grpc://localhost:2136
export YDB_QDRANT_DATABASE=/local
export YDB_QDRANT_MCP_WORKSPACE_ROOT=/path/to/repo
export YDB_QDRANT_MCP_ALLOWED_ROOTS=/path/to/repo,/path/to/other
export CODE_INDEXER_EMBEDDING_PROVIDER=hash
```

`YDB_QDRANT_MCP_ALLOWED_ROOTS` is optional. When it is not set, explicit tool
`root` values must still resolve inside `YDB_QDRANT_MCP_WORKSPACE_ROOT`. When it
is set, explicit roots must resolve inside one of the allowed roots.

Local file selection is git-aware for Git checkouts: ignored files are skipped
with `git ls-files --cached --others --exclude-standard`. Hard excludes also
skip local secret/private paths such as `.env*`, `private/`, key/certificate
files, logs, caches, and build output.

Use core modes from the same package when you want direct collection/point tools:

```bash
ydb-qdrant-mcp --mode core
ydb-qdrant-mcp --mode core-http
```

Hosted Code Indexer MCP clients use the remote transport:

```json
{
  "mcpServers": {
    "ydb-qdrant-code-indexer": {
      "url": "https://code-indexer.ydb-qdrant.tech/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

`/api/repositories/:repoId/reindex` remains a dashboard/API endpoint, not an MCP
transport endpoint, so it is not included in Registry metadata.

## Core MCP Server

The core server is for agents that need direct access to one configured YDB
Qdrant namespace. It is separate from the GitHub App code indexer MCP documented
in [github-app-code-indexer.md](github-app-code-indexer.md).

The core MCP server is tool-first JSON-RPC:

- `initialize`
- `tools/list`
- `tools/call`

It exposes `structuredContent` in tool results and does not expose MCP
resources or prompts in v1.

## Prerequisites

Build the project before starting the MCP server because the package scripts run
compiled files from `dist`:

```bash
npm run build
```

Configure the same YDB connection environment used by the HTTP server and
programmatic API:

```bash
export YDB_QDRANT_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
export YDB_QDRANT_DATABASE=/ru-central1/<cloud>/<db>
```

Then configure exactly one MCP identity:

```bash
export YDB_QDRANT_MCP_USER_UID=team_a
```

or:

```bash
export YDB_QDRANT_MCP_API_KEY=my-stable-namespace-key
```

Secrets are read from environment variables and are not passed through MCP tool
arguments.

## Stdio Transport

Use stdio for local IDE agents and local coding agents:

```bash
npm run mcp:ydb-qdrant
```

Example MCP client entry:

```json
{
  "mcpServers": {
    "ydb-qdrant": {
      "command": "npm",
      "args": ["run", "mcp:ydb-qdrant"],
      "cwd": "/abs/path/ydb-qdrant",
      "env": {
        "YDB_QDRANT_ENDPOINT": "grpcs://ydb.serverless.yandexcloud.net:2135",
        "YDB_QDRANT_DATABASE": "/ru-central1/<cloud>/<db>",
        "YDB_QDRANT_MCP_USER_UID": "team_a"
      }
    }
  }
}
```

The stdio entrypoint routes service logs to stderr so stdout remains reserved for
MCP JSON-RPC messages.

## Hosted HTTP Transport

Use hosted HTTP when an MCP client connects over Streamable HTTP. The endpoint is
mounted at `/mcp` and requires a static bearer token:

```bash
export YDB_QDRANT_MCP_USER_UID=team_a
export YDB_QDRANT_MCP_BEARER_TOKEN=dev-token
export YDB_QDRANT_MCP_ALLOWED_ORIGINS=https://agent.example
export YDB_QDRANT_MCP_PORT=8091

npm run start:mcp:ydb-qdrant
```

The default port is `8091`.

Example MCP client entry:

```json
{
  "mcpServers": {
    "ydb-qdrant": {
      "url": "http://localhost:8091/mcp",
      "headers": {
        "Authorization": "Bearer dev-token"
      }
    }
  }
}
```

The HTTP transport accepts:

- `OPTIONS /mcp` for CORS preflight.
- `GET /mcp` as a lightweight SSE probe.
- `POST /mcp` for JSON-RPC requests.

If a browser client sends an `Origin` header, that origin must be present in
`YDB_QDRANT_MCP_ALLOWED_ORIGINS`. Requests without an `Origin` header are not
blocked by the CORS allowlist.

Smoke test:

```bash
curl -s http://localhost:8091/mcp \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Tools

These tools are always available:

| Tool | Purpose |
|------|---------|
| `mcp_status` | Report namespace and enabled capabilities without exposing secrets. |
| `list_collections` | List collections in the configured namespace. |
| `get_collection` | Read collection metadata and point count. |
| `search_points` | Search with a raw vector. |
| `retrieve_points` | Retrieve points by id. |

Optional tools are gated by configuration:

| Tool | Enabled by |
|------|------------|
| `search_text` | `YDB_QDRANT_MCP_EMBEDDING_PROVIDER` |
| `create_collection` | `YDB_QDRANT_MCP_ENABLE_WRITES=true` |
| `upsert_points` | `YDB_QDRANT_MCP_ENABLE_WRITES=true` |
| `delete_points` | `YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE=true` |
| `delete_collection` | `YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE=true` |

Destructive tools are independent from write tools. Set the destructive flag only
for trusted deployments where deletion through MCP is intended.

## Tool Arguments

Common read examples:

```json
{
  "name": "list_collections",
  "arguments": {}
}
```

```json
{
  "name": "search_points",
  "arguments": {
    "collection": "documents",
    "vector": [0.1, 0.2, 0.3],
    "top": 10,
    "with_payload": true
  }
}
```

```json
{
  "name": "search_text",
  "arguments": {
    "collection": "documents",
    "query": "database connection retry logic",
    "top": 10,
    "with_payload": true
  }
}
```

`top` defaults to `10` and must be from `1` to `1000`.

Write examples:

```json
{
  "name": "create_collection",
  "arguments": {
    "collection": "documents",
    "vectors": {
      "size": 1536,
      "distance": "Cosine",
      "data_type": "float"
    }
  }
}
```

```json
{
  "name": "upsert_points",
  "arguments": {
    "collection": "documents",
    "points": [
      {
        "id": "doc-1",
        "vector": [0.1, 0.2, 0.3],
        "payload": { "title": "Doc 1" }
      }
    ]
  }
}
```

Delete examples:

```json
{
  "name": "delete_points",
  "arguments": {
    "collection": "documents",
    "points": ["doc-1"]
  }
}
```

```json
{
  "name": "delete_collection",
  "arguments": {
    "collection": "documents"
  }
}
```

## Text Search Embeddings

Raw vector search does not require embeddings. Text search is available only
when an MCP embedding provider is configured.

Hash provider for local development:

```bash
export YDB_QDRANT_MCP_EMBEDDING_PROVIDER=hash
export YDB_QDRANT_MCP_EMBEDDING_DIMENSION=384
```

HTTP JSON provider:

```bash
export YDB_QDRANT_MCP_EMBEDDING_PROVIDER=http
export YDB_QDRANT_MCP_EMBEDDING_URL=http://localhost:9000/embed
export YDB_QDRANT_MCP_EMBEDDING_DIMENSION=384
export YDB_QDRANT_MCP_EMBEDDING_API_KEY=<optional-token>
export YDB_QDRANT_MCP_EMBEDDING_AUTH_HEADER=Authorization
export YDB_QDRANT_MCP_EMBEDDING_AUTH_SCHEME=Bearer
```

OpenAI provider:

```bash
export YDB_QDRANT_MCP_EMBEDDING_PROVIDER=openai
export OPENAI_API_KEY=<api-key>
export YDB_QDRANT_MCP_EMBEDDING_MODEL=text-embedding-3-small
export YDB_QDRANT_MCP_EMBEDDING_DIMENSION=1536
```

`search_text` first reads collection metadata, checks that the configured
embedding dimension matches the collection vector size, embeds the query, then
calls the same search path used by `search_points`.

The MCP embedding variables are intentionally separate from `CODE_INDEXER_*`
settings used by the GitHub App code indexer.

## Environment Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `YDB_QDRANT_MCP_API_KEY` | none | API-key identity for the MCP namespace. Mutually exclusive with `YDB_QDRANT_MCP_USER_UID`. |
| `YDB_QDRANT_MCP_USER_UID` | none | Explicit user namespace. Mutually exclusive with `YDB_QDRANT_MCP_API_KEY`. |
| `YDB_QDRANT_MCP_BEARER_TOKEN` | none | Required for hosted HTTP transport. |
| `YDB_QDRANT_MCP_ALLOWED_ORIGINS` | empty | Comma-separated CORS allowlist for HTTP clients that send `Origin`. |
| `YDB_QDRANT_MCP_PORT` | `8091` | Hosted HTTP listen port. |
| `YDB_QDRANT_MCP_ENABLE_WRITES` | `false` | Enables `create_collection` and `upsert_points`. |
| `YDB_QDRANT_MCP_ENABLE_DESTRUCTIVE` | `false` | Enables `delete_points` and `delete_collection`. |
| `YDB_QDRANT_MCP_EMBEDDING_PROVIDER` | none | Enables `search_text`; one of `hash`, `http`, or `openai`. |
| `YDB_QDRANT_MCP_EMBEDDING_DIMENSION` | `384` or `1536` | Embedding vector size. Default is `1536` for OpenAI and `384` for hash/http. |
| `YDB_QDRANT_MCP_EMBEDDING_URL` | none | Required for `http`; optional override for `openai`. |
| `YDB_QDRANT_MCP_EMBEDDING_API_KEY` | none | API key for `http`, or OpenAI key fallback. |
| `OPENAI_API_KEY` | none | OpenAI provider key fallback when `YDB_QDRANT_MCP_EMBEDDING_PROVIDER=openai`. |
| `YDB_QDRANT_MCP_EMBEDDING_MODEL` | provider default | Optional embedding model name. OpenAI default is `text-embedding-3-small`. |
| `YDB_QDRANT_MCP_EMBEDDING_AUTH_HEADER` | `Authorization` | Header name for the HTTP embedding provider. |
| `YDB_QDRANT_MCP_EMBEDDING_AUTH_SCHEME` | `Bearer` | Header auth scheme for the HTTP embedding provider. Empty string sends the raw API key. |

## Programmatic Collection Listing

The same backend path is available through the npm API:

```ts
import { createYdbQdrantClient } from "ydb-qdrant";

const client = await createYdbQdrantClient({ userUid: "team_a" });
const result = await client.listCollections();

console.log(result.collections);
```

`listCollections()` returns collection names, vector configuration, point counts,
and `last_accessed_at` when the metadata row has a value. Explicit `userUid`
values are normalized consistently with the other collection operations.

## Integration Testing

CI runs the core MCP smoke through the existing real-YDB integration workflow.
The workflow starts YDB with `astandrik/setup-local-ydb@v1`, then runs
`npm run test:integration` with `YDB_QDRANT_ENDPOINT`,
`YDB_QDRANT_DATABASE`, and anonymous YDB credentials from the action.

The one-table integration suite verifies `listCollections()` against real YDB
tables, including normalized `userUid` aliases, legacy null-user metadata rows,
and grouped point counts. A separate hosted MCP HTTP smoke starts `/mcp` with a
real `YdbQdrantClient`, checks bearer/CORS behavior, and calls JSON-RPC
`tools/call` for `list_collections`, asserting `structuredContent` includes the
real point count.
