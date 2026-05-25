# Code Indexer Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only admin dashboard for the hosted YDB Qdrant Code Indexer so the operator can inspect installations, repositories, index status, active jobs, recent jobs, tokens, and aggregate counters.

**Architecture:** Reuse the existing GitHub OAuth dashboard session cookie and add an explicit admin allowlist from `CODE_INDEXER_ADMIN_GITHUB_USER_IDS`. Backend exposes bounded read-only `/api/admin/*` endpoints; the UI adds `/code-indexer/admin/` as a noindex operational page. No destructive admin actions in the MVP.

**Tech Stack:** Node.js 18+, TypeScript, Express 5, Vitest, YDB SDK, Next.js 16, React 19, Gravity UI.

---

### Task 1: Backend Admin API Contract

**Files:**
- Modify: `test/code-indexer/publicApi.test.ts`
- Modify: `src/code-indexer/publicApi.ts`
- Modify: `src/code-indexer/server.ts`
- Modify: `src/code-indexer/config.ts`
- Modify: `src/code-indexer/index.ts`

- [x] **Step 1: Write failing auth tests**

Add tests that call `GET /api/admin/overview` without a cookie, with a non-allowlisted user, and with an allowlisted user.

- [x] **Step 2: Run focused test and verify RED**

Run: `npx vitest run test/code-indexer/publicApi.test.ts`

Expected: admin tests fail because the route/config does not exist yet.

- [x] **Step 3: Implement minimal admin auth**

Add `adminGithubUserIds: string[]` to `CodeIndexerPublicApiDeps`, parse `CODE_INDEXER_ADMIN_GITHUB_USER_IDS`, and require `resolveDashboardSession` plus allowlist membership for every `/api/admin/*` route.

- [x] **Step 4: Run focused test and verify GREEN**

Run: `npx vitest run test/code-indexer/publicApi.test.ts`

Expected: admin auth tests pass.

### Task 2: Backend Global Admin Data

**Files:**
- Modify: `test/code-indexer/publicApi.test.ts`
- Modify: `src/code-indexer/saasStore.ts`
- Modify: `src/code-indexer/stateStore.ts`
- Modify: `src/code-indexer/types.ts`
- Modify: `src/code-indexer/publicApi.ts`

- [x] **Step 1: Write failing overview/list tests**

Assert `GET /api/admin/overview`, `GET /api/admin/repositories`, and `GET /api/admin/jobs` return bounded global SaaS rows and serialized job progress with aggregate counters.

- [x] **Step 2: Run focused test and verify RED**

Run: `npx vitest run test/code-indexer/publicApi.test.ts`

Expected: tests fail because global store methods and routes are not implemented.

- [x] **Step 3: Implement store queries and routes**

Add bounded global list/count methods to the SaaS store and progress store, serialize dates consistently, and keep every admin response read-only.

- [x] **Step 4: Run focused test and verify GREEN**

Run: `npx vitest run test/code-indexer/publicApi.test.ts`

Expected: admin overview/list tests pass.

### Task 3: Admin UI

**Files:**
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/code-indexer/admin/page.tsx`
- Create: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexerAdminDashboard.tsx`
- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexer.scss`
- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/app/robots.ts`

- [x] **Step 1: Build a noindex admin page**

Create `/code-indexer/admin/` with the same GitHub sign-in flow, admin-only error handling, summary cards, repository table, and active/recent jobs sections.

- [x] **Step 2: Keep UI operational**

Use dense tables, status badges, filters, and horizontal overflow instead of marketing sections. Do not add destructive controls.

- [x] **Step 3: Verify locally**

Run: `npm run lint` and `npm run build` in `/Users/astandrik/workspace/ydb-qdrant-ui`.

### Task 4: Verification and Deployment

**Files:**
- Backend repo and UI repo deployment scripts.

- [x] **Step 1: Backend checks**

Run: `npm run test:code-indexer`, `npm run typecheck`, `npm run lint`, and `npm run build`.

- [x] **Step 2: UI checks**

Run: `npm run lint` and `npm run build` in the UI repo.

- [x] **Step 3: Deploy backend and UI**

Build a new amd64 backend image, deploy it to `111.88.152.4`, set `CODE_INDEXER_ADMIN_GITHUB_USER_IDS` for `astandrik`, deploy the updated static UI, and verify `/health` plus `/code-indexer/admin/`.

## Completion Evidence

- Focused RED: `npx vitest run test/code-indexer/publicApi.test.ts` failed with 404 for the new `/api/admin/*` routes before implementation.
- Focused GREEN: `npx vitest run test/code-indexer/publicApi.test.ts` passed after implementation.
- Backend verification passed: `npm run typecheck`, `npm run test:code-indexer`, `npm run lint`, `npm run build`.
- UI verification passed in `/Users/astandrik/workspace/ydb-qdrant-ui`: `npm run lint`, `npm run build`.
- Local UI route check: `http://127.0.0.1:3025/code-indexer/admin/` returned 200 from Next dev server.
- Production backend image: `ydb-qdrant-code-indexer:admin-dashboard-20260525-205900-amd64`.
- Production backend health: `https://code-indexer.ydb-qdrant.tech/health` returned `{"status":"ok"}`.
- Production admin API unauth check: `https://code-indexer.ydb-qdrant.tech/api/admin/overview` returned 401 with `{"error":"unauthenticated","status":"error"}`.
- Production UI: `https://ydb-qdrant.tech/code-indexer/admin/` returned 200 and contains `noindex,nofollow`.
- Production robots: `https://ydb-qdrant.tech/robots.txt` disallows `/code-indexer/admin/`.
- UI deploy backup: `/home/astandrik/ydb-qdrant-ui-out-20260525-180122.tgz`.
- Follow-up nginx fix: `https://ydb-qdrant.tech//code-indexer/admin/` now returns `301` to `https://ydb-qdrant.tech/code-indexer/admin/`, preventing Next hydration from treating `//code-indexer/admin/` as a scheme-relative URL.
- Nginx config backup: `/etc/nginx/conf.d/ydb-qdrant-https.conf.bak-20260525T180714-collapse-double-slash`.
