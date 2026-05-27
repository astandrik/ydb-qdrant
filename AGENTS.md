<!-- FOR AI AGENTS - Human readability is a side effect, not a goal -->
<!-- Managed by agent: keep sections and order; edit content, not structure -->
<!-- Last updated: 2026-05-27 -->

# AGENTS.md

**Precedence:** the closest `AGENTS.md` wins. This repo currently has only the root file.

## Commands (verified from `package.json`)

| Task | Command | ~Time |
|------|---------|-------|
| Typecheck | `npm run typecheck` | ~5-15s |
| Lint | `npm run lint` | ~5-15s |
| Unit tests | `npm test` | ~5-20s |
| Single test file | `npx vitest run path/to/test.ts` | ~1-5s |
| Integration tests | `npm run test:integration` | slower; hits real YDB |
| Code-indexer tests | `npm run test:code-indexer` | ~5-20s |
| Code-indexer integration smoke | `npm run test:integration:code-indexer` | slower; hits real YDB |
| E2E tests | `npm run test:e2e` | slower; app-level |
| Recall benchmark | `npm run test:recall` | slower; exact-search guard |
| Build | `npm run build` | ~5-15s |
| Smoke demo | `npm run smoke` | build + programmatic API demo |
| Dev server | `npm run dev` | watch mode |
| Code-indexer dev server | `npm run dev:code-indexer` | watch mode |

Notes:
- There is no formatter script in `package.json`.
- `prepublishOnly` runs `npm test` and `npm run build`; keep publish-sensitive changes green on both.

## Workflow
1. Read the touched route/service/repository/utilities before editing.
2. Run the smallest relevant check after each logical change.
3. If you change public behavior, update tests and user-facing docs in the same patch.
4. Before saying the work is done, provide concrete verification evidence.

## File Map

```text
src/routes/                HTTP handlers; keep thin and delegate to services
src/services/              Validation, normalization, orchestration, Qdrant semantics
src/repositories/          YDB-facing data access and delete/count helpers
src/qdrant/                Zod request schemas and REST-facing types
src/utils/                 Reusable helpers for identity, normalization, scoring, retries, payload/path helpers
src/ydb/                   Driver/session helpers, schema validation/bootstrap, typed query settings
src/package/api.ts         Programmatic npm API (`createYdbQdrantClient`)
src/server.ts              Express app wiring, middleware chain, error handling
src/index.ts               Startup, readiness/schema checks, server listen
src/code-indexer/          Separate GitHub App code-indexing service, dashboard API, MCP, queue/state stores
test/routes/               Router-level tests with mocked services
test/services/             Service-layer behavior tests
test/repositories/         Repository and YQL tests
test/code-indexer/         Code-indexer unit and API tests
test/integration/          Real-YDB integration tests
test/e2e/                  HTTP end-to-end flows
docs/                      Architecture, deployment, CI/evaluation docs
README.md                  Public usage and API documentation
```

## Golden Samples

| For | Reference | Key patterns |
|-----|-----------|--------------|
| Thin HTTP route | `src/routes/points.ts` | Build request context, delegate to service, wrap with `qdrantResponse`, keep error handling local |
| Collection/points orchestration | `src/services/PointsService.ts` | Validate request body, normalize inputs, resolve collection meta, call repository helpers |
| Programmatic API shape | `src/package/api.ts` | Keep `apiKey | userUid` explicit, no hidden tenant axis, forward directly into services |
| YDB schema checks | `src/ydb/schema.ts` | Validate required columns, fail loudly on missing migrations, create only tables that are safe to auto-create |
| Request identity | `src/utils/requestIdentity.ts` | HTTP namespace is tenant-scoped, anonymous identity uses `req.ip`/socket, never trust raw `X-Forwarded-For` |
| Code-indexer server wiring | `src/code-indexer/index.ts`, `src/code-indexer/server.ts` | Runs separately from the main Qdrant-compatible API; compose auth, public API, webhooks, MCP, queue, and stores explicitly |
| Code-indexer job state | `src/code-indexer/stateStore.ts`, `src/code-indexer/queue.ts` | Durable queue/progress semantics, per-repo concurrency, webhook delivery idempotency |
| Code-indexer SaaS state | `src/code-indexer/saasStore.ts` | GitHub users/installations/repositories/sessions/API tokens/usage with YDB secondary indexes for lookup paths |

## Utilities (reuse before adding new logic)

| Need | Use | Location |
|------|-----|----------|
| HTTP namespace/signing key | `resolveRequestNamespaceUserUid`, `resolveRequestSigningKey` | `src/utils/requestIdentity.ts` |
| Base identity and namespace key building | `deriveUserUidFromApiKey`, `deriveAnonymousUserUid`, `metaKeyFor`, `uidFor` | `src/utils/tenant.ts` |
| Search body normalization | `normalizeSearchBodyForSearch`, `normalizeSearchBodyForQuery` | `src/utils/normalization.ts` |
| Qdrant response envelope | `qdrantResponse` | `src/utils/qdrantResponse.ts` |
| YDB query settings/timeouts | `createExecuteQuerySettings*`, `createBulkUpsertSettingsWithTimeout` | `src/ydb/client.ts` |
| Retry wrapper | `withRetry` | `src/utils/retry.ts` |
| Payload integrity | `computePayloadSign` | `src/utils/PayloadSign.ts` |
| Path prefix helpers | `normalizePathSegments`, `extractPathPrefix`, `expandPathPrefixes` | `src/utils/pathPrefix.ts`, `src/utils/prefixExpansion.ts` |

## Heuristics

| When | Do |
|------|-----|
| Touching HTTP identity, tenancy, or signing | Update both `routes/collections.ts` and `routes/points.ts`, plus `test/utils/requestIdentity.test.ts` and route tests |
| Changing request/response validation | Update `src/qdrant/Requests.ts` or `src/utils/normalization.ts` and the matching route/service tests |
| Touching YDB table shape or startup schema assumptions | Update `src/ydb/schema.ts`, `src/ydb/bootstrapMetaTable.ts`, `docs/architecture-and-storage.md`, and schema tests |
| Changing public npm API behavior | Update `src/package/api.ts`, `README.md`, and `test/api/Api.test.ts` |
| Adding route behavior | Keep the route thin; place normalization/business rules in the matching service |
| Adding repository logic | Reuse `withSession`, typed query settings, and retry helpers instead of open-coded driver calls |
| Touching code-indexer auth/OAuth/session behavior | Update `test/code-indexer/auth.test.ts`, `test/code-indexer/server.auth.test.ts`, and public API tests as applicable |
| Touching code-indexer webhooks or queue semantics | Update `test/code-indexer/webhooks.test.ts`, `test/code-indexer/queue.test.ts`, `test/code-indexer/stateStore.test.ts`, and integration smoke when durable behavior changes |
| Touching code-indexer YDB table/index shape | Update `src/code-indexer/stateStore.ts` or `src/code-indexer/saasStore.ts`, docs in `docs/github-app-code-indexer.md`, and the matching store tests |
| Touching hosted MCP behavior | Update `test/code-indexer/mcp.test.ts`, `test/code-indexer/mcpHttp.test.ts`, and keep tool descriptions explicit about owner/repo/ref selection |

## Repository Settings

- Stack: Node.js 18+, TypeScript ESM, Express 5, Vitest, ESLint, YDB SDK.
- Search mode: exact-only over `qdrant_all_points.embedding`; approximate search and `embedding_quantized` are no longer part of the active model.
- HTTP tenancy: route layer combines base identity with sanitized `X-Tenant-Id` (`default` if absent) into the namespace `userUid`.
- Programmatic API: `createYdbQdrantClient` accepts exactly one of `apiKey` or `userUid`; no `defaultTenant` / `forTenant`.
- Metadata expectations: `qdr__collections` must already exist and include `last_accessed_at` and `user_uid`.
- Auto-created tables: `qdrant_all_points` and `qdrant_points_by_file` are created/validated by startup/schema helpers.
- Code indexer: `src/code-indexer` is a separate GitHub App service, not middleware inside the main API server. It stores code chunks through the public npm API and keeps app-owned durable state in `qdrant_code_indexer_*` YDB tables.
- Code-indexer tables use synchronous secondary indexes for installation/repository/user-token lookup paths and durable queue/progress scans. Queries that rely on those indexes should use explicit YDB `VIEW index_name`; deletes through secondary indexes should use `DELETE ON SELECT`.
- Code-indexer public beta uses GitHub App webhooks, OAuth dashboard sessions, hosted Streamable HTTP MCP, and optional Checks reporting. Keep webhook handling idempotent and delivery-aware.

## Boundaries

### Always Do
- Keep routes thin and push behavior into services/repositories.
- Use direct implementation imports; do not introduce `index.ts` re-export layers.
- Keep response shapes Qdrant-compatible unless the user explicitly approves a contract change.
- Update tests for changed code paths in the same patch.
- Reuse existing helpers before adding a dependency or a second implementation path.
- Keep code-indexer indexing and search usable for "not indexed yet" states; missing index collections should be treated as empty results where the user-facing operation is search/count/delete.

### Ask First
- Adding dependencies or changing `package.json` scripts.
- Changing public API signatures, HTTP wire shapes, or YDB schema expectations.
- Enabling `trust proxy`, changing auth/identity semantics, or broadening anonymous access behavior.
- Editing CI/release workflows or load/benchmark thresholds.
- Introducing repo-wide refactors or new generated files.
- Changing code-indexer public URLs, GitHub App permissions/events, OAuth callback semantics, token encryption/session secrets, or hosted MCP wire behavior.

### Never Do
- Never trust raw `X-Forwarded-For` as the namespace identity source.
- Never assume automatic migrations for existing YDB deployments; validate or document required manual migration instead.
- Never edit lockfiles or package manifests manually when a package-manager command is required.
- Never claim verification without command output.
- Never reintroduce stale docs that describe tenant/api-key hashing in collection names; the current model is tenant-scoped namespace + collection key.
- Never stage or commit local operational files under `private/`; deployment helpers there are intentionally ignored.
- Never write GitHub App private keys, webhook secrets, OAuth client secrets, OpenAI keys, YDB credentials, or bearer MCP tokens into tracked files or logs.

## Codebase State

- Root `AGENTS.md` is the only active scoped instruction file today.
- `src/types.ts` is now mostly a re-export shim; request schemas live in `src/qdrant/Requests.ts`.
- `qdrant_all_points` uses `(collection, point_id)` as PK and stores `payload_sign` plus optional `path_prefix`.
- `qdrant_points_by_file` drives path-based deletes.
- `src/code-indexer` includes the GitHub App code indexer, hosted dashboard/API, hosted MCP HTTP endpoint, stdio MCP server, and durable queue/state implementation.
- Code-indexer deployment and public beta notes live in `docs/github-app-code-indexer.md`; CI uses `astandrik/setup-local-ydb@v1` for YDB-backed integration jobs.
- `test-results/junit.xml` is generated by Vitest runs; do not hand-edit it.

## Terminology

| Term | Means |
|------|-------|
| `userUid` | Identity key passed into services; HTTP uses tenant-scoped namespace, programmatic API uses explicit `apiKey`/`userUid` only |
| Signing key | `api-key` when present, otherwise the resolved namespace `userUid` for anonymous HTTP flows |
| Metadata key | `<userUid>/<collection>` key stored in `qdr__collections.collection` |
| Collection column | Resolved namespace + collection key stored in `qdrant_all_points.collection` |
| Path-prefix lookup | `qdrant_points_by_file`, the secondary table used for path-based deletes |
| Code-indexer installation user | GitHub user linked to a GitHub App installation through `qdrant_code_indexer_installation_users`; one installation can have multiple users |
| Code-indexer collection | Repository/ref-specific Qdrant-compatible collection named by `src/code-indexer/naming.ts`, stored under `gh_installation_<id>` user identity |
| MCP token | Dashboard-created bearer token for hosted code-indexer MCP; store only hashes, never plaintext after creation |

## Index of scoped AGENTS.md

- None today. Add scoped files only when a subtree gains rules that genuinely differ from root defaults.
<!-- AGENTS-GENERATED:START scope-index -->
<!-- AGENTS-GENERATED:END scope-index -->

## When instructions conflict

The nearest `AGENTS.md` wins. Explicit user instructions override file content.
