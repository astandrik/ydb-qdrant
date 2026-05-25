# Code Indexer MCP Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hosted MCP endpoint self-describing so coding agents can discover accessible repositories, branch indexes, PR indexes, and then call `search_code` with the right arguments.

**Architecture:** Add two read-only MCP tools beside `search_code`: `list_repositories` and `list_repository_indexes`. Reuse the GitHub App access store for repository authorization and the existing job-progress table for recent PR index state; do not add a new YDB table.

**Tech Stack:** TypeScript, Express, MCP JSON-RPC, Vitest, existing YDB state/access stores.

---

### Task 1: MCP Tool Contract Tests

**Files:**
- Modify: `test/code-indexer/mcp.test.ts`
- Modify: `test/code-indexer/mcpHttp.test.ts`

- [x] **Step 1: Add failing MCP unit tests**

Add tests that expect `tools/list` to expose `list_repositories`, `list_repository_indexes`, and `search_code`, and that `tools/call` returns structured repository/index data.

- [x] **Step 2: Add failing hosted HTTP tests**

Add tests that call the hosted `/mcp` endpoint with a bearer token and verify repository discovery is scoped to repositories accessible to that token.

- [x] **Step 3: Run targeted tests**

Run: `npx vitest run test/code-indexer/mcp.test.ts test/code-indexer/mcpHttp.test.ts`

Expected: FAIL because the discovery tools and catalog dependency are not implemented yet.

### Task 2: Progress Store Repository History

**Files:**
- Modify: `src/code-indexer/types.ts`
- Modify: `src/code-indexer/stateStore.ts`
- Modify: `test/code-indexer/stateStore.test.ts`

- [x] **Step 1: Add failing progress-store test**

Test `listJobsForRepository({ installationId, repoId, limit })` and assert it queries by installation/repo and returns parsed PR progress rows.

- [x] **Step 2: Implement progress-store method**

Add `listJobsForRepository` to `IndexingProgressStore` and `YdbIndexingProgressStore` using the existing job-progress table, ordered by `updated_at DESC`, with a bounded limit.

- [x] **Step 3: Run state-store tests**

Run: `npx vitest run test/code-indexer/stateStore.test.ts`

Expected: PASS.

### Task 3: MCP Discovery Implementation

**Files:**
- Modify: `src/code-indexer/mcp.ts`
- Modify: `src/code-indexer/mcpHttp.ts`
- Modify: `src/code-indexer/index.ts`

- [x] **Step 1: Implement `list_repositories`**

Return repositories available to the authenticated MCP token with owner, repo, repo id, installation id, default branch, status, chunk count, last indexed timestamp, and last indexed SHA.

- [x] **Step 2: Implement `list_repository_indexes`**

Return the default branch collection plus recent PR index summaries derived from job-progress rows. Include collection names so agents can explain what they are searching, while still calling `search_code` through owner/repo/prNumber.

- [x] **Step 3: Wire hosted MCP dependencies**

Pass `progressStore` into `createMcpHttpRouter` from `src/code-indexer/index.ts`.

- [x] **Step 4: Run targeted tests**

Run: `npx vitest run test/code-indexer/mcp.test.ts test/code-indexer/mcpHttp.test.ts test/code-indexer/stateStore.test.ts`

Expected: PASS.

### Task 4: Verification

**Files:**
- No additional source files.

- [x] **Step 1: Run code-indexer suite**

Run: `npm run test:code-indexer`

Expected: PASS.

- [x] **Step 2: Run typecheck and build**

Run: `npm run typecheck && npm run build`

Expected: PASS.

- [x] **Step 3: Report usage**

Document the agent flow in the final response:
1. configure MCP URL and bearer token;
2. call `list_repositories`;
3. call `list_repository_indexes` for the selected repository;
4. call `search_code` with `{ owner, repo, query }` or `{ owner, repo, prNumber, query }`.

**Deployment evidence:**
- Backend image deployed on `111.88.152.4`: `ydb-qdrant-code-indexer:mcp-discovery-amd64-20260525-180846`.
- Public health check returned `{"status":"ok"}`.
- Public hosted MCP smoke with a temporary token returned tools `list_repositories,list_repository_indexes,search_code` and four accessible repositories.
- Temporary smoke MCP tokens named `Codex MCP smoke` were revoked after verification.
