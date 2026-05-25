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

- [ ] Add these required env vars:
  - `CODE_INDEXER_PUBLIC_BASE_URL`, example `https://code-indexer.ydb-qdrant.tech`
  - `CODE_INDEXER_UI_ORIGIN`, example `https://ydb-qdrant.tech`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `CODE_INDEXER_SESSION_SECRET`
  - `CODE_INDEXER_TOKEN_PEPPER`

- [ ] Add these optional env vars with defaults:
  - `CODE_INDEXER_SESSION_TTL_SECONDS=2592000`
  - `CODE_INDEXER_OAUTH_STATE_TTL_SECONDS=600`
  - `CODE_INDEXER_QUOTA_REPOS_PER_INSTALLATION=10`
  - `CODE_INDEXER_QUOTA_FILES_PER_REPO=10000`
  - `CODE_INDEXER_QUOTA_CHUNKS_PER_REPO=50000`
  - `CODE_INDEXER_QUOTA_SEARCHES_PER_USER_PER_DAY=1000`
  - `CODE_INDEXER_ALLOWED_MCP_ORIGINS=https://ydb-qdrant.tech`

- [ ] Test missing required env vars fail fast with exact error messages.

- [ ] Test defaults are applied when optional env vars are absent.

- [ ] Run:

```bash
npx vitest run test/code-indexer/config.test.ts
```

Expected: config tests pass.

- [ ] Commit:

```bash
git add src/code-indexer/config.ts test/code-indexer/config.test.ts
git commit -m "feat: add code indexer saas config"
```

### Task 2: Add SaaS YDB Store

**Files:**
- Create: `src/code-indexer/saasStore.ts`
- Test: `test/code-indexer/saasStore.test.ts`
- Integration test: `test/integration/CodeIndexerSaasStore.test.ts`

- [ ] Implement YDB-backed store using the existing `withSession`, `TableDescription`, `Column`, `Types`, `TypedValues`, and query settings helpers.

- [ ] Create and validate these tables:
  - `qdrant_code_indexer_users`
  - `qdrant_code_indexer_sessions`
  - `qdrant_code_indexer_installations`
  - `qdrant_code_indexer_repositories`
  - `qdrant_code_indexer_api_tokens`
  - `qdrant_code_indexer_usage_daily`
  - `qdrant_code_indexer_audit_log`

- [ ] Store GitHub access and refresh tokens only as ciphertext; store MCP/API tokens only as SHA-256 HMAC hashes using `CODE_INDEXER_TOKEN_PEPPER`.

- [ ] Expose methods for:
  - upserting GitHub users
  - creating/getting/deleting sessions
  - upserting installations and repositories
  - marking repositories `queued`, `indexing`, `ready`, `failed`, or `deleted`
  - creating/listing/revoking tokens
  - incrementing daily usage counters
  - appending audit log entries

- [ ] Unit-test serialization, token hashing, session expiry, and repository status transitions with memory/fake query adapters.

- [ ] Integration-test table bootstrap and basic CRUD against local YDB.

- [ ] Run:

```bash
npm run test:code-indexer
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
```

Expected: code-indexer tests and integration smoke pass.

- [ ] Commit:

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

- [ ] Add `GET /github/oauth/start`.
  - Generate signed state containing return path and optional installation id.
  - Redirect to GitHub with `client_id`, `redirect_uri`, and `state`.

- [ ] Add `GET /github/oauth/callback`.
  - Verify state.
  - Exchange `code` for GitHub App user access token and refresh token.
  - Fetch authenticated GitHub user.
  - If `installation_id` is present, verify through GitHub API that the user can access that installation before linking it.
  - Create secure session cookie named `__Host-ydbqci_session`.
  - Redirect to `https://ydb-qdrant.tech/code-indexer/dashboard/`.

- [ ] Cookie requirements:
  - `HttpOnly`
  - `Secure`
  - `SameSite=Lax`
  - `Path=/`
  - no `Domain` attribute

- [ ] Add `POST /api/logout` to revoke the session cookie and delete the session row.

- [ ] Test state tampering, expired state, missing code, GitHub token exchange failure, and successful callback.

- [ ] Run:

```bash
npx vitest run test/code-indexer/auth.test.ts test/code-indexer/server.auth.test.ts
```

Expected: auth tests pass.

- [ ] Commit:

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

- [ ] Add session-authenticated endpoints:
  - `GET /api/me`
  - `GET /api/installations`
  - `GET /api/repositories?installationId=<id>`
  - `POST /api/repositories/:repoId/reindex`
  - `POST /api/tokens`
  - `GET /api/tokens`
  - `DELETE /api/tokens/:tokenId`
  - `POST /api/privacy/delete-my-data`

- [ ] Enforce that a user can see/search/reindex only repositories belonging to installations linked to that GitHub user.

- [ ] Generate MCP/API tokens once, return plaintext only in the creation response, and persist only token hash.

- [ ] `POST /api/privacy/delete-my-data` must delete sessions, tokens, user row, and all installations/repositories where the user is the only linked owner; it must also enqueue/delete indexed YDB collections for those repositories.

- [ ] Test 401 unauthenticated, 403 unauthorized repo access, token creation/revocation, reindex enqueue, and delete-my-data behavior.

- [ ] Run:

```bash
npx vitest run test/code-indexer/publicApi.test.ts
```

Expected: public API tests pass.

- [ ] Commit:

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

- [ ] Update installation event mapping:
  - `created`: full-index selected repositories.
  - `deleted`: delete all repository and PR collections for the installation.
  - `suspend`: mark installation suspended and stop enqueueing new index jobs.
  - `unsuspend`: mark installation active and enqueue full-index selected repositories.

- [ ] Update `installation_repositories` mapping:
  - added repositories enqueue full-index.
  - removed repositories enqueue delete-repo-index.

- [ ] Persist repository status:
  - queued before job starts.
  - indexing while running.
  - ready with `lastIndexedSha`, `chunkCount`, `lastIndexedAt` on success.
  - failed with sanitized error text on final failure.
  - deleted on repo removal or uninstall.

- [ ] Test uninstall deletes collections instead of indexing.

- [ ] Run:

```bash
npx vitest run test/code-indexer/webhooks.test.ts test/code-indexer/repoIndexer.test.ts
```

Expected: webhook lifecycle tests pass.

- [ ] Commit:

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

- [ ] Enforce public beta quotas:
  - max 10 repositories per installation.
  - max 10,000 indexed files per repository.
  - max 50,000 chunks per repository.
  - max 1,000 searches per user per UTC day.

- [ ] Return deterministic API errors:
  - HTTP 429 for search quota exceeded.
  - HTTP 422 for repository/file/chunk quota exceeded.

- [ ] Count usage before expensive embedding/search work where possible.

- [ ] Log quota denials with user id, installation id, repo id, metric, and limit; never log code snippets or tokens.

- [ ] Test every quota boundary at `limit - 1`, `limit`, and `limit + 1`.

- [ ] Run:

```bash
npx vitest run test/code-indexer/quota.test.ts
```

Expected: quota tests pass.

- [ ] Commit:

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

- [ ] Add `POST /mcp`.
  - Require `Authorization: Bearer <mcp-token>`.
  - Require allowed `Origin` for browser-originated requests.
  - Accept one JSON-RPC request per POST.
  - Return `application/json`.

- [ ] Add `GET /mcp`.
  - Return a minimal SSE-compatible response for clients that probe Streamable HTTP.
  - Reject unauthenticated requests.

- [ ] Extend `search_code` input schema:
  - Preferred: `owner`, `repo`, `query`, optional `prNumber`, optional `top`.
  - Backward-compatible: `installationId`, `repoId`, `query`, optional `prNumber`, optional `top`.

- [ ] Resolve `owner/repo` to installation/repo only if the token owner has access.

- [ ] Test initialize, tools/list, tools/call, invalid token, revoked token, disallowed origin, unknown repo, and successful search.

- [ ] Run:

```bash
npx vitest run test/code-indexer/mcp.test.ts test/code-indexer/mcpHttp.test.ts
```

Expected: MCP tests pass.

- [ ] Commit:

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

- [ ] Landing page content:
  - Explain: install GitHub App, index repos into YDB-backed Qdrant-compatible storage, connect coding agents through hosted MCP.
  - Primary CTA: GitHub App install URL.
  - Secondary CTA: dashboard login URL.

- [ ] Dashboard content:
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

- [ ] Use existing Gravity UI and SCSS/BEM patterns from the UI repo.

- [ ] Run:

```bash
cd /Users/astandrik/workspace/ydb-qdrant-ui
npm run lint
npm run build
```

Expected: UI lint and static export build pass.

- [ ] Commit in `ydb-qdrant-ui`:

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

- [ ] Privacy page must explicitly state stored data:
  - GitHub account/repository metadata.
  - Code snippets selected by repository permissions/config.
  - Embedding vectors.
  - MCP/API tokens as hashes only.
  - Usage and audit logs.

- [ ] Privacy page must state deletion behavior:
  - uninstall deletes indexed collections for removed repositories.
  - dashboard delete-data removes user/session/token data and indexed repo data where eligible.

- [ ] Support page must include a support email or GitHub issue link.

- [ ] Status page must show current public endpoints and link to `GET /health`.

- [ ] Run:

```bash
cd /Users/astandrik/workspace/ydb-qdrant-ui
npm run lint
npm run build
```

Expected: UI lint and static export build pass.

- [ ] Commit in `ydb-qdrant-ui`:

```bash
git add src/app/code-indexer/privacy src/app/code-indexer/support src/app/code-indexer/status src/components/Footer.tsx
git commit -m "docs: add code indexer public policies"
```

### Task 10: Add End-To-End Public Beta Verification

**Files:**
- Create: `test/integration/CodeIndexerPublicSaas.test.ts`
- Modify: `.github/workflows/ci-integration.yml`
- Modify: `docs/github-app-code-indexer.md`

- [ ] Add integration test with local YDB and mocked GitHub/OpenAI:
  - OAuth callback creates user and session.
  - Installation event creates repository rows and indexing jobs.
  - Indexing writes chunks and status.
  - MCP token can search by `owner/repo`.
  - Revoked token cannot search.
  - Uninstall deletes indexed data.

- [ ] Add CI job using `astandrik/setup-local-ydb@v1`.

- [ ] Update docs with:
  - Public SaaS setup.
  - Self-hosted setup.
  - GitHub App permissions/events.
  - MCP config.
  - Quotas and data retention.

- [ ] Run:

```bash
npm run lint
npm run typecheck
npm test
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
npm run build
```

Expected: lint, typecheck, unit tests, code-indexer integration tests, and build pass.

- [ ] Commit:

```bash
git add test/integration/CodeIndexerPublicSaas.test.ts .github/workflows/ci-integration.yml docs/github-app-code-indexer.md
git commit -m "test: cover code indexer public saas flow"
```

### Task 11: Deploy Staging And Run Real GitHub App E2E

**Files:**
- Modify only deployment config/scripts that already exist on the target server.

- [ ] Deploy backend to staging/prod host with new env vars:
  - `CODE_INDEXER_PUBLIC_BASE_URL=https://code-indexer.ydb-qdrant.tech`
  - `CODE_INDEXER_UI_ORIGIN=https://ydb-qdrant.tech`
  - `GITHUB_CLIENT_ID=<current GitHub App client id>`
  - `GITHUB_CLIENT_SECRET=<new client secret>`
  - `CODE_INDEXER_SESSION_SECRET=<random 32+ byte secret>`
  - `CODE_INDEXER_TOKEN_PEPPER=<random 32+ byte secret>`
  - hosted OpenAI/proxy env vars.

- [ ] Update reverse proxy:
  - `https://code-indexer.ydb-qdrant.tech/github/*` to backend.
  - `https://code-indexer.ydb-qdrant.tech/api/*` to backend.
  - `https://code-indexer.ydb-qdrant.tech/mcp` to backend.

- [ ] Deploy UI static export to `https://ydb-qdrant.tech`.

- [ ] Real E2E:
  - Open `https://ydb-qdrant.tech/code-indexer/`.
  - Install GitHub App into a test repository.
  - Complete OAuth callback.
  - Confirm dashboard shows repository status.
  - Push a test file and confirm status returns to ready.
  - Create MCP token.
  - Call hosted MCP `search_code` by `owner/repo`.
  - Revoke token and confirm MCP search fails.
  - Uninstall App and confirm indexed collection is deleted.

- [ ] Record evidence in `docs/github-app-code-indexer.md`.

- [ ] Commit docs evidence:

```bash
git add docs/github-app-code-indexer.md
git commit -m "docs: record code indexer public beta verification"
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
