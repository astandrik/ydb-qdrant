## GitHub App Code Indexer

`ydb-qdrant` includes a separate GitHub App indexing service under `src/code-indexer`. The service is intentionally not wired into the main Qdrant-compatible API server: it runs as its own process and writes code chunks into `ydb-qdrant` collections through the existing npm API.

The public hosted beta uses:

- UI: `https://ydb-qdrant.tech/code-indexer/`
- Backend: `https://code-indexer.ydb-qdrant.tech`
- OAuth callback: `https://code-indexer.ydb-qdrant.tech/github/oauth/callback`
- Hosted MCP endpoint: `https://code-indexer.ydb-qdrant.tech/mcp`

Self-hosted deployments are still supported with the same backend binary and environment variables.

### What it does today

- Accepts GitHub App webhooks on `POST /github/webhook`.
- Validates `X-Hub-Signature-256` before parsing JSON.
- Deduplicates webhook deliveries by `X-GitHub-Delivery`.
- Persists webhook deliveries and indexing jobs in app-owned YDB tables by default.
- Persists repo manifests with indexed refs, commit SHAs, file paths, and blob SHAs.
- Handles `installation`, `installation_repositories`, default-branch `push`, and `pull_request` events.
- Handles `check_run.rerequested` for the indexer's own check run when Checks are enabled.
- Reads repository files through GitHub installation tokens.
- Filters vendor/binary/oversized files, chunks source files with smart Tree-sitter/text-aware fallbacks, embeds chunks, and upserts them into `ydb-qdrant`.
- Supports repository-level indexing config in `.ydb-qdrant-code-indexer.json`.
- Supports GitHub OAuth sessions for the public dashboard.
- Exposes dashboard APIs under `/api/*` for installations, repositories, MCP tokens, quotas, and data deletion.
- Exposes `POST /search` for query embedding + vector search over a repo collection.
- Exposes hosted Streamable HTTP MCP at `POST /mcp`.
- Exposes an MCP stdio server with a read-only `search_code` tool for IDEs and coding agents.
- Includes fixture-based integration tests for local YDB, including the public SaaS OAuth/webhook/MCP/uninstall flow.

The durable state tables are separate from the core vector/search schema:

- `qdrant_code_indexer_deliveries`
- `qdrant_code_indexer_jobs`
- `qdrant_code_indexer_manifests`
- `qdrant_code_indexer_users`
- `qdrant_code_indexer_sessions`
- `qdrant_code_indexer_installations`
- `qdrant_code_indexer_repositories`
- `qdrant_code_indexer_api_tokens`
- `qdrant_code_indexer_usage_daily`
- `qdrant_code_indexer_audit_log`

### GitHub App configuration

Public hosted beta settings:

- Homepage URL: `https://ydb-qdrant.tech/code-indexer/`
- Callback URL: `https://code-indexer.ydb-qdrant.tech/github/oauth/callback`
- Webhook URL: `https://code-indexer.ydb-qdrant.tech/github/webhook`
- Enable "Request user authorization (OAuth) during installation".
- Enable expiring user authorization tokens.
- Installation target: `Any account`.

When "Request user authorization (OAuth) during installation" is enabled, GitHub disables the Setup URL field and redirects the installer through the first configured callback URL instead. The callback accepts GitHub's install-time OAuth redirect without a custom `state`, exchanges the `code`, fetches the authorized user's accessible GitHub App installations, links those installations to the dashboard user, and redirects to `https://ydb-qdrant.tech/code-indexer/dashboard/`.

Required GitHub App permissions:

- `Metadata: read`
- `Contents: read`
- `Pull requests: read`
- `Checks: write` if PR status reporting and manual reruns are enabled

Webhook events:

- `Installation target`
- `Meta`
- `installation`
- `installation_repositories`
- `push`
- `pull_request`
- `check_run` when Checks are enabled
- `GitHub App authorization` if available in the settings UI

### Developer Program positioning

The current release target is a public hosted beta for the active GitHub Developer Program track. It is not a GitHub Marketplace listing yet. Marketplace publication remains a separate track after privacy, support, pricing, branding, and review requirements are ready.

### Environment

Required:

```bash
export GITHUB_APP_ID=<app-id>
export GITHUB_CLIENT_ID=<client-id>
export GITHUB_CLIENT_SECRET=<client-secret>
export GITHUB_PRIVATE_KEY_FILE=/abs/path/github-app-private-key.pem
export GITHUB_WEBHOOK_SECRET=<webhook-secret>

export CODE_INDEXER_PUBLIC_BASE_URL=https://code-indexer.ydb-qdrant.tech
export CODE_INDEXER_UI_ORIGIN=https://ydb-qdrant.tech
export CODE_INDEXER_SESSION_SECRET=<long-random-secret>
export CODE_INDEXER_TOKEN_PEPPER=<long-random-secret>

export YDB_QDRANT_ENDPOINT=grpcs://ydb.serverless.yandexcloud.net:2135
export YDB_QDRANT_DATABASE=/ru-central1/<cloud>/<db>
# plus one supported YDB auth method, as documented in README.md
```

`GITHUB_PRIVATE_KEY` can be used instead of `GITHUB_PRIVATE_KEY_FILE`. Literal `\n` sequences are converted into PEM newlines.

Optional:

```bash
export CODE_INDEXER_PORT=8090
export CODE_INDEXER_STATE_STORE=ydb
export CODE_INDEXER_STATE_RETENTION_DAYS=14
export CODE_INDEXER_JOB_MAX_ATTEMPTS=3
export CODE_INDEXER_JOB_RETRY_BACKOFF_MS=30000
export CODE_INDEXER_CHECKS_ENABLED=false
export CODE_INDEXER_ALLOWED_MCP_ORIGINS=https://ydb-qdrant.tech
export CODE_INDEXER_SESSION_TTL_SECONDS=2592000
export CODE_INDEXER_OAUTH_STATE_TTL_SECONDS=600
export CODE_INDEXER_QUOTA_REPOS_PER_INSTALLATION=1000
export CODE_INDEXER_QUOTA_FILES_PER_REPO=1000000
export CODE_INDEXER_QUOTA_CHUNKS_PER_REPO=5000000
export CODE_INDEXER_QUOTA_SEARCHES_PER_USER_PER_DAY=100000
export CODE_INDEXER_EMBEDDING_PROVIDER=hash
export CODE_INDEXER_EMBEDDING_DIMENSION=384
export CODE_INDEXER_EMBEDDING_API_KEY=
export CODE_INDEXER_EMBEDDING_AUTH_HEADER=Authorization
export CODE_INDEXER_EMBEDDING_AUTH_SCHEME=Bearer
export CODE_INDEXER_SEARCH_API_KEY=
export CODE_INDEXER_CHUNKER=auto
export CODE_INDEXER_CHUNK_LINES=80
export CODE_INDEXER_OVERLAP_LINES=10
export CODE_INDEXER_MAX_CHUNK_CHARS=8000
export CODE_INDEXER_MAX_FILE_BYTES=524288
export CODE_INDEXER_MAX_CHANGED_FILES=300
export CODE_INDEXER_EMBED_SNIPPET_TEXT=true
```

Set `CODE_INDEXER_STATE_STORE=memory` only for local experiments where losing queued jobs and delivery dedupe state on process restart is acceptable.

With the YDB state store, interrupted `running` jobs are reset to `pending` on startup. Failed durable jobs are retried up to `CODE_INDEXER_JOB_MAX_ATTEMPTS`; completed and permanently failed jobs plus old delivery ids are removed after `CODE_INDEXER_STATE_RETENTION_DAYS`.

Repository manifests are saved after successful full, incremental, and PR indexing jobs. A default-branch incremental push without an existing manifest falls back to a full reindex before writing a fresh manifest. Repository and PR delete jobs remove the matching manifest together with the indexed collection.

Default public beta quotas are intentionally high enough for normal use:

- 1,000 repositories per installation
- 1,000,000 indexable files per repository
- 5,000,000 chunks per repository
- 100,000 hosted MCP searches per GitHub user per day

### Public dashboard and data lifecycle

The dashboard uses GitHub OAuth and secure `__Host-ydbqci_session` cookies. It lets a signed-in user list linked installations, inspect repository indexing status, create/revoke hosted MCP tokens, and request deletion of service-owned data.

The hosted service stores:

- GitHub user id/login and encrypted GitHub OAuth tokens for dashboard access.
- Installation and repository metadata required to route webhooks and searches.
- Indexed source snippets, vectors, file paths, refs, commit SHAs, blob SHAs, line ranges, and language metadata.
- HMAC hashes of MCP tokens, never plaintext tokens after creation.
- Daily usage counters and audit records for quota and support diagnostics.

Uninstalling the GitHub App or removing repositories enqueues delete jobs that remove matching manifests and indexed collections. Dashboard data deletion removes eligible sessions, MCP tokens, installation links, repository rows, audit/usage data, and indexed collections owned by the user's linked installations.

Set `CODE_INDEXER_CHECKS_ENABLED=true` only after granting the GitHub App `Checks: write`. Check run reporting is fail-open: indexing continues if GitHub rejects check run creation or updates. A `check_run.rerequested` webhook for `YDB Qdrant Code Index` requeues a full default-branch index for the checked SHA, or a PR-scoped reindex for same-repository pull requests.

Set `CODE_INDEXER_SEARCH_API_KEY` before exposing `POST /search` outside a trusted local network. When it is set, search requests must send `Authorization: Bearer <token>`. The MCP stdio server does not use this HTTP token.

Embedding modes:

- `hash`: deterministic local/test embeddings. This is useful for smoke tests, but not production semantic search.
- `openai`: recommended production default using OpenAI-compatible embeddings without adding an SDK dependency.
- `http`: custom OpenAI-compatible or generic JSON embedding endpoint.

For OpenAI embeddings:

```bash
export CODE_INDEXER_EMBEDDING_PROVIDER=openai
export OPENAI_API_KEY=<openai-api-key>
export CODE_INDEXER_EMBEDDING_MODEL=text-embedding-3-small
export CODE_INDEXER_EMBEDDING_DIMENSION=1536
```

`CODE_INDEXER_EMBEDDING_API_KEY` can be used instead of `OPENAI_API_KEY`. If `CODE_INDEXER_EMBEDDING_DIMENSION` is set for the OpenAI provider, the value is also sent as the OpenAI `dimensions` request field.

For a custom embedding service, switch to the generic HTTP provider:

```bash
export CODE_INDEXER_EMBEDDING_PROVIDER=http
export CODE_INDEXER_EMBEDDING_URL=https://embedding-service.example.com/embed
export CODE_INDEXER_EMBEDDING_API_KEY=<api-key>
export CODE_INDEXER_EMBEDDING_MODEL=<model-name>
export CODE_INDEXER_EMBEDDING_DIMENSION=<provider-dimension>
```

The HTTP provider sends:

```json
{
  "input": ["text 1", "text 2"],
  "model": "optional-model"
}
```

It accepts responses shaped as `{"embeddings": [[...]]}`, `{"vectors": [[...]]}`, or OpenAI-style `{"data": [{"embedding": [...]}]}`.

For Azure OpenAI, use the `api-key` header and no auth scheme:

```bash
export CODE_INDEXER_EMBEDDING_PROVIDER=http
export CODE_INDEXER_EMBEDDING_URL='https://<resource>.openai.azure.com/openai/deployments/<deployment>/embeddings?api-version=<api-version>'
export CODE_INDEXER_EMBEDDING_API_KEY=<azure-openai-api-key>
export CODE_INDEXER_EMBEDDING_AUTH_HEADER=api-key
export CODE_INDEXER_EMBEDDING_AUTH_SCHEME=
export CODE_INDEXER_EMBEDDING_DIMENSION=<deployment-dimension>
```

### Run locally

Development:

```bash
npm run dev:code-indexer
```

After build:

```bash
npm run build
npm run start:code-indexer
```

Health check:

```bash
curl -s http://localhost:8090/health
```

The Docker image default command starts the Qdrant-compatible core server. To run the code indexer from the same image, override the command:

```bash
docker run --rm \
  -p 8090:8090 \
  --env-file .env \
  ghcr.io/astandrik/ydb-qdrant:latest \
  node --experimental-specifier-resolution=node --enable-source-maps dist/code-indexer/index.js
```

### Integration smoke

With local YDB available through the standard integration env (`YDB_QDRANT_ENDPOINT`, `YDB_QDRANT_DATABASE`, and one supported auth mode), run the code-indexer fixture smoke directly:

```bash
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
```

The smoke test indexes an in-memory GitHub repository fixture through `RepoIndexer`, persists the repo manifest in the code-indexer YDB state table, writes chunks into the YDB-backed Qdrant-compatible store, and verifies search returns the expected source path. CI runs this smoke with `astandrik/setup-local-ydb@v1`.

Run the public SaaS integration flow directly:

```bash
YDB_ANONYMOUS_CREDENTIALS=1 npx vitest run test/integration/CodeIndexerPublicSaas.test.ts
```

That test covers GitHub OAuth session creation, installation webhook processing, repository indexing, hosted MCP search by `owner/repo`, MCP token revocation, uninstall webhook processing, and indexed collection deletion. CI runs it together with the code-indexer smoke and SaaS store integration tests.

### MCP server

The hosted beta exposes Streamable HTTP MCP at `https://code-indexer.ydb-qdrant.tech/mcp`. Clients authenticate with a dashboard-created MCP token:

```json
{
  "mcpServers": {
    "ydb-qdrant-code-indexer": {
      "url": "https://code-indexer.ydb-qdrant.tech/mcp",
      "headers": {
        "Authorization": "Bearer <mcp-token>"
      }
    }
  }
}
```

The `search_code` tool accepts `owner`, `repo`, optional `prNumber`, `query`, and `top`. The server resolves the repository to the correct installation and collection through the SaaS store. Numeric `installationId` and `repoId` inputs remain supported for self-hosted and internal clients.

The stdio MCP server remains available for self-hosted deployments and exposes the same read-only `search_code` tool. It uses only the YDB and embedding settings above; GitHub App credentials are not required for search.

Development:

```bash
npx tsx src/code-indexer/mcpServer.ts
```

After build:

```bash
npm run build
npm run mcp:code-indexer
```

Example MCP client entry:

```json
{
  "mcpServers": {
    "ydb-qdrant-code-indexer": {
      "command": "node",
      "args": [
        "--experimental-specifier-resolution=node",
        "--enable-source-maps",
        "/abs/path/ydb-qdrant/dist/code-indexer/mcpServer.js"
      ],
      "env": {
        "YDB_QDRANT_ENDPOINT": "grpcs://ydb.serverless.yandexcloud.net:2135",
        "YDB_QDRANT_DATABASE": "/ru-central1/<cloud>/<db>",
        "CODE_INDEXER_EMBEDDING_PROVIDER": "openai",
        "OPENAI_API_KEY": "<api-key>",
        "CODE_INDEXER_EMBEDDING_MODEL": "text-embedding-3-small",
        "CODE_INDEXER_EMBEDDING_DIMENSION": "1536"
      }
    }
  }
}
```

The stdio entrypoint sends existing service logs to stderr so stdout remains reserved for MCP JSON-RPC messages.

### Repository config

Repositories can override indexing selection and chunk sizing with `.ydb-qdrant-code-indexer.json`:

```json
{
  "include": ["src/**", "docs/**", "*.md"],
  "exclude": ["**/generated/**", "dist/**"],
  "maxFileBytes": 262144,
  "maxChunkChars": 8000,
  "chunkLines": 80,
  "overlapLines": 10
}
```

`include` and `exclude` use simple path globs: `*` matches within one path segment, `**` matches across directories, and a pattern without `/` also matches file basenames. Explicit `include` patterns can opt in default-excluded text files such as lockfiles, but binary/media/archive extensions remain excluded.

For pull requests, the indexer reads config from the base repository, not from a fork head. If the config file changes on the default branch, incremental indexing falls back to a full reindex so changed include/exclude rules apply consistently.

### Chunking extension point

`RepoIndexer` depends on the `CodeChunker` interface. Runtime chunking is selected with `CODE_INDEXER_CHUNKER`:

- `auto` uses the smart chunker and falls back to line-window behavior if Tree-sitter cannot be loaded.
- `tree-sitter` requires Tree-sitter parser dependencies and fails fast at startup if they are unavailable.
- `line-window` disables semantic chunking and uses deterministic line windows for every file.

The smart chunker routes supported source files through Tree-sitter and emits symbol-level chunks for JavaScript, TypeScript, Python, Go, and Rust. Markdown and plain-text files use text-aware splitting by headings or paragraph groups. Unsupported files, malformed files, and oversized semantic nodes fall back to `LineWindowChunker` while preserving `path`, `chunkIndex`, `startLine`, and `endLine`.

Repository manifests store an indexing fingerprint that includes the chunker registry and effective chunking limits. A default-branch incremental push with a missing or stale fingerprint falls back to a full reindex so old and new chunk layouts are not mixed in one collection.

### Search API

`POST /search` is primarily for self-hosted or trusted internal deployments. Public hosted clients should use the authenticated `/mcp` endpoint instead of direct search.

Search the default branch collection:

```bash
curl -X POST http://localhost:8090/search \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <CODE_INDEXER_SEARCH_API_KEY>' \
  -d '{
    "installationId": 123,
    "repoId": 456,
    "query": "where is request identity resolved?",
    "top": 5
  }'
```

Search a PR-scoped collection:

```bash
curl -X POST http://localhost:8090/search \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <CODE_INDEXER_SEARCH_API_KEY>' \
  -d '{
    "installationId": 123,
    "repoId": 456,
    "prNumber": 7,
    "query": "new indexing logic",
    "top": 5
  }'
```

### Collection layout

- `userUid`: `gh_installation_<installationId>`
- Default branch collection: `gh_repo_<repoId>_default`
- PR collection: `gh_repo_<repoId>_pr_<number>`

Each indexed chunk stores GitHub metadata in payload, including `repoId`, `owner`, `repo`, `ref`, `sha`, `blobSha`, `path`, `pathSegments`, `language`, `startLine`, `endLine`, and optionally `text`.
