# Code Indexer Public SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current self-hosted GitHub App MVP into a public hosted SaaS that any GitHub user or organization can install and use from coding agents through a hosted MCP endpoint.

**Architecture:** Keep the code-indexer backend in this repository as the authoritative API, webhook, queue, search, auth, and hosted MCP service. Add public onboarding/dashboard pages to `ydb-qdrant-ui`, which stays a static Next.js export and talks to the backend over HTTPS. Store GitHub app state, sessions, tokens, repository status, quotas, and audit data in YDB next to the existing code-indexer durable state tables.

**Tech Stack:** Node.js 18+, TypeScript ESM, Express 5, YDB SDK, existing `ydb-qdrant` npm API, GitHub App OAuth, hosted OpenAI-compatible embeddings through the existing proxy path, static Next.js UI in `/Users/astandrik/workspace/ydb-qdrant-ui`.

---

## Decisions Locked

- Launch target: public open beta, not invite-only.
- Distribution: hosted SaaS first; self-hosted docs remain supported but are not the primary onboarding path.
- GitHub App availability: `Any account`.
- Agent entrypoint: hosted MCP endpoint on `https://code-indexer.ydb-qdrant.tech/mcp`.
- Embeddings: hosted OpenAI-compatible provider with service-owned API key/proxy and hard quotas; user BYOK is a later feature.
- Indexed data: store snippets, vectors, and GitHub metadata by default.
- UI home: add Code Indexer pages to `ydb-qdrant-ui`.
- Marketplace: not part of first public beta. Marketplace-readiness work is limited to privacy/support/status foundations.

## External Requirements To Respect

- GitHub setup URLs include an `installation_id`, but GitHub warns that this value can be spoofed. The backend must verify the installation through GitHub user authorization before trusting it.
  Source: <https://docs.github.com/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/about-the-setup-url>
- For GitHub App OAuth, store client secrets, private keys, access tokens, and refresh tokens securely; user access tokens may expire and require refresh.
  Source: <https://docs.github.com/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app>
- Remote MCP should use Streamable HTTP and proper authentication. The MCP transport spec also calls out Origin validation and authentication for HTTP transports.
  Source: <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>
- Marketplace listing is a later track because GitHub requires privacy policy, support contact, pricing plan, public availability, and other listing requirements before publication.
  Source: <https://docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app>

## Current Verified State

- Backend MVP already exists under `src/code-indexer`.
- Existing public endpoints: `GET /health`, `POST /github/webhook`, `POST /search`.
- Existing MCP server is stdio-only and exposes `search_code`.
- Durable YDB tables already exist for deliveries, jobs, and manifests:
  - `qdrant_code_indexer_deliveries`
  - `qdrant_code_indexer_jobs`
  - `qdrant_code_indexer_manifests`
- Existing webhook handling covers `installation`, `installation_repositories`, default-branch `push`, `pull_request`, and `check_run.rerequested`.
- Production instance currently runs at `https://code-indexer.ydb-qdrant.tech`.
- Existing UI repo is a static Next.js export at `/Users/astandrik/workspace/ydb-qdrant-ui`; backend auth/API logic must not rely on Next.js server routes.

## File Structure

### Backend: `/Users/astandrik/workspace/ydb-qdrant`

- Create `src/code-indexer/auth.ts`
  - GitHub OAuth URL generation, callback exchange, token refresh, signed state validation, session cookie helpers.
- Create `src/code-indexer/saasStore.ts`
  - YDB table creation and CRUD for users, sessions, installations, repositories, MCP/API tokens, quotas, and audit logs.
- Create `src/code-indexer/accessControl.ts`
  - Resolve a dashboard session or MCP token to allowed installations/repositories.
- Create `src/code-indexer/publicApi.ts`
  - Authenticated dashboard API routes under `/api/*`.
- Create `src/code-indexer/mcpHttp.ts`
  - Hosted MCP Streamable HTTP endpoint, auth, Origin validation, JSON-RPC dispatch to the existing MCP tool logic.
- Create `src/code-indexer/quota.ts`
  - Quota checks and daily usage counters for indexing and search.
- Modify `src/code-indexer/config.ts`
  - Add SaaS auth, public base URL, allowed origins, quota, and OpenAI/proxy env vars.
- Modify `src/code-indexer/server.ts`
  - Wire OAuth routes, public API routes, hosted MCP route, secure cookie parsing, and CORS/origin handling.
- Modify `src/code-indexer/webhooks.ts`
  - Correctly distinguish installation created/deleted/suspended/repositories changes.
- Modify `src/code-indexer/repoIndexer.ts`
  - Report repository status/chunk counts/last error through the SaaS store.
- Modify `src/code-indexer/searchAdapter.ts`
  - Add an access-checked search path that accepts `owner/repo` and resolves repo ids internally.
- Modify `src/code-indexer/mcp.ts`
  - Allow `search_code` input to use `owner`, `repo`, optional `prNumber`, `query`, and `top`; keep numeric ids as backward-compatible input.
- Add tests under `test/code-indexer`.
- Add integration tests under `test/integration`.

### UI: `/Users/astandrik/workspace/ydb-qdrant-ui`

- Create `src/app/code-indexer/page.tsx`
  - Public landing/onboarding page with GitHub App install CTA.
- Create `src/app/code-indexer/dashboard/page.tsx`
  - Dashboard shell that calls backend API.
- Create `src/components/CodeIndexer/*`
  - Install card, repository status list, MCP config card, token manager, privacy/delete-data panel.
- Modify localized copy under existing component locale patterns.
- Modify deployment/docs only after backend routes are live.

### GitHub App Settings

- Set Homepage URL to `https://ydb-qdrant.tech/code-indexer/`.
- Set Callback URL to `https://code-indexer.ydb-qdrant.tech/github/oauth/callback`.
- Enable "Request user authorization (OAuth) during installation".
- Enable expiring user authorization tokens.
- Leave Setup URL empty in this mode; GitHub disables Setup URL and redirects installers through the first Callback URL.
- Leave "Redirect on update" disabled for the first beta; repository add/remove updates are handled by webhooks.
- Set Webhook URL to `https://code-indexer.ydb-qdrant.tech/github/webhook`.
- Permissions:
  - Repository `Metadata: read`
  - Repository `Contents: read`
  - Repository `Pull requests: read`
  - Repository `Checks: write`
- Events:
  - `Installation target`
  - `Meta`
  - `Installation`
  - `Installation repositories`
  - `Push`
  - `Pull request`
  - `Check run`
  - `GitHub App authorization` if available in the settings UI
- Installation target: `Any account`.

## Tasks

### Task 1: Add SaaS Configuration

**Files:**
- Modify: `src/code-indexer/config.ts`
- Test: `test/code-indexer/config.test.ts`

- [x] Add these required env vars:
  - `CODE_INDEXER_PUBLIC_BASE_URL`, example `https://code-indexer.ydb-qdrant.tech`
  - `CODE_INDEXER_UI_ORIGIN`, example `https://ydb-qdrant.tech`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `CODE_INDEXER_SESSION_SECRET`
  - `CODE_INDEXER_TOKEN_PEPPER`

- [x] Add these optional env vars with defaults:
  - `CODE_INDEXER_SESSION_TTL_SECONDS=2592000`
  - `CODE_INDEXER_OAUTH_STATE_TTL_SECONDS=600`
  - `CODE_INDEXER_JOB_CONCURRENCY=2`
  - `CODE_INDEXER_QUOTA_REPOS_PER_INSTALLATION=1000`
  - `CODE_INDEXER_QUOTA_FILES_PER_REPO=1000000`
  - `CODE_INDEXER_QUOTA_CHUNKS_PER_REPO=5000000`
  - `CODE_INDEXER_QUOTA_SEARCHES_PER_USER_PER_DAY=100000`
  - `CODE_INDEXER_ALLOWED_MCP_ORIGINS=https://ydb-qdrant.tech`

- [x] Test missing required env vars fail fast with exact error messages.

- [x] Test defaults are applied when optional env vars are absent.

- [x] Run:

```bash
npx vitest run test/code-indexer/config.test.ts
```

Expected: config tests pass.

- [x] Commit:

```bash
git add src/code-indexer/config.ts test/code-indexer/config.test.ts
git commit -m "feat: add code indexer saas config"
```

### Task 2: Add SaaS YDB Store

**Files:**
- Create: `src/code-indexer/saasStore.ts`
- Test: `test/code-indexer/saasStore.test.ts`
- Integration test: `test/integration/CodeIndexerSaasStore.test.ts`

- [x] Implement YDB-backed store using the existing `withSession`, `TableDescription`, `Column`, `Types`, `TypedValues`, and query settings helpers.

- [x] Create and validate these tables:
  - `qdrant_code_indexer_users`
  - `qdrant_code_indexer_sessions`
  - `qdrant_code_indexer_installations`
  - `qdrant_code_indexer_repositories`
  - `qdrant_code_indexer_api_tokens`
  - `qdrant_code_indexer_usage_daily`
  - `qdrant_code_indexer_audit_log`

- [x] Store GitHub access and refresh tokens only as ciphertext; store MCP/API tokens only as SHA-256 HMAC hashes using `CODE_INDEXER_TOKEN_PEPPER`.

- [x] Expose methods for:
  - upserting GitHub users
  - creating/getting/deleting sessions
  - upserting installations and repositories
  - marking repositories `queued`, `indexing`, `ready`, `failed`, or `deleted`
  - creating/listing/revoking tokens
  - incrementing daily usage counters
  - appending audit log entries

- [x] Unit-test serialization, token hashing, session expiry, and repository status transitions with memory/fake query adapters.

- [x] Integration-test table bootstrap and basic CRUD against local YDB.

- [x] Run:

```bash
npm run test:code-indexer
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
```

Expected: code-indexer tests and integration smoke pass.

- [x] Commit:

```bash
git add src/code-indexer/saasStore.ts test/code-indexer/saasStore.test.ts test/integration/CodeIndexerSaasStore.test.ts
git commit -m "feat: persist code indexer saas state"
```

### Task 3: Add GitHub OAuth And Sessions

**Files:**
- Create: `src/code-indexer/auth.ts`
- Modify: `src/code-indexer/server.ts`
- Test: `test/code-indexer/auth.test.ts`
- Test: `test/code-indexer/server.auth.test.ts`

- [x] Add `GET /github/oauth/start`.
  - Generate signed state containing return path and optional installation id.
  - Redirect to GitHub with `client_id`, `redirect_uri`, and `state`.

- [x] Add `GET /github/oauth/callback`.
  - Verify state.
  - Exchange `code` for GitHub App user access token and refresh token.
  - Fetch authenticated GitHub user.
  - If `installation_id` is present, verify through GitHub API that the user can access that installation before linking it.
  - Create secure session cookie named `__Host-ydbqci_session`.
  - Redirect to `https://ydb-qdrant.tech/code-indexer/dashboard/`.

- [x] Cookie requirements:
  - `HttpOnly`
  - `Secure`
  - `SameSite=Lax`
  - `Path=/`
  - no `Domain` attribute

- [x] Add `POST /api/logout` to revoke the session cookie and delete the session row.

- [x] Test state tampering, expired state, missing code, GitHub token exchange failure, and successful callback.

- [x] Run:

```bash
npx vitest run test/code-indexer/auth.test.ts test/code-indexer/server.auth.test.ts
```

Expected: auth tests pass.

- [x] Commit:

```bash
git add src/code-indexer/auth.ts src/code-indexer/server.ts test/code-indexer/auth.test.ts test/code-indexer/server.auth.test.ts
git commit -m "feat: add github oauth for code indexer"
```

### Task 4: Add Access-Controlled Public API

**Files:**
- Create: `src/code-indexer/accessControl.ts`
- Create: `src/code-indexer/publicApi.ts`
- Modify: `src/code-indexer/server.ts`
- Test: `test/code-indexer/publicApi.test.ts`

- [x] Add session-authenticated endpoints:
  - `GET /api/me`
  - `GET /api/installations`
  - `GET /api/repositories?installationId=<id>`
  - `POST /api/repositories/:repoId/reindex`
  - `POST /api/tokens`
  - `GET /api/tokens`
  - `DELETE /api/tokens/:tokenId`
  - `POST /api/privacy/delete-my-data`

- [x] Enforce that a user can see/search/reindex only repositories belonging to installations linked to that GitHub user.

- [x] Generate MCP/API tokens once, return plaintext only in the creation response, and persist only token hash.

- [x] `POST /api/privacy/delete-my-data` must delete sessions, tokens, user row, and all installations/repositories where the user is the only linked owner; it must also enqueue/delete indexed YDB collections for those repositories.

- [x] Test 401 unauthenticated, 403 unauthorized repo access, token creation/revocation, reindex enqueue, and delete-my-data behavior.

- [x] Run:

```bash
npx vitest run test/code-indexer/publicApi.test.ts
```

Expected: public API tests pass.

- [x] Commit:

```bash
git add src/code-indexer/accessControl.ts src/code-indexer/publicApi.ts src/code-indexer/server.ts test/code-indexer/publicApi.test.ts
git commit -m "feat: add code indexer public api"
```

### Task 5: Fix Public Webhook Lifecycle Semantics

**Files:**
- Modify: `src/code-indexer/webhooks.ts`
- Modify: `src/code-indexer/repoIndexer.ts`
- Test: `test/code-indexer/webhooks.test.ts`
- Test: `test/code-indexer/repoIndexer.test.ts`

- [x] Update installation event mapping:
  - `created`: full-index selected repositories.
  - `deleted`: delete all repository and PR collections for the installation.
  - `suspend`: mark installation suspended and stop enqueueing new index jobs.
  - `unsuspend`: mark installation active and enqueue full-index selected repositories.

- [x] Update `installation_repositories` mapping:
  - added repositories enqueue full-index.
  - removed repositories enqueue delete-repo-index.

- [x] Persist repository status:
  - queued before job starts.
  - indexing while running.
  - ready with `lastIndexedSha`, `chunkCount`, `lastIndexedAt` on success.
  - failed with sanitized error text on final failure.
  - deleted on repo removal or uninstall.

- [x] Test uninstall deletes collections instead of indexing.

- [x] Run:

```bash
npx vitest run test/code-indexer/webhooks.test.ts test/code-indexer/repoIndexer.test.ts
```

Expected: webhook lifecycle tests pass.

- [x] Commit:

```bash
git add src/code-indexer/webhooks.ts src/code-indexer/repoIndexer.ts test/code-indexer/webhooks.test.ts test/code-indexer/repoIndexer.test.ts
git commit -m "fix: handle public github app lifecycle"
```

### Task 6: Add Quotas And Hosted Embedding Cost Control

**Files:**
- Create: `src/code-indexer/quota.ts`
- Modify: `src/code-indexer/repoIndexer.ts`
- Modify: `src/code-indexer/searchAdapter.ts`
- Modify: `src/code-indexer/publicApi.ts`
- Test: `test/code-indexer/quota.test.ts`

- [x] Enforce public beta quotas:
  - max 1,000 repositories per installation.
  - max 1,000,000 indexed files per repository.
  - max 5,000,000 chunks per repository.
  - max 100,000 searches per user per UTC day.

- [x] Return deterministic API errors:
  - HTTP 429 for search quota exceeded.
  - HTTP 422 for repository/file/chunk quota exceeded.

- [x] Count usage before expensive embedding/search work where possible.

- [x] Log quota denials with user id, installation id, repo id, metric, and limit; never log code snippets or tokens.

- [x] Test every quota boundary at `limit - 1`, `limit`, and `limit + 1`.

- [x] Run:

```bash
npx vitest run test/code-indexer/quota.test.ts
```

Expected: quota tests pass.

- [x] Commit:

```bash
git add src/code-indexer/quota.ts src/code-indexer/repoIndexer.ts src/code-indexer/searchAdapter.ts src/code-indexer/publicApi.ts test/code-indexer/quota.test.ts
git commit -m "feat: add code indexer public beta quotas"
```

### Task 7: Add Hosted MCP Endpoint

**Files:**
- Create: `src/code-indexer/mcpHttp.ts`
- Modify: `src/code-indexer/mcp.ts`
- Modify: `src/code-indexer/server.ts`
- Test: `test/code-indexer/mcpHttp.test.ts`
- Test: `test/code-indexer/mcp.test.ts`

- [x] Add `POST /mcp`.
  - Require `Authorization: Bearer <mcp-token>`.
  - Require allowed `Origin` for browser-originated requests.
  - Accept one JSON-RPC request per POST.
  - Return `application/json`.

- [x] Add `GET /mcp`.
  - Return a minimal SSE-compatible response for clients that probe Streamable HTTP.
  - Reject unauthenticated requests.

- [x] Extend `search_code` input schema:
  - Preferred: `owner`, `repo`, `query`, optional `prNumber`, optional `top`.
  - Backward-compatible: `installationId`, `repoId`, `query`, optional `prNumber`, optional `top`.

- [x] Resolve `owner/repo` to installation/repo only if the token owner has access.

- [x] Test initialize, tools/list, tools/call, invalid token, revoked token, disallowed origin, unknown repo, and successful search.

- [x] Run:

```bash
npx vitest run test/code-indexer/mcp.test.ts test/code-indexer/mcpHttp.test.ts
```

Expected: MCP tests pass.

- [x] Commit:

```bash
git add src/code-indexer/mcp.ts src/code-indexer/mcpHttp.ts src/code-indexer/server.ts test/code-indexer/mcp.test.ts test/code-indexer/mcpHttp.test.ts
git commit -m "feat: expose hosted code indexer mcp"
```

### Task 8: Add Dashboard UI

**Files:**
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/page.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/dashboard/page.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexerLanding.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexerDashboard.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexer.scss`
- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/page.tsx`

- [x] Landing page content:
  - Explain: install GitHub App, index repos into YDB-backed Qdrant-compatible storage, connect coding agents through hosted MCP.
  - Primary CTA: GitHub App install URL.
  - Secondary CTA: dashboard login URL.

- [x] Dashboard content:
  - Current GitHub user.
  - Installations and repositories.
  - Status per repo: queued, indexing, ready, failed, deleted.
  - Last indexed SHA/time and chunk count.
  - Reindex button.
  - MCP token creation/revocation.
  - Copyable MCP config:

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

- [x] Use existing Gravity UI and SCSS/BEM patterns from the UI repo.

- [x] Run:

```bash
cd /Users/astandrik/workspace/ydb-qdrant-ui
npm run lint
npm run build
```

Expected: UI lint and static export build pass.

- [x] Commit in `ydb-qdrant-ui`:

```bash
git add src/app/code-indexer src/components/CodeIndexer src/app/page.tsx
git commit -m "feat: add code indexer public dashboard"
```

### Task 9: Add Privacy, Support, And Operational Pages

**Files:**
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/privacy/page.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/support/page.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/status/page.tsx`
- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/Footer.tsx`

- [x] Privacy page must explicitly state stored data:
  - GitHub account/repository metadata.
  - Code snippets selected by repository permissions/config.
  - Embedding vectors.
  - MCP/API tokens as hashes only.
  - Usage and audit logs.

- [x] Privacy page must state deletion behavior:
  - uninstall deletes indexed collections for removed repositories.
  - dashboard delete-data removes user/session/token data and indexed repo data where eligible.

- [x] Support page must include a support email or GitHub issue link.

- [x] Status page must show current public endpoints and link to `GET /health`.

- [x] Run:

```bash
cd /Users/astandrik/workspace/ydb-qdrant-ui
npm run lint
npm run build
```

Expected: UI lint and static export build pass.

- [x] Commit in `ydb-qdrant-ui`:

```bash
git add src/app/code-indexer/privacy src/app/code-indexer/support src/app/code-indexer/status src/components/Footer.tsx
git commit -m "docs: add code indexer public policies"
```

### Task 10: Add End-To-End Public Beta Verification

**Files:**
- Create: `test/integration/CodeIndexerPublicSaas.test.ts`
- Modify: `.github/workflows/ci-integration.yml`
- Modify: `docs/github-app-code-indexer.md`

- [x] Add integration test with local YDB and mocked GitHub/OpenAI:
  - OAuth callback creates user and session.
  - Installation event creates repository rows and indexing jobs.
  - Indexing writes chunks and status.
  - MCP token can search by `owner/repo`.
  - Revoked token cannot search.
  - Uninstall deletes indexed data.

- [x] Add CI job using `astandrik/setup-local-ydb@v1`.

- [x] Update docs with:
  - Public SaaS setup.
  - Self-hosted setup.
  - GitHub App permissions/events.
  - MCP config.
  - Quotas and data retention.

- [x] Run:

```bash
npm run lint
npm run typecheck
npm test
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
npm run build
```

Expected: lint, typecheck, unit tests, code-indexer integration tests, and build pass.

- [x] Commit:

```bash
git add test/integration/CodeIndexerPublicSaas.test.ts .github/workflows/ci-integration.yml docs/github-app-code-indexer.md
git commit -m "test: cover code indexer public saas flow"
```

### Task 11: Deploy Staging And Run Real GitHub App E2E

**Files:**
- Modify only deployment config/scripts that already exist on the target server.

- [x] Deploy backend to staging/prod host with new env vars:
  - `CODE_INDEXER_PUBLIC_BASE_URL=https://code-indexer.ydb-qdrant.tech`
  - `CODE_INDEXER_UI_ORIGIN=https://ydb-qdrant.tech`
  - `GITHUB_CLIENT_ID=<current GitHub App client id>`
  - `GITHUB_CLIENT_SECRET=<new client secret>`
  - `CODE_INDEXER_SESSION_SECRET=<random 32+ byte secret>`
  - `CODE_INDEXER_TOKEN_PEPPER=<random 32+ byte secret>`
  - hosted OpenAI/proxy env vars.

- [x] Update reverse proxy:
  - `https://code-indexer.ydb-qdrant.tech/github/*` to backend.
  - `https://code-indexer.ydb-qdrant.tech/api/*` to backend.
  - `https://code-indexer.ydb-qdrant.tech/mcp` to backend.

- [x] Deploy UI static export to `https://ydb-qdrant.tech`.

- [x] Real E2E:
  - [x] Open `https://ydb-qdrant.tech/code-indexer/`.
  - [x] Install GitHub App into a test repository.
  - [x] Complete OAuth callback.
  - [x] Confirm dashboard shows repository status.
  - [x] Push a test file / run manual reindex and confirm status returns to ready.
  - [x] Create MCP token.
  - [x] Call hosted MCP `search_code` by `owner/repo`.
  - [x] Revoke token and confirm MCP search fails.
  - [x] Uninstall App and confirm indexed collection is deleted.

- [x] Record evidence in `docs/github-app-code-indexer.md`.

- [x] Commit docs evidence:

```bash
git add docs/github-app-code-indexer.md
git commit -m "docs: record code indexer public beta verification"
```

Evidence recorded on 2026-05-25:

- Backend image `ydb-qdrant-code-indexer:99d0779` is deployed on `111.88.152.4`; public health returns `{"status":"ok"}` and Docker health is `healthy`.
- Dashboard API returns `astandrik/local-ydb-toolkit` as `ready`, `chunkCount=909`, `lastIndexedAt=2026-05-25T11:50:01.923Z`.
- Hosted MCP search by `owner/repo` returned indexed chunks; revoked token returned `401`.
- UI static export commit `02ea6b2` is deployed to `https://ydb-qdrant.tech`; deployment backup is `/home/astandrik/ydb-qdrant-ui-out-20260525-121337.tgz`.
- Public checks confirmed:
  - `https://ydb-qdrant.tech/` includes the hero `Code Indexer` link and home promo.
  - `https://ydb-qdrant.tech/ru/` includes the hero `Code Indexer` link and localized home promo.
  - `https://ydb-qdrant.tech/code-indexer/` returns `200` with canonical, OpenGraph, and Twitter metadata.
  - `https://ydb-qdrant.tech/code-indexer/dashboard/` includes `noindex, nofollow`.
  - `https://ydb-qdrant.tech/sitemap.xml` lists public Code Indexer pages.
  - `https://ydb-qdrant.tech/robots.txt` disallows `/code-indexer/dashboard/` and points to the sitemap.
- Manual reindex diagnosis on 2026-05-25:
  - Durable job `manual:e05d5d8f-dbdc-42de-9be1-046381a83cf7` was processed and completed.
  - Repository `astandrik/local-ydb-toolkit` is `ready`, `chunkCount=909`, `lastIndexedAt=2026-05-25T12:15:36.951Z`.
  - Follow-up manual job `manual:a50e30ca-1dc3-4de0-9772-a405899ff514` also completed; repository status stayed `ready`, `chunkCount=909`, `lastIndexedAt=2026-05-25T12:24:49.727Z`.
  - UX gap found: dashboard queued a reindex but did not poll repository status, making progress hard to see.
  - UI fix commit `94dd116` is deployed; dashboard now optimistically shows queued status, disables duplicate reindex clicks, and auto-refreshes active indexing status.
  - Deployment backup for the UX fix is `/home/astandrik/ydb-qdrant-ui-out-20260525-122328.tgz`.
- Job progress implementation and deploy on 2026-05-25:
  - Backend commit `71769a6` added durable job progress in `qdrant_code_indexer_job_progress`, `GET /api/jobs/:jobId`, `activeJob` on repository responses, and progress reporting from the indexer.
  - Backend commit `b696748` fixed active-job selection to prefer a currently `running` job over older queued records for the same repository.
  - Current production backend image is `ydb-qdrant-code-indexer:b696748` on `111.88.152.4`; `https://code-indexer.ydb-qdrant.tech/health` returned `{"status":"ok"}` and Docker reports the container as `healthy`.
  - UI commit `6b06045` renders phase, counters, current path, stale state, and errors from `activeJob`; static export was deployed to `https://ydb-qdrant.tech`.
  - UI deploy backup is `/home/astandrik/ydb-qdrant-ui-out-20260525-130903.tgz`.
  - Production progress row `manual:5bfb5282-a554-4aa1-92e3-c16338739c4f` was observed while running at `phase=upserting`, `processedFiles=20/26`, `processedChunks=83/85`, `currentPath=src/client/utils/AssetManager.ts`.
  - The same job completed with `processedFiles=26/26`, `processedChunks=114/114`, `finishedAt=2026-05-25T13:11:33.562Z`.
  - Follow-up job `manual:09e194e4-92a9-431a-b097-965d1dc5c333` also completed with `processedFiles=26/26`, `processedChunks=114/114`, `finishedAt=2026-05-25T13:12:52.775Z`.
  - After completion, `listActiveJobsForInstallation(135399283)` returned no active rows.
  - A synthetic `check_run.rerequested` webhook delivery was accepted and recorded failed progress with `lastError=GitHub request failed: 422 Unprocessable Entity`; this verifies failure-path persistence, not a successful indexing path.
  - Authenticated dashboard visual verification was not performed by the agent because the available browser session was unauthenticated; deployed UI code and production API/YDB progress rows were verified.
- Queue parallelism implementation and deploy on 2026-05-25:
  - Backend commit `538593c` added bounded repository-level indexing parallelism.
  - `CODE_INDEXER_JOB_CONCURRENCY` defaults to `2`; production is deployed with `CODE_INDEXER_JOB_CONCURRENCY=4`.
  - Jobs for different repositories can run concurrently in one backend process; jobs for the same installation/repository remain serialized to avoid collection and manifest conflicts.
  - Current production backend image is `ydb-qdrant-code-indexer:538593c`; public health returned `{"status":"ok"}` and Docker reports the container as `healthy`.
- Local verification passed: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, and `YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer`.
- UI verification passed in `ydb-qdrant-ui`: `npm run lint`, `npm run build`.
- Fresh audit on 2026-05-25 22:00 MSK:
  - Backend source contains the SaaS modules required by this plan: `auth.ts`, `saasStore.ts`, `accessControl.ts`, `publicApi.ts`, `mcpHttp.ts`, and `quota.ts`.
  - Backend commits exist for Tasks 1-10: `bd242af`, `249acde`, `6306b49`, `bd113f7`, `9623c99`, `d971ac8`, `0ed8384`, `81a47d6`, and `2d1f420`.
  - UI commits exist for Tasks 8-9: `c8de026`, `185d962`, `02ea6b2`, `94dd116`, and `6b06045`.
  - Current production backend container is `ydb-qdrant-code-indexer:admin-dashboard-20260525-205900-amd64`; Docker reports it `healthy`.
  - Production env confirms `CODE_INDEXER_PUBLIC_BASE_URL=https://code-indexer.ydb-qdrant.tech`, `CODE_INDEXER_UI_ORIGIN=https://ydb-qdrant.tech`, `CODE_INDEXER_JOB_CONCURRENCY=4`, and `CODE_INDEXER_ADMIN_GITHUB_USER_IDS=8037318`.
  - Public backend health returned `{"status":"ok"}`.
  - `https://ydb-qdrant.tech/code-indexer/`, `/privacy/`, `/support/`, and `/status/` returned `200`.
  - `https://ydb-qdrant.tech/sitemap.xml` lists `/code-indexer/`, `/code-indexer/privacy/`, `/code-indexer/support/`, and `/code-indexer/status/`.
  - `https://ydb-qdrant.tech/robots.txt` disallows `/code-indexer/dashboard/` and `/code-indexer/admin/`.
  - `https://ydb-qdrant.tech//code-indexer/admin/` redirects to `https://ydb-qdrant.tech/code-indexer/admin/`, avoiding the Next.js `history.replaceState` cross-origin failure.
  - GitHub App read-only API audit for app `3851343` showed current configured events are `pull_request` and `push`, and current permissions are `metadata:read`, `contents:read`, and `pull_requests:read`.
  - Gap vs. the target GitHub App settings: add `Checks: write` and subscribe to lifecycle/check events (`installation`, `installation_repositories`, `check_run`, and any available GitHub App authorization event) before relying on real uninstall/check-run E2E.
  - Follow-up GitHub App API audit after settings update showed events `check_run`, `pull_request`, and `push`; permissions `checks:write`, `contents:read`, `metadata:read`, and `pull_requests:read`. Installation `135399283` has the same visible permissions/events and is not suspended.
  - Fresh local backend verification passed: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:code-indexer`, `npm test`, and `YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer`.
  - Fresh UI verification passed in `ydb-qdrant-ui`: `npm run lint` and `npm run build`.
  - Destructive uninstall E2E was run after the App was uninstalled from `astandrik`: GitHub App API returned an empty installations list.
  - Production backend logs recorded real delivery `b8503720-586d-11f1-8697-fea7439750bd` and four `delete-repo-index` jobs for installation `135399283` and repositories `857065347`, `901628611`, `982758944`, and `1220812874`.
  - Production YDB verification for prefix `gh_installation_135399283/` returned `qdr__collections=0`, `qdrant_all_points=0`, and `qdrant_points_by_file=0`.
  - Production SaaS state shows installation `135399283` as `deleted`; repositories `astandrik/local-ydb-toolkit`, `astandrik/civitai-grabber`, `astandrik/skeleton-killer`, and `astandrik/ai-sandbox` are `deleted` with `chunks=0`.
- Fresh continuation audit on 2026-05-25 22:39 MSK:
  - Backend repo has a clean worktree after commit `edca1d5` (`feat: complete hosted code indexer operations`), covering hosted MCP discovery, admin API, archive-based GitHub reads, concurrency/batching, and related tests.
  - UI repo has a clean worktree after commit `78310d2` (`feat: add code indexer admin dashboard`), covering `/code-indexer/admin/`, dashboard progress improvements, robots, and the `Recent activity` layout fix.
  - Fresh backend verification passed: `npm run typecheck`, `npm run lint`, `npm run test:code-indexer`, `npm run build`, and `npm test`.
  - Fresh UI verification passed: `npm run lint`; `npm run build` passed as part of `scripts/deploy-static.sh`.
  - Public backend health returned `{"status":"ok"}`.
  - Production `https://ydb-qdrant.tech/code-indexer/`, `/dashboard/`, and `/admin/` returned `200`.
  - Anonymous `GET https://github.com/apps/ydb-qdrant-code-indexer` returned a public GitHub App page; anonymous `GET https://github.com/apps/ydb-qdrant-code-indexer/installations/new` redirected to GitHub login with `integration=ydb-qdrant-code-indexer`.
  - GitHub App API currently reports installation `135559688` on account `astandrik`, `repository_selection=selected`, events `check_run`, `pull_request`, and `push`, with permissions `checks:write`, `contents:read`, `metadata:read`, and `pull_requests:read`.
- Remaining external/manual gates:
  - GitHub installation lifecycle behavior has been verified by the real uninstall webhook and delete jobs.
  - Confirm the GitHub App can be installed by any account, not only `@astandrik`. GitHub's public docs state that public GitHub Apps can be installed by other accounts, but the REST `/app` response used for audits does not expose the App visibility setting directly; the strongest remaining proof is either a UI confirmation of `Any account` or a real install from a non-owner account/organization.
  - Destructive real E2E uninstall step has been completed.

Manual GitHub App settings update checklist:

1. Open <https://github.com/settings/apps/ydb-qdrant-code-indexer>.
2. In **Repository permissions**, set:
   - `Metadata`: `Read-only`.
   - `Contents`: `Read-only`.
   - `Pull requests`: `Read-only`.
   - `Checks`: `Read and write`.
3. In **Subscribe to events**, enable at least:
   - `Push`.
   - `Pull request`.
   - `Installation target` if present.
   - `Installation`.
   - `Installation repositories`.
   - `Check run`.
   - `GitHub App authorization` if present.
4. In **Where can this GitHub App be installed?**, select `Any account` if the setting is available for this App.
5. Save changes, then re-run the API audit:

```bash
APP_JWT=$(node -e '
const fs=require("fs"); const crypto=require("crypto");
const key=fs.readFileSync("/Users/astandrik/Downloads/ydb-qdrant-code-indexer.2026-05-25.private-key.pem");
const enc=(o)=>Buffer.from(JSON.stringify(o)).toString("base64url");
const now=Math.floor(Date.now()/1000);
const data=`${enc({alg:"RS256",typ:"JWT"})}.${enc({iat:now-60,exp:now+540,iss:"3851343"})}`;
process.stdout.write(`${data}.${crypto.sign("RSA-SHA256",Buffer.from(data),key).toString("base64url")}`);
')
gh api -H "Authorization: Bearer $APP_JWT" /app \
  --jq '{id,slug,name,external_url,permissions,events}'
```

## Acceptance Criteria

- A user can install the GitHub App from the public landing page.
- The user completes GitHub OAuth and lands in the dashboard.
- The dashboard shows selected repositories and indexing status.
- The service indexes default branch and PR code after GitHub webhooks.
- A user can create and revoke an MCP token.
- Hosted MCP search works with `owner/repo` and does not expose `installationId` or `repoId` to normal users.
- Unauthorized users and revoked tokens cannot search private repository data.
- Public beta quotas prevent unbounded OpenAI/YDB cost.
- Uninstalling the App deletes indexed repository data.
- Privacy/support/status pages are publicly reachable.
- Backend checks pass: `npm run lint`, `npm run typecheck`, `npm test`, `YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer`, `npm run build`.
- UI checks pass in `ydb-qdrant-ui`: `npm run lint`, `npm run build`.

## Self-Review

- Spec coverage: public SaaS, hosted MCP, hosted OpenAI embeddings with quotas, UI onboarding/dashboard, snippets+vectors storage, deletion, and GitHub Developer Program/Marketplace foundations are covered.
- Placeholder scan: no `TBD`, `TODO`, or unresolved implementation choices are intentionally left in the plan.
- Type consistency: endpoint names, table names, env vars, token/session terminology, and repository status values are defined once and reused consistently.
