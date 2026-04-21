<!-- FOR AI AGENTS - Human readability is a side effect, not a goal -->
<!-- Managed by agent: keep sections and order; edit content, not structure -->
<!-- Last updated: 2026-04-21 -->

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
| E2E tests | `npm run test:e2e` | slower; app-level |
| Recall benchmark | `npm run test:recall` | slower; exact-search guard |
| Build | `npm run build` | ~5-15s |
| Smoke demo | `npm run smoke` | build + programmatic API demo |
| Dev server | `npm run dev` | watch mode |

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
test/routes/               Router-level tests with mocked services
test/services/             Service-layer behavior tests
test/repositories/         Repository and YQL tests
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

## Repository Settings

- Stack: Node.js 18+, TypeScript ESM, Express 5, Vitest, ESLint, YDB SDK.
- Search mode: exact-only over `qdrant_all_points.embedding`; approximate search and `embedding_quantized` are no longer part of the active model.
- HTTP tenancy: route layer combines base identity with sanitized `X-Tenant-Id` (`default` if absent) into the namespace `userUid`.
- Programmatic API: `createYdbQdrantClient` accepts exactly one of `apiKey` or `userUid`; no `defaultTenant` / `forTenant`.
- Metadata expectations: `qdr__collections` must already exist and include `last_accessed_at` and `user_uid`.
- Auto-created tables: `qdrant_all_points` and `qdrant_points_by_file` are created/validated by startup/schema helpers.

## Boundaries

### Always Do
- Keep routes thin and push behavior into services/repositories.
- Use direct implementation imports; do not introduce `index.ts` re-export layers.
- Keep response shapes Qdrant-compatible unless the user explicitly approves a contract change.
- Update tests for changed code paths in the same patch.
- Reuse existing helpers before adding a dependency or a second implementation path.

### Ask First
- Adding dependencies or changing `package.json` scripts.
- Changing public API signatures, HTTP wire shapes, or YDB schema expectations.
- Enabling `trust proxy`, changing auth/identity semantics, or broadening anonymous access behavior.
- Editing CI/release workflows or load/benchmark thresholds.
- Introducing repo-wide refactors or new generated files.

### Never Do
- Never trust raw `X-Forwarded-For` as the namespace identity source.
- Never assume automatic migrations for existing YDB deployments; validate or document required manual migration instead.
- Never edit lockfiles or package manifests manually when a package-manager command is required.
- Never claim verification without command output.
- Never reintroduce stale docs that describe tenant/api-key hashing in collection names; the current model is tenant-scoped namespace + collection key.

## Codebase State

- Root `AGENTS.md` is the only active scoped instruction file today.
- `src/types.ts` is now mostly a re-export shim; request schemas live in `src/qdrant/Requests.ts`.
- `qdrant_all_points` uses `(collection, point_id)` as PK and stores `payload_sign` plus optional `path_prefix`.
- `qdrant_points_by_file` drives path-based deletes.
- `test-results/junit.xml` is generated by Vitest runs; do not hand-edit it.

## Terminology

| Term | Means |
|------|-------|
| `userUid` | Identity key passed into services; HTTP uses tenant-scoped namespace, programmatic API uses explicit `apiKey`/`userUid` only |
| Signing key | `api-key` when present, otherwise the resolved namespace `userUid` for anonymous HTTP flows |
| Metadata key | `<userUid>/<collection>` key stored in `qdr__collections.collection` |
| Collection column | Resolved namespace + collection key stored in `qdrant_all_points.collection` |
| Path-prefix lookup | `qdrant_points_by_file`, the secondary table used for path-based deletes |

## Index of scoped AGENTS.md

- None today. Add scoped files only when a subtree gains rules that genuinely differ from root defaults.
<!-- AGENTS-GENERATED:START scope-index -->
<!-- AGENTS-GENERATED:END scope-index -->

## When instructions conflict

The nearest `AGENTS.md` wins. Explicit user instructions override file content.
