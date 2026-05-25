# YDB Qdrant Code Indexer MVP Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the GitHub App code indexer as a verified self-hosted MVP for the already active GitHub Developer Program track.

**Architecture:** Keep the code indexer as a separate service under `src/code-indexer`, writing chunks and embeddings into the existing ydb-qdrant storage through the package API. Add a first-class OpenAI embeddings provider while retaining the existing custom HTTP provider and hash provider for tests. CI should run the code-indexer integration smoke against local YDB through `astandrik/setup-local-ydb`.

**Tech Stack:** Node.js 22 in CI, TypeScript ESM, Express 5, Vitest, YDB SDK, ydb-qdrant package API, GitHub App webhooks, OpenAI-compatible embeddings API, Tree-sitter chunking.

---

## Current State

- The code-indexer implementation exists in `src/code-indexer/*` but is currently untracked.
- Unit/contract coverage exists in `test/code-indexer/*`.
- A real-YDB smoke test exists in `test/integration/CodeIndexerSmoke.test.ts`.
- Documentation exists in `docs/github-app-code-indexer.md` and `docs/github-app-code-indexer-plan.md`.
- Verified locally before this plan: `npm run typecheck` and `npx vitest run test/code-indexer`.
- `package.json` does not yet expose convenient code-indexer scripts.
- `POST /search` is currently unauthenticated.
- Embeddings currently support `hash` and generic `http`; OpenAI works through `http` config but is not a first-class provider.

## References

- GitHub Developer Program: `https://docs.github.com/en/integrations/concepts/github-developer-program`
- GitHub App webhooks best practices: `https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks`
- OpenAI embeddings API: `https://platform.openai.com/docs/api-reference/embeddings/create`
- setup-local-ydb action: `https://github.com/marketplace/actions/setup-local-ydb`
- setup-local-ydb repository: `https://github.com/astandrik/setup-local-ydb`

## Task 1: Cleanly Scope The Existing Work

**Files:**
- Review: `git status --short -uall`
- Include in code-indexer patch: `src/code-indexer/*`, `test/code-indexer/*`, `test/integration/CodeIndexerSmoke.test.ts`, `docs/github-app-code-indexer.md`, `docs/github-app-code-indexer-plan.md`, `docs/code-indexer-chunking-plan.md`, `README.md`, `package.json`, `package-lock.json`, `Dockerfile`
- Keep separate unless proven related: `src/logging/logger.ts`, `test/Server.errorHandler.test.ts`, `test/Server.requestCorrelation.test.ts`

- [ ] **Step 1: Inspect worktree scope**

Run:

```bash
git status --short -uall
git diff --stat
```

Expected:

- Code-indexer source, tests, docs, dependency, and Docker changes are visible.
- Any logger/server-test changes are identified as separate work unless a code-indexer test directly depends on them.

- [ ] **Step 2: Verify the existing code-indexer baseline**

Run:

```bash
npm run typecheck
npx vitest run test/code-indexer
```

Expected:

- TypeScript typecheck passes.
- `test/code-indexer` passes with all existing code-indexer tests green.

## Task 2: Add First-Class OpenAI Embeddings Provider

**Files:**
- Modify: `src/code-indexer/config.ts`
- Modify: `src/code-indexer/embeddings.ts`
- Modify: `src/code-indexer/runtime.ts`
- Test: `test/code-indexer/config.test.ts`
- Test: `test/code-indexer/embeddings.test.ts`

- [ ] **Step 1: Add failing config tests**

Add tests that prove:

- `CODE_INDEXER_EMBEDDING_PROVIDER=openai` is accepted.
- `OPENAI_API_KEY` is accepted as the preferred OpenAI key.
- `CODE_INDEXER_EMBEDDING_API_KEY` remains a fallback for OpenAI.
- OpenAI defaults to model `text-embedding-3-small`.
- OpenAI defaults to dimension `1536`.
- `CODE_INDEXER_EMBEDDING_DIMENSION` overrides the default dimension.
- `CODE_INDEXER_EMBEDDING_PROVIDER=http` still requires `CODE_INDEXER_EMBEDDING_URL`.
- Invalid providers still fail clearly.

Run:

```bash
npx vitest run test/code-indexer/config.test.ts
```

Expected before implementation:

- New OpenAI config tests fail because `openai` is not yet an accepted provider.

- [ ] **Step 2: Extend config types and parsing**

Update `CodeIndexerConfig` and `CodeIndexerSearchConfig` so `embeddingProvider` is:

```ts
"hash" | "http" | "openai"
```

Implement provider defaults:

- `hash`: dimension default `384`.
- `http`: dimension default `384`, but production docs should require explicit dimension.
- `openai`: model default `text-embedding-3-small`, dimension default `1536`.

Keep these env names:

- `CODE_INDEXER_EMBEDDING_PROVIDER`
- `CODE_INDEXER_EMBEDDING_API_KEY`
- `CODE_INDEXER_EMBEDDING_MODEL`
- `CODE_INDEXER_EMBEDDING_DIMENSION`
- `CODE_INDEXER_EMBEDDING_URL`
- `OPENAI_API_KEY`

Run:

```bash
npx vitest run test/code-indexer/config.test.ts
```

Expected after implementation:

- Config tests pass.

- [ ] **Step 3: Add failing OpenAI provider tests**

Add tests in `test/code-indexer/embeddings.test.ts` that verify the OpenAI provider:

- Sends `POST https://api.openai.com/v1/embeddings`.
- Sends `Authorization: Bearer <api-key>`.
- Sends body with `input` and `model`.
- Sends `dimensions` only when dimension is explicitly configured.
- Parses OpenAI-style `{"data":[{"embedding":[...]}]}` responses.
- Throws on HTTP errors.
- Throws when response vector length differs from configured dimension.

Run:

```bash
npx vitest run test/code-indexer/embeddings.test.ts
```

Expected before implementation:

- New OpenAI provider tests fail because the provider class/factory path does not exist.

- [ ] **Step 4: Implement OpenAI provider**

Add `OpenAiEmbeddingProvider` in `src/code-indexer/embeddings.ts` using `fetch`, not the OpenAI SDK.

Required behavior:

- Constructor requires `apiKey`, `model`, and `dimension`.
- Default URL is `https://api.openai.com/v1/embeddings`.
- `embedDocuments(texts)` sends all texts as one request.
- `embedQuery(text)` sends one-element input.
- The request includes:

```json
{
  "input": ["text"],
  "model": "text-embedding-3-small"
}
```

- If dimension was explicitly configured, include:

```json
{
  "dimensions": 1536
}
```

- Reuse the existing OpenAI-style response parsing path already supported by `HttpJsonEmbeddingProvider`.

Run:

```bash
npx vitest run test/code-indexer/embeddings.test.ts
```

Expected after implementation:

- Embedding provider tests pass.

- [ ] **Step 5: Wire runtime factory**

Update `createEmbeddingProviderFromConfig` in `src/code-indexer/runtime.ts`:

- `hash` creates `HashEmbeddingProvider`.
- `http` creates `HttpJsonEmbeddingProvider`.
- `openai` creates `OpenAiEmbeddingProvider`.

Run:

```bash
npx vitest run test/code-indexer/config.test.ts test/code-indexer/embeddings.test.ts
```

Expected:

- Both config and embeddings suites pass.

## Task 3: Add Search API Authentication

**Files:**
- Modify: `src/code-indexer/config.ts`
- Modify: `src/code-indexer/server.ts`
- Test: `test/code-indexer/config.test.ts`
- Test: add or extend `test/code-indexer/server.test.ts`

- [ ] **Step 1: Add failing tests**

Add tests proving:

- When `CODE_INDEXER_SEARCH_API_KEY` is unset, `POST /search` keeps current behavior.
- When `CODE_INDEXER_SEARCH_API_KEY` is set, missing `Authorization` returns `401`.
- When the header is `Authorization: Bearer wrong`, `POST /search` returns `401`.
- When the header is `Authorization: Bearer <configured-key>`, `POST /search` proceeds.

Run:

```bash
npx vitest run test/code-indexer
```

Expected before implementation:

- Search auth tests fail because the server has no search auth option.

- [ ] **Step 2: Implement optional search auth**

Add optional config field:

```ts
searchApiKey?: string;
```

Read it from:

```bash
CODE_INDEXER_SEARCH_API_KEY
```

Pass `searchApiKey` into `buildCodeIndexerServer`. In `POST /search`, enforce auth only when `searchApiKey` is set.

Auth policy:

- Required header: `Authorization: Bearer <token>`.
- Invalid/missing token returns:

```json
{
  "error": "unauthorized",
  "status": "error"
}
```

with HTTP status `401`.

Run:

```bash
npx vitest run test/code-indexer
```

Expected after implementation:

- Code-indexer tests pass.

## Task 4: Add Code-Indexer Scripts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` only through npm if the package manager changes it
- Test: package script execution

- [ ] **Step 1: Add package scripts**

Add scripts:

```json
{
  "dev:code-indexer": "tsx watch src/code-indexer/index.ts",
  "start:code-indexer": "node --experimental-specifier-resolution=node --enable-source-maps dist/code-indexer/index.js",
  "mcp:code-indexer": "node --experimental-specifier-resolution=node --enable-source-maps dist/code-indexer/mcpServer.js",
  "test:code-indexer": "vitest run test/code-indexer",
  "test:integration:code-indexer": "vitest run test/integration/CodeIndexerSmoke.test.ts"
}
```

Run:

```bash
npm run test:code-indexer
npm run build
```

Expected:

- Script `test:code-indexer` runs and passes.
- Build emits `dist/code-indexer/index.js` and `dist/code-indexer/mcpServer.js`.

## Task 5: Add CI Smoke With setup-local-ydb

**Files:**
- Modify: `.github/workflows/ci-integration.yml`
- Optional docs update: `docs/evaluation-and-ci.md`

- [ ] **Step 1: Add workflow job**

Add a separate job in `.github/workflows/ci-integration.yml`:

```yaml
  code_indexer_smoke:
    name: Code indexer smoke (setup-local-ydb)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Setup local YDB
        id: ydb
        uses: astandrik/setup-local-ydb@v1
        with:
          version: 26.1.1.6
          tenant: /local/code-indexer
          auth: false

      - name: Run code-indexer integration smoke
        run: npm run test:integration:code-indexer
        env:
          YDB_QDRANT_ENDPOINT: ${{ steps.ydb.outputs.endpoint }}
          YDB_QDRANT_DATABASE: ${{ steps.ydb.outputs.database }}
          YDB_ANONYMOUS_CREDENTIALS: "1"
          CODE_INDEXER_EMBEDDING_PROVIDER: hash
```

Run locally before pushing:

```bash
npm run test:integration:code-indexer
```

Expected:

- Local smoke passes when local YDB env is available.
- CI job uses action outputs `endpoint` and `database`.

## Task 6: Update Documentation And Developer Program Positioning

**Files:**
- Modify: `docs/github-app-code-indexer.md`
- Modify: `README.md`
- Optional modify: `docs/evaluation-and-ci.md`

- [ ] **Step 1: Update embeddings docs**

Document three embedding modes:

- `hash`: local tests and demos only.
- `openai`: recommended production default.
- `http`: custom OpenAI-compatible or generic JSON provider.

Include OpenAI config example:

```bash
export CODE_INDEXER_EMBEDDING_PROVIDER=openai
export OPENAI_API_KEY=<openai-api-key>
export CODE_INDEXER_EMBEDDING_MODEL=text-embedding-3-small
export CODE_INDEXER_EMBEDDING_DIMENSION=1536
```

Include custom HTTP config example:

```bash
export CODE_INDEXER_EMBEDDING_PROVIDER=http
export CODE_INDEXER_EMBEDDING_URL=https://embedding-service.example.com/embed
export CODE_INDEXER_EMBEDDING_API_KEY=<api-key>
export CODE_INDEXER_EMBEDDING_MODEL=<model-name>
export CODE_INDEXER_EMBEDDING_DIMENSION=<provider-dimension>
```

- [ ] **Step 2: Update runtime docs**

Document:

- `npm run dev:code-indexer`
- `npm run start:code-indexer`
- `npm run mcp:code-indexer`
- `npm run test:code-indexer`
- `npm run test:integration:code-indexer`
- `CODE_INDEXER_SEARCH_API_KEY`
- Docker command override for running the code-indexer service instead of the core server.

- [ ] **Step 3: Update Developer Program wording**

Document this position:

- The current target is a self-hosted GitHub App MVP.
- The project is intended for the active GitHub Developer Program track.
- GitHub Marketplace is a future track, not a current release requirement.
- Minimum App permissions remain `Metadata: read`, `Contents: read`, `Pull requests: read`; `Checks: write` stays optional.

Run:

```bash
rg -n "CODE_INDEXER_EMBEDDING_PROVIDER|CODE_INDEXER_SEARCH_API_KEY|dev:code-indexer|Developer Program|Marketplace" docs README.md
```

Expected:

- Docs contain OpenAI, custom HTTP, search auth, script usage, and Developer Program positioning.
- Docs do not claim Marketplace availability.

## Task 7: Real GitHub App E2E Verification

**Files:**
- No code changes required unless E2E reveals bugs.
- Record any findings in `docs/github-app-code-indexer.md`.

- [ ] **Step 1: Configure test GitHub App**

Use:

- App name: `YDB Qdrant Code Indexer`
- Webhook URL: staging URL or HTTPS tunnel to `http://localhost:8090/github/webhook`
- Webhook secret: value used in `GITHUB_WEBHOOK_SECRET`
- Permissions: `Metadata: read`, `Contents: read`, `Pull requests: read`
- Optional permission only when testing Checks: `Checks: write`
- Events: `installation`, `installation_repositories`, `push`, `pull_request`
- Optional event only when testing Checks: `check_run`

- [ ] **Step 2: Run service**

Run:

```bash
npm run dev:code-indexer
```

Required env:

```bash
export GITHUB_APP_ID=<app-id>
export GITHUB_PRIVATE_KEY_FILE=/abs/path/github-app-private-key.pem
export GITHUB_WEBHOOK_SECRET=<webhook-secret>
export YDB_QDRANT_ENDPOINT=<endpoint>
export YDB_QDRANT_DATABASE=<database>
export YDB_ANONYMOUS_CREDENTIALS=1
export CODE_INDEXER_EMBEDDING_PROVIDER=openai
export OPENAI_API_KEY=<openai-api-key>
export CODE_INDEXER_SEARCH_API_KEY=<local-search-token>
```

- [ ] **Step 3: Verify flows**

Verify these scenarios:

- Install app on a test repository: full index job is enqueued and completed.
- Push to default branch: incremental push job updates changed files.
- Open PR: PR-scoped collection is indexed.
- Synchronize PR: PR-scoped collection refreshes.
- Close PR: PR-scoped collection is deleted.
- Search default collection through `POST /search` with `Authorization: Bearer <local-search-token>`.
- Search through MCP with `npm run mcp:code-indexer`.

Expected:

- GitHub webhook deliveries receive `2xx`.
- Search returns paths and line ranges from the indexed repository.
- Logs do not include GitHub private key, webhook secret, installation token, OpenAI key, embeddings, or full file content.

## Task 8: Final Verification And Commit

**Files:**
- All files touched by Tasks 1-7.

- [ ] **Step 1: Run final local verification**

Run:

```bash
npm run typecheck
npm run lint
npm run test:code-indexer
npm test
npm run build
```

Expected:

- All commands pass.

- [ ] **Step 2: Run integration smoke**

Run when local YDB env is available:

```bash
npm run test:integration:code-indexer
```

Expected:

- Smoke indexes fixture code into YDB-backed qdrant storage and search returns the expected source path.

- [ ] **Step 3: Commit the feature scope**

Review:

```bash
git status --short -uall
git diff --stat
```

Commit only the code-indexer feature scope:

```bash
git add Dockerfile README.md package.json package-lock.json \
  docs/github-app-code-indexer.md \
  docs/github-app-code-indexer-plan.md \
  docs/code-indexer-chunking-plan.md \
  docs/superpowers/plans/2026-05-25-code-indexer-mvp-finish.md \
  src/code-indexer \
  test/code-indexer \
  test/integration/CodeIndexerSmoke.test.ts \
  .github/workflows/ci-integration.yml

git commit -m "feat: add GitHub App code indexer MVP"
```

Expected:

- Commit contains code-indexer MVP, OpenAI/custom embeddings support, search auth, CI smoke, scripts, and docs.
- Unrelated logger/server-test changes are either excluded or committed separately with their own rationale.

## Acceptance Criteria

- Code-indexer source and tests are tracked.
- `npm run test:code-indexer`, `npm run typecheck`, `npm test`, and `npm run build` pass.
- Code-indexer smoke can run in CI via `astandrik/setup-local-ydb@v1`.
- OpenAI embeddings are first-class and documented as the recommended production path.
- Custom HTTP embeddings remain supported and documented.
- Hash embeddings remain available for tests/local demos and are not described as production semantic search.
- `/search` can be protected with `CODE_INDEXER_SEARCH_API_KEY`.
- Developer Program positioning is documented; Marketplace is explicitly future work.
