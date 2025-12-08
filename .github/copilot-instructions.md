## Summary

**Project**: `ydb-qdrant` – Qdrant-compatible Node.js/TypeScript service and npm library that stores and searches embedding vectors in YDB using a global one-table layout (`qdrant_all_points`) with exact KNN search by default and an optional approximate two-phase mode.

**Usage modes**:
- HTTP server exposing a minimal Qdrant-compatible REST API (`/collections`, `/collections/{collection}/points/*`).
- Programmatic Node.js client via `createYdbQdrantClient` that uses the same service/repository logic without running a separate HTTP server.

**Core features**: multi-tenant isolation via `X-Tenant-Id`, global `qdrant_all_points` table, float vectors serialized to binary (`embedding`, `embedding_quantized`), approximate and exact search over YDB KNN functions.

## Tech stack and layout

- **Runtime**: Node.js 18+ (ESM, `type: "module"`).
- **Languages & tools**: TypeScript, Express, Vitest, ESLint, k6, YDB SDK.
- **Key directories**:
  - `src/` – main implementation:
    - `config/env.ts` – loads environment, search mode, session pool settings.
    - `logging/` – pino logger.
    - `ydb/` – driver, helpers, schema creation (`qdr__collections`, `qdrant_all_points`).
    - `repositories/` – YDB access for collections and points (one-table layout).
    - `services/` – domain services (`CollectionService`, `PointsService`, errors, smoke test).
    - `routes/` – Express routers for collections and points.
    - `server.ts` – Express app and HTTP wiring; `index.ts` – bootstrap (ready check + server start).
    - `package/api.ts` – programmatic API exported by the npm package.
  - `test/` – Vitest unit and integration tests mirroring the above structure.
  - `docs/` – architecture, deployment, vector dimensions, CI/evaluation details.
  - `loadtest/` – k6 soak and stress tests for HTTP API.
  - `.github/workflows/` – CI workflows (build, tests, integration, recall, load, publish).

When you need to change behavior, prefer **services** + **repositories** as the main extension points; keep routes and ydb client thin.

## Bootstrap and environment

**Dependencies**:
- From the repo root, **always run** `npm ci` (in CI or fresh clones) or `npm install` (local iterative dev) before any build, test, or lint step.
- The project uses `package-lock.json`; prefer `npm ci` for reproducible installs.

**Required env for real YDB access** (HTTP server, integration tests, smoke tests, programmatic client):
- `YDB_ENDPOINT`, `YDB_DATABASE`.
- One of the credential envs: `YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS`, `YDB_METADATA_CREDENTIALS`, `YDB_ACCESS_TOKEN_CREDENTIALS`, or `YDB_ANONYMOUS_CREDENTIALS` (dev only).

**Optional env** (common): `PORT`, `LOG_LEVEL`, `YDB_QDRANT_SEARCH_MODE`, `YDB_QDRANT_OVERFETCH_MULTIPLIER`, YDB session pool settings.

For many **unit tests, lint, and typecheck**, a live YDB instance is not required because YDB is mocked; the **integration and recall tests** do require a reachable YDB per the docs.

## Build, run, lint, and typecheck

Run these from the repo root:

- **Build**: `npm run build` – compiles TypeScript to `dist/` via `tsc -p tsconfig.json`.
- **Typecheck**: `npm run typecheck` – type-only check (`tsc --noEmit`), useful in PRs.
- **Run HTTP server**:
  - Development: `npm run dev` (tsx watch on `src/index.ts`, default port 8080). Requires appropriate YDB env if you plan to hit vector APIs.
  - Production: `npm run build` then `npm start` (runs `dist/index.js` with source maps).
- **Lint**: `npm run lint` – ESLint over `src/**/*.ts` and `test/**/*.ts` (config in `eslint.config.mjs`).
- **Smoke test**: `npm run smoke` – builds then runs `dist/SmokeTest.js` against YDB using the programmatic client. Requires YDB env.

For any substantial change, aim for `npm run lint && npm test && npm run build` to pass before proposing a PR.

## Tests and evaluation

- **Unit tests** (fast, no real YDB):
  - `npm test` – runs Vitest over `test/**` excluding `test/integration/**`.
  - `npm run test:coverage` – same as above with coverage collection.
- **Integration tests** (real YDB):
  - `npm run test:integration` – runs end-to-end flows against YDB, including the one-table layout; requires `YDB_ENDPOINT`, `YDB_DATABASE`, and credentials.
- **Recall / F1 evaluation** (one-table search quality):
  - `npm run test:recall` – runs the recall benchmark suite for approximate and exact modes.
- **Load tests (k6)** – HTTP-level performance tests; usually run manually or in dedicated workflows:
  - `npm run load:soak` – long-running soak test.
  - `npm run load:stress` – stress test (ramp-up profile).

When you modify search logic, point serialization, or collection/points repositories, consider running at least integration tests and, when relevant, the recall suite.

## CI workflows

The main GitHub Actions workflows (referenced by README badges) are:
- `ci-build.yml` – install, typecheck, build.
- `ci-tests.yml` – unit tests and coverage.
- `ci-integration.yml` – integration tests against YDB.
- `ci-recall.yml` – recall and F1 benchmarks for the one-table layout.
- `ci-load-soak.yml` / `ci-load-stress.yml` – k6 load tests.
- `publish-ydb-qdrant.yml` – publishes the npm package on tags `ydb-qdrant-v*`.

Assume CI will at minimum run `npm ci`, `npm test`, `npm run lint`, and `npm run build` on pull requests; generated changes should keep these green.

## Architecture and conventions

**Tenancy and layout**:
- Tenant isolation is via the `X-Tenant-Id` header; collections are stored as `<tenant>/<collection>` metadata rows in `qdr__collections` and points in a global `qdrant_all_points` table keyed by a derived `uid`.
- Do not break or bypass this model; new logic that touches points should go through the existing repositories and helpers.

**HTTP vs programmatic API**:
- HTTP routes in `src/routes/collections.ts` and `src/routes/points.ts` delegate to services; do not put business logic directly in routes.
- The npm package entrypoint (`dist/package/api.js`) exposes `createYdbQdrantClient` and `client.forTenant(...)`; keep these shapes and semantics stable unless performing a deliberate breaking change.

**Repositories and YDB access**:
- Access YDB through repository functions in `src/repositories/*.ts` and YDB helpers in `src/ydb/*.ts`.
- Prefer `withSession` and `withRetry` wrappers instead of new ad-hoc driver usage.

**Services and validation**:
- Use `CollectionService` and `PointsService` for high-level operations and `types.ts` / Zod schemas for validating request shapes.
- Keep new logic small, focused, and consistent with existing patterns; avoid changing public request/response contracts for the Qdrant-compatible endpoints.

When changing a behavior, look for an existing service or repository doing something similar and follow its pattern.

## Testing guidance

When modifying:
- **Services** – update or add tests under `test/services/`.
- **Repositories or YDB helpers** – update tests under `test/repositories/` and `test/ydb/`.
- **Routes** – update tests under `test/routes/`.
- **Shared utils** – update tests under `test/utils/`.

Prefer extending existing tests over adding entirely new files when the behavior fits an existing suite. New features should include unit tests; changes to search, serialization, or schema behavior should also have integration coverage where practical.

## Instructions for GitHub Copilot and agents

- Prefer **minimal, behavior-preserving diffs**; avoid large refactors unless explicitly requested.
- Trust the commands and layout described in this file first; only search the repo for build/test commands if these instructions appear out of date or fail in practice.
- Before suggesting or applying code changes that affect public HTTP endpoints or the exported programmatic API, check `AGENTS.md` and existing tests to keep Qdrant compatibility and search semantics intact.
- Avoid changing CI workflows, recall evaluation logic, or load-test profiles unless the task specifically calls for it.
- When adding new code, align with the existing structure (routes → services → repositories → ydb) and ensure `npm run lint`, `npm test`, and `npm run build` continue to pass.
