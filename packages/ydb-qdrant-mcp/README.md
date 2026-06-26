# YDB Qdrant MCP

MCP server package for YDB Qdrant code memory and core vector search.

Registry name:

```text
io.github.astandrik/ydb-qdrant-mcp
```

## Local Code Indexer

Default mode indexes a local checkout and searches indexed chunks:

```bash
npx -y --prefer-online --package @astandrik/ydb-qdrant-mcp ydb-qdrant-mcp
```

Required YDB configuration is the same as `ydb-qdrant`:

```bash
export YDB_QDRANT_ENDPOINT=grpc://localhost:2136
export YDB_QDRANT_DATABASE=/local
export YDB_QDRANT_MCP_WORKSPACE_ROOT=/path/to/repo
export YDB_QDRANT_MCP_LOCAL_NAMESPACE=my-laptop
export CODE_INDEXER_EMBEDDING_PROVIDER=hash
```

Explicit `root` values are constrained to `YDB_QDRANT_MCP_WORKSPACE_ROOT` by
default. Use `YDB_QDRANT_MCP_ALLOWED_ROOTS` as a comma-separated allowlist when
agents may index multiple local roots.
`YDB_QDRANT_MCP_LOCAL_NAMESPACE` is optional; by default the local namespace is
derived from the current OS user and hostname.

Local indexing uses git-aware file selection for Git checkouts and always skips
ignored files, `.env*`, `.npmrc`, `.pypirc`, `.git-credentials`, `private/`,
key/certificate files, logs, caches, and build output.

Tools in default mode:

- `index_repository`
- `get_index_status`
- `search_code`
- `list_repository_indexes`

## Core Vector MCP

The same package can run the core YDB Qdrant MCP tools:

```bash
ydb-qdrant-mcp --mode core
ydb-qdrant-mcp --mode core-http
```

Core mode uses `YDB_QDRANT_MCP_*` identity, embedding, write, and destructive
flags documented by the main `ydb-qdrant` package.

## Hosted Code Indexer MCP

Hosted Streamable HTTP stays on the production Code Indexer endpoint:

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
