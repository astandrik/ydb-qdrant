# GitHub App для индексации репозиториев в ydb-qdrant

## Summary

Идея GitHub App "YDB Qdrant Code Indexer" хорошо ложится на текущий `ydb-qdrant`: проект уже имеет Qdrant-compatible HTTP API, npm API, Docker image, CI, exact vector search поверх YDB, tenant isolation через `apiKey`/`userUid`, payload storage и path-based delete через `pathSegments`.

Рекомендация: не встраивать GitHub App в основной `src/server.ts`. Лучше сделать отдельный сервис `ydb-qdrant-code-indexer`, который использует `ydb-qdrant` как storage/search backend через npm API или HTTP API. Так основной проект остается Qdrant-compatible engine, а GitHub App становится отдельным product layer для code memory.

README/landing формулировка:

> Install a GitHub App, index your repository into YDB-backed Qdrant-compatible storage, and give your coding agents searchable project memory.

## MVP Architecture

- GitHub App принимает webhooks на отдельный endpoint, например `POST /github/webhook`.
- Webhook handler проверяет подпись, делает idempotency check по `X-GitHub-Delivery` и быстро отвечает `2xx`.
- Долгая работа уходит в async job queue: full reindex, incremental push update, PR index update, cleanup.
- Worker получает GitHub installation token, читает дерево/файлы репозитория, режет код на chunks, получает embeddings и пишет points в `ydb-qdrant`.
- MCP server или search API принимает текстовый query, получает embedding тем же provider, вызывает `searchPoints` и возвращает path/snippet metadata агенту или IDE.

Минимальные runtime-компоненты:

- `WebhookServer`: Express/Fastify endpoint + raw body signature validation.
- `GitHubClientFactory`: installation auth через GitHub App private key.
- `IndexingQueue`: durable или at-least-once job queue.
- `RepoIndexer`: full и incremental indexing orchestration.
- `CodeChunker`: file filtering, language detection, chunking, line ranges.
- `EmbeddingProvider`: pluggable batch/query embeddings.
- `YdbQdrantIndexStore`: create/upsert/delete/search wrapper over `ydb-qdrant`.
- `SearchAdapter` или MCP tool: human query -> vector search -> snippets.

## GitHub App Permissions And Events

Минимальные permissions:

- `Metadata: read`.
- `Contents: read` для чтения tree/content и подписки на `push`.
- `Pull requests: read` для подписки на `pull_request`.
- `Checks: write` только если нужно показывать "indexing queued/in_progress/succeeded/failed" прямо в PR.

Webhook events:

- `installation`: первичная регистрация app.
- `installation_repositories`: добавление/удаление repositories из installation.
- `push`: обновление default branch index.
- `pull_request`: индексирование PR head для `opened`, `synchronize`, `reopened`; cleanup для `closed`.
- `check_run` / `check_suite`: только если включены Checks и нужна кнопка rerun.

Security requirements:

- Проверять `X-Hub-Signature-256` HMAC-SHA256 на raw request body до JSON parsing.
- Использовать `X-GitHub-Delivery` как idempotency key.
- Не логировать file content, embeddings, private key, webhook secret, installation token.
- Installation tokens short-lived; получать их per job через GitHub App auth.

## Indexing Model

Collection naming:

- `userUid`: `gh_installation_<installationId>`.
- Default branch collection: `gh_repo_<repoId>_default`.
- PR collection: `gh_repo_<repoId>_pr_<number>`.

Point identity:

- `point.id`: stable hash от `repoId`, `ref`, `path`, `blobSha`, `chunkIndex`.
- При изменении файла удалить старые chunks по `pathSegments`, затем upsert новые chunks.
- При rename удалить `previous_filename`, затем upsert новый path.
- При deleted file удалить по `pathSegments`.

Payload shape:

```json
{
  "source": "github",
  "repoId": 123,
  "owner": "owner",
  "repo": "repo",
  "ref": "refs/heads/main",
  "sha": "commit-sha",
  "blobSha": "blob-sha",
  "path": "src/server.ts",
  "pathSegments": ["src", "server.ts"],
  "language": "TypeScript",
  "startLine": 1,
  "endLine": 80,
  "text": "chunk text"
}
```

Collection creation:

- Create collection before first upsert.
- Vector dimension comes from embedding provider config.
- Distance default: `Cosine`.
- On existing collection with same dimension/distance, reuse it.
- On dimension mismatch, fail loudly and require reindex or collection reset.

## Indexing Flow

Full reindex:

- Fetch repository tree for target ref.
- If recursive tree response is truncated, fall back to non-recursive subtree traversal.
- Filter out binary/generated/vendor/oversized files.
- Fetch file contents using GitHub contents/git blob APIs or HTTP git clone with installation token.
- Chunk text with stable line ranges.
- Batch embeddings.
- Upsert points in batches.
- Store repo manifest outside `ydb-qdrant`: indexed ref, commit SHA, file blob SHAs, file paths, job status.

Incremental push:

- Handle only configured default branch in MVP.
- Use compare API from `before...after` to get changed files.
- For added/modified files: delete old chunks by path, fetch current content at `after`, chunk/embed/upsert.
- For removed files: delete by path.
- For renamed files: delete `previous_filename`, then index new filename.
- On force push, created branch, deleted default branch, compare failure, too many files, or missing manifest: enqueue full reindex.

Pull requests:

- `opened`, `synchronize`, `reopened`: index PR head into PR-scoped collection.
- Search can merge default branch collection + PR collection at adapter level.
- `closed`: delete PR-scoped collection.
- MVP does not need to write comments or reviews.

Checks integration, optional:

- Create check run on push/PR job start.
- Update to `in_progress`.
- Complete with success/failure and summary: files indexed, chunks indexed, skipped files, elapsed time.
- Do not block merging by default unless repository owner explicitly configures branch protection.

## File Filtering And Chunking Defaults

Default excludes:

- `.git`, `node_modules`, `vendor`, `dist`, `build`, `coverage`, `.next`, `.turbo`, `target`.
- Common binary/media/archive files.
- Lockfiles and generated dependency manifests unless explicitly enabled.
- Files above configured `maxFileBytes`.
- Files that look binary by content sniffing.

Default includes:

- Source code, markdown docs, config files, tests, schemas, SQL/YQL, Dockerfiles, CI workflows.

Chunking:

- Prefer language-aware chunking later; MVP can use line/token windows.
- Keep chunk text in payload only if privacy/storage cost is acceptable.
- Store line ranges so IDE/MCP can open exact snippets.
- Keep chunks deterministic so reindex churn stays low.

## Product Recommendation

Ship in phases:

1. **MVP self-hosted app**: GitHub App webhook service, full index, incremental default branch push, search API/MCP, no marketplace.
2. **PR UX**: PR-scoped collections, optional Checks status, rerun indexing.
3. **Hosted/multi-tenant**: installation dashboard, quotas, billing/limits, repository-level config.
4. **Quality layer**: language-aware chunking, symbol extraction, hybrid lexical+vector search, reranking.

Avoid in MVP:

- Writing PR comments.
- Indexing every branch.
- Public marketplace listing before security/privacy story is mature.
- Changing core `ydb-qdrant` storage schema for app metadata.
- Hard-coding a single embedding provider into the core library.

## Test Plan

Unit tests:

- Webhook signature verification.
- Duplicate delivery idempotency.
- Event-to-job routing for `installation`, `installation_repositories`, `push`, `pull_request`.
- Collection naming and point id stability.
- File filtering and chunking.
- Dimension mismatch handling.

Contract tests with mocks:

- GitHub client mock for tree, contents, compare and PR payloads.
- Embedding provider mock with deterministic vectors.
- `ydb-qdrant` client mock verifying create/upsert/delete/search calls.

Integration smoke:

- Start local `ydb-qdrant`.
- Index a small fixture repository.
- Search for a known symbol or phrase.
- Verify returned result includes correct `path`, line range and snippet payload.

Security checks:

- Invalid signature is rejected.
- Missing signature is rejected.
- Secrets and file contents are absent from logs.
- Installation token refresh does not leak tokens.

## Risks And Mitigations

- **Large repositories**: GitHub recursive tree API can truncate. Use subtree traversal fallback and repo-level limits.
- **Embedding cost**: batch embeddings, skip unchanged blob SHAs, store manifest outside vector store.
- **Privacy**: make snippet storage configurable; support self-hosted deployment first.
- **Search quality**: exact vector search is enough for MVP, but large repos may need reranking or hybrid search later.
- **Rate limits**: use installation tokens, cache blob SHAs, prefer incremental compare, apply concurrency limits.
- **Schema drift**: keep app metadata in separate tables; use `ydb-qdrant` only for vector collections/points.

## Official References

- GitHub App installation authentication: https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- GitHub webhook events and payloads: https://docs.github.com/en/enterprise-cloud@latest/webhooks/webhook-events-and-payloads
- Webhook signature validation: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- Git Trees API: https://docs.github.com/en/rest/git/trees
- Repository Contents API: https://docs.github.com/en/rest/repos/contents
- Compare commits API: https://docs.github.com/en/rest/commits/commits
- Check Runs API: https://docs.github.com/en/rest/checks/runs
