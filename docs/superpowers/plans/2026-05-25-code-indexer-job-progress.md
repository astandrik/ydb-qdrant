# Code Indexer Job Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable, user-visible progress for code-indexer indexing jobs so dashboard users can see whether a reindex is queued, running, progressing, stale, completed, or failed.

**Architecture:** Add a dedicated YDB progress table and `IndexingProgressStore` contract alongside the existing durable jobs table. Make queues return `jobId`, pass that id into `RepoIndexer`, record phase/counter updates during indexing, expose progress through dashboard API endpoints, then render progress in the static UI.

**Tech Stack:** TypeScript ESM, Express 5, Vitest, YDB SDK, static Next.js UI in `/Users/astandrik/workspace/ydb-qdrant-ui`.

---

## File Structure

Backend files:

- Modify `src/code-indexer/types.ts`: add job handle, execution context, progress record/update/store types, and update `IndexingQueue.enqueue`.
- Modify `src/code-indexer/stateStore.ts`: add `qdrant_code_indexer_job_progress`, create/parse progress rows, implement `YdbIndexingProgressStore`, and wire queue lifecycle progress.
- Modify `src/code-indexer/queue.ts`: make in-memory queue return `jobId` and pass execution context.
- Modify `src/code-indexer/checkRuns.ts`: pass job execution context through check-run wrapper.
- Modify `src/code-indexer/repoIndexer.ts`: report phases, counters, current file, fallback messages, and delete phases.
- Modify `src/code-indexer/publicApi.ts`: return `jobId` from manual reindex, attach `activeJob` to repositories, and add `GET /api/jobs/:jobId`.
- Modify `src/code-indexer/index.ts`: create one progress store instance and inject it into queue, indexer, and public API.
- Modify tests under `test/code-indexer`.
- Modify `docs/github-app-code-indexer.md` with the new observability endpoints.

UI files:

- Modify `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexerDashboard.tsx`: add `activeJob` types, render progress, store manual `jobId`, poll while active jobs exist.
- Modify `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexer.scss`: progress bar, phase rows, stale/error styling.

## Task 1: Backend Progress Types And Queue Contract

**Files:**

- Modify: `src/code-indexer/types.ts`
- Modify: `src/code-indexer/queue.ts`
- Modify: `src/code-indexer/checkRuns.ts`
- Test: `test/code-indexer/publicApi.test.ts`
- Test: `test/code-indexer/checkRuns.test.ts`

- [x] **Step 1: Add core progress types**

Add these exported types to `src/code-indexer/types.ts`:

```ts
export type IndexingJobStatus = "pending" | "running" | "completed" | "failed";

export type IndexingJobPhase =
    | "queued"
    | "claiming"
    | "loading_config"
    | "fetching_tree"
    | "resetting_collection"
    | "processing_files"
    | "fetching_file"
    | "chunking"
    | "embedding"
    | "upserting"
    | "saving_manifest"
    | "deleting"
    | "completed"
    | "failed";

export type EnqueuedIndexingJob = {
    jobId: string;
    phase: IndexingJobPhase;
    status: IndexingJobStatus;
};

export type IndexingJobExecutionContext = {
    jobId: string;
};

export type IndexingJobProgressRecord = {
    createdAt: Date;
    currentPath?: string;
    finishedAt?: Date;
    installationId: string;
    jobId: string;
    jobKind: IndexingJob["kind"];
    lastError?: string;
    message?: string;
    owner: string;
    phase: IndexingJobPhase;
    processedChunks: number;
    processedFiles: number;
    repo: string;
    repoId: string;
    startedAt?: Date;
    status: IndexingJobStatus;
    totalChunks?: number;
    totalFiles?: number;
    updatedAt: Date;
};

export type IndexingJobProgressUpdate = {
    currentPath?: string | null;
    finishedAt?: Date | null;
    lastError?: string | null;
    message?: string | null;
    phase?: IndexingJobPhase;
    processedChunks?: number;
    processedFiles?: number;
    startedAt?: Date | null;
    status?: IndexingJobStatus;
    totalChunks?: number | null;
    totalFiles?: number | null;
};

export interface IndexingProgressStore {
    createJobProgress(params: {
        job: IndexingJob;
        jobId: string;
    }): Promise<IndexingJobProgressRecord>;
    getJobProgress(jobId: string): Promise<IndexingJobProgressRecord | null>;
    listActiveJobsForInstallation(
        installationId: number | string
    ): Promise<IndexingJobProgressRecord[]>;
    updateJobProgress(params: {
        jobId: string;
        update: IndexingJobProgressUpdate;
    }): Promise<void>;
}
```

Update `IndexingQueue` to:

```ts
export interface IndexingQueue {
    enqueue(job: IndexingJob): Promise<EnqueuedIndexingJob>;
}
```

- [x] **Step 2: Update in-memory queue**

In `src/code-indexer/queue.ts`, import `randomUUID` and update `InMemoryIndexingQueue.enqueue` to return:

Use a private queue item type:

```ts
type QueuedMemoryJob = {
    context: IndexingJobExecutionContext;
    job: IndexingJob;
};
```

Store `QueuedMemoryJob[]`, log `jobId`, and call:

```ts
await this.processJob(job, context);
```

- [x] **Step 3: Update check-run wrapper**

Change `withCheckRunReporting` in `src/code-indexer/checkRuns.ts` so `processJob` receives `(job, context)` and the returned wrapper also accepts `(job, context)`. It must still call `reporter.start(job)` and `reporter.complete(result)`, but forward context with:

```ts
await params.processJob(job, context);
```

- [x] **Step 4: Update tests for compile-time contract**

In `test/code-indexer/publicApi.test.ts`, update `createBaseDeps`:

```ts
const enqueue = vi.fn(() =>
    Promise.resolve({ jobId: "manual:test-job", phase: "queued", status: "pending" })
);
```

In tests that assert enqueue response, expect `job.jobId`.

In `test/code-indexer/checkRuns.test.ts`, update wrapper tests so the mocked `processJob` receives the context:

```ts
const context = { jobId: "job-1" };
await wrapped(job, context);
expect(processJob).toHaveBeenCalledWith(job, context);
```

- [x] **Step 5: Run focused tests**

Run:

```bash
npx vitest run test/code-indexer/checkRuns.test.ts test/code-indexer/publicApi.test.ts
```

Expected: tests compile and pass after subsequent tasks complete. If they fail only because progress store methods are not implemented yet, continue to Task 2.

## Task 2: Durable Progress Store

**Files:**

- Modify: `src/code-indexer/stateStore.ts`
- Test: `test/code-indexer/stateStore.test.ts`

- [x] **Step 1: Add failing state store tests**

Add tests in `test/code-indexer/stateStore.test.ts` that verify:

```ts
expect(session.createTable).toHaveBeenCalledWith(
    stateStore.CODE_INDEXER_JOB_PROGRESS_TABLE,
    expect.anything()
);
```

Add a test for `YdbIndexingProgressStore.createJobProgress`, `updateJobProgress`, `getJobProgress`, and `listActiveJobsForInstallation` using fake rows with these columns in order:

```text
job_id, installation_id, repo_id, owner, repo, job_kind, status, phase,
message, total_files, processed_files, total_chunks, processed_chunks,
current_path, last_error, created_at, started_at, updated_at, finished_at
```

Assert that parsed camelCase output contains:

```ts
{
    jobId: "manual:job-1",
    installationId: "7",
    repoId: "42",
    owner: "octo",
    repo: "demo",
    jobKind: "incremental-push",
    status: "running",
    phase: "embedding",
    processedFiles: 2,
    totalFiles: 3,
    processedChunks: 8,
    totalChunks: 10,
}
```

- [x] **Step 2: Implement progress table creation**

In `src/code-indexer/stateStore.ts`, export:

```ts
export const CODE_INDEXER_JOB_PROGRESS_TABLE =
    "qdrant_code_indexer_job_progress";
```

Add `ensureJobProgressTable()` with the columns from the design spec and primary key `job_id`. Include it in `ensureCodeIndexerStateTables()`.

- [x] **Step 3: Implement `YdbIndexingProgressStore`**

Implement methods:

- `createJobProgress({ job, jobId })`: UPSERT row with `status=pending`, `phase=queued`, `processed_files=0u`, `processed_chunks=0u`, current timestamps.
- `updateJobProgress({ jobId, update })`: UPDATE the progress columns through declared nullable parameters and keep existing values when a field is `undefined`; set explicit `NULL` when a field is passed as `null`; always set `updated_at=CurrentUtcTimestamp()`.
- `getJobProgress(jobId)`: SELECT one row by `job_id`.
- `listActiveJobsForInstallation(installationId)`: SELECT rows by `installation_id` where `status IN ("pending", "running")`, ordered by `updated_at DESC`.

Use the existing `readText`, `readUint`, and timestamp helpers or add local equivalents if needed. Invalid rows should throw `stored code-indexer job progress row is invalid`.

- [x] **Step 4: Run focused state store tests**

Run:

```bash
npx vitest run test/code-indexer/stateStore.test.ts
```

Expected: all state store tests pass.

## Task 3: Queue Lifecycle Progress

**Files:**

- Modify: `src/code-indexer/stateStore.ts`
- Modify: `src/code-indexer/index.ts`
- Test: `test/code-indexer/stateStore.test.ts`

- [x] **Step 1: Add failing queue lifecycle tests**

Extend `test/code-indexer/stateStore.test.ts`:

- `enqueue` returns `{ jobId, status: "pending", phase: "queued" }`.
- enqueue writes both `qdrant_code_indexer_jobs` and `qdrant_code_indexer_job_progress`.
- claiming a job updates progress to `running/claiming`.
- completed job updates progress to `completed/completed`.
- retryable failure updates progress back to `pending` with `last_error`.
- final failure updates progress to `failed/failed`.

- [x] **Step 2: Inject progress store into `YdbIndexingQueue`**

Change `YdbIndexingQueueOptions` to accept:

```ts
progressStore?: IndexingProgressStore;
```

Default it in the constructor:

```ts
this.progressStore = options.progressStore ?? new YdbIndexingProgressStore();
```

- [x] **Step 3: Generate job id once**

Change `enqueue(job)` to:

```ts
const jobId = jobIdForJob(job);
await this.enqueueStoredJob(job, jobId);
await this.progressStore.createJobProgress({ job, jobId });
this.scheduleDrain();
return { jobId, phase: "queued", status: "pending" };
```

Update `enqueueStoredJob(job, jobId)` to use the provided id.

- [x] **Step 4: Update processing lifecycle**

When a stored job is claimed, call:

```ts
await this.progressStore.updateJobProgress({
    jobId: storedJob.jobId,
    update: { phase: "claiming", startedAt: new Date(), status: "running" },
});
await this.processJob(storedJob.job, { jobId: storedJob.jobId });
```

On completion, retry, and final failure, update progress as specified in the design.

- [x] **Step 5: Wire production startup**

In `src/code-indexer/index.ts`, create:

```ts
const progressStore = new YdbIndexingProgressStore();
```

Pass it to:

- `new RepoIndexer({ clientFactory, chunker, embeddingProvider, manifestStore, options, progressStore, quota, quotaStore, statusStore, store })`
- `new YdbIndexingQueue(processJob, { maxAttempts, onFinalFailure, progressStore, retentionDays, retryBackoffMs })`
- `publicApi: { indexStore, progressStore, quota, queue, store }`

- [x] **Step 6: Run focused tests**

Run:

```bash
npx vitest run test/code-indexer/stateStore.test.ts
```

Expected: all state store tests pass.

## Task 4: RepoIndexer Phase And Counter Reporting

**Files:**

- Modify: `src/code-indexer/repoIndexer.ts`
- Test: `test/code-indexer/repoIndexer.test.ts`

- [x] **Step 1: Add failing progress reporter tests**

In `test/code-indexer/repoIndexer.test.ts`, add tests for full index progress:

- `loading_config`
- `fetching_tree`
- `totalFiles`
- `resetting_collection`
- `fetching_file`
- `chunking`
- `embedding`
- `upserting`
- processed file/chunk counters
- `saving_manifest`

Use a fake `progressStore`:

```ts
const progressUpdates: unknown[] = [];
const progressStore = {
    createJobProgress: vi.fn(),
    getJobProgress: vi.fn(),
    listActiveJobsForInstallation: vi.fn(),
    updateJobProgress: vi.fn((update) => {
        progressUpdates.push(update);
        return Promise.resolve();
    }),
};
```

Call:

```ts
await indexer.processJob(job, { jobId: "job-1" });
```

- [x] **Step 2: Add progress dependency**

Extend `RepoIndexer` constructor params with:

```ts
progressStore?: IndexingProgressStore;
```

Add helper:

```ts
private async reportProgress(
    context: IndexingJobExecutionContext | undefined,
    update: IndexingJobProgressUpdate
): Promise<void> {
    if (!context || !this.progressStore) {
        return;
    }
    await this.progressStore.updateJobProgress({
        jobId: context.jobId,
        update,
    });
}
```

- [x] **Step 3: Thread context**

Change `processJob(job)` to `processJob(job, context?)` and pass `context` into full, incremental, PR, delete, and helper methods.

- [x] **Step 4: Report full and PR phases**

In full/PR paths:

- before config load: `loading_config`
- before file list: `fetching_tree`
- after filtering indexable files: `{ phase: "processing_files", totalFiles: indexableFiles.length, processedFiles: 0, processedChunks: 0, totalChunks: 0 }`
- before reset: `resetting_collection`
- before save: `saving_manifest`

Inside file processing:

- set `currentPath`
- report `fetching_file`, `chunking`, `embedding`, `upserting`
- after each file, increment counters.

- [x] **Step 5: Report incremental and delete phases**

For incremental:

- before compare: `fetching_tree`
- set `totalFiles` to changed files length.
- if falling back to full index, set message `Falling back to full index: <reason>`.

For delete jobs:

```ts
await this.reportProgress(context, { phase: "deleting" });
```

- [x] **Step 6: Run focused tests**

Run:

```bash
npx vitest run test/code-indexer/repoIndexer.test.ts
```

Expected: all repo indexer tests pass.

## Task 5: Public API Progress Contract

**Files:**

- Modify: `src/code-indexer/publicApi.ts`
- Modify: `src/code-indexer/server.ts`
- Test: `test/code-indexer/publicApi.test.ts`

- [x] **Step 1: Add failing API tests**

In `test/code-indexer/publicApi.test.ts`, add fake `progressStore` to `createBaseDeps`.

Test manual reindex response:

```ts
expect(JSON.parse(response.body)).toMatchObject({
    job: { jobId: "manual:test-job", phase: "queued", status: "pending" },
    status: "ok",
});
```

Test repositories include `activeJob` when progress store returns a running job for repo `456`.

Test `GET /api/jobs/manual:test-job` returns progress for authorized repo.

Test `GET /api/jobs/job-for-other-repo` returns `403`.

- [x] **Step 2: Extend public API deps**

Add `progressStore: IndexingProgressStore` to `CodeIndexerPublicApiDeps`.

- [x] **Step 3: Return job from reindex**

Change manual reindex to:

```ts
const job = await deps.queue.enqueue({
    installationId: toSafeIntegerId(repository.installationId, "installationId"),
    kind: "full-index",
    reason: "manual-reindex",
    ref: repository.defaultBranch,
    repository: repositoryRefFromRecord(repository),
});
res.status(202).json({ job, status: "ok" });
```

- [x] **Step 4: Attach active jobs to repositories**

In `GET /api/repositories`, call:

```ts
const activeJobs = await deps.progressStore.listActiveJobsForInstallation(installationId);
```

Map latest active job by `repoId`, serialize dates to ISO strings, and add `activeJob` to matching repository objects.

- [x] **Step 5: Add direct job endpoint**

Add:

```ts
router.get("/jobs/:jobId", async (req: Request, res: Response): Promise<void> => {
    try {
        const context = await requireContext(deps, req);
        const progress = await deps.progressStore.getJobProgress(
            readPathParam(req, "jobId")
        );
        if (!progress) {
            throw apiError("not_found", "job not found", 404);
        }
        await requireRepositoryAccess({
            context,
            repoId: progress.repoId,
            store: deps.store,
        });
        res.json({ job: serializeProgress(progress), status: "ok" });
    } catch (err: unknown) {
        sendApiError(res, err);
    }
});
```

It must:

1. require dashboard context;
2. read job by id;
3. return 404 if missing;
4. call `requireRepositoryAccess` with `progress.repoId`;
5. return `{ job: serializeProgress(progress), status: "ok" }`.

- [x] **Step 6: Wire server deps**

Update `src/code-indexer/server.ts` type usage so the new public API dependency is required by callers.

- [x] **Step 7: Run focused API tests**

Run:

```bash
npx vitest run test/code-indexer/publicApi.test.ts test/code-indexer/server.test.ts
```

Expected: tests pass.

## Task 6: Backend Integration And Docs

**Files:**

- Modify: `test/integration/CodeIndexerSmoke.test.ts` or `test/integration/CodeIndexerPublicSaas.test.ts`
- Modify: `docs/github-app-code-indexer.md`

- [x] **Step 1: Add integration assertion**

In an existing code-indexer integration test, assert that after an indexing job:

- `qdrant_code_indexer_job_progress` has a row for the job id;
- row reaches `completed`;
- `processed_files` and `processed_chunks` are greater than zero for a fixture that indexes files.

- [x] **Step 2: Update docs**

Add a short "Job progress" section to `docs/github-app-code-indexer.md`:

```md
The dashboard reads job progress from `GET /api/repositories?installationId=<id>`
and can inspect a single job through `GET /api/jobs/:jobId`. Progress is stored
in `qdrant_code_indexer_job_progress` and includes phase, counters, current path,
timestamps, and the last backend error.
```

- [x] **Step 3: Run backend verification**

Run:

```bash
npm run test:code-indexer
npm run typecheck
npm run lint
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
```

Expected: all commands pass.

- [x] **Step 4: Commit backend**

Commit only backend progress files and docs:

```bash
git add src/code-indexer test/code-indexer test/integration docs/github-app-code-indexer.md docs/superpowers/plans/2026-05-25-code-indexer-job-progress.md
git commit -m "feat: track code indexer job progress"
```

## Task 7: Dashboard Progress UI

**Files:**

- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexerDashboard.tsx`
- Modify: `/Users/astandrik/workspace/ydb-qdrant-ui/src/components/CodeIndexer/CodeIndexer.scss`

- [ ] **Step 1: Extend UI types**

Add:

```ts
type ActiveJob = {
  createdAt: string;
  currentPath?: string;
  finishedAt?: string;
  jobId: string;
  lastError?: string;
  message?: string;
  phase: string;
  processedChunks: number;
  processedFiles: number;
  startedAt?: string;
  status: "pending" | "running" | "completed" | "failed";
  totalChunks?: number;
  totalFiles?: number;
  updatedAt: string;
};
```

Add `activeJob?: ActiveJob` to `Repository`.

- [ ] **Step 2: Store manual job id**

Update `handleReindex` to read:

```ts
const data = await apiRequest<{ job: ActiveJob; status: "ok" }>(
    `/api/repositories/${encodeURIComponent(repoId)}/reindex`,
    { method: "POST" }
);
```

Use `data.job.jobId` in the action message.

- [ ] **Step 3: Poll while active jobs exist**

Change `hasActiveIndexingJob` to check:

```ts
repository.activeJob ||
repository.status === "queued" ||
repository.status === "indexing"
```

- [ ] **Step 4: Render progress**

Add a compact progress block inside each repo card:

- phase label from `activeJob.phase`
- file progress `${processedFiles}/${totalFiles ?? "?"}`
- chunk progress `${processedChunks}/${totalChunks ?? "?"}`
- current path
- elapsed time from `startedAt || createdAt`
- stale warning if `Date.now() - Date.parse(updatedAt) > 5 * 60 * 1000`
- error row when `activeJob.lastError` exists.

- [ ] **Step 5: Add CSS**

Add classes:

- `.code-indexer-progress`
- `.code-indexer-progress__bar`
- `.code-indexer-progress__bar-fill`
- `.code-indexer-progress__meta`
- `.code-indexer-progress__warning`
- `.code-indexer-progress__error`

Use existing color tokens and keep the layout compact inside the repository card.

- [ ] **Step 6: Verify UI**

Run in `/Users/astandrik/workspace/ydb-qdrant-ui`:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 7: Commit UI**

Commit in UI repo:

```bash
git add src/components/CodeIndexer/CodeIndexerDashboard.tsx src/components/CodeIndexer/CodeIndexer.scss
git commit -m "feat: show code indexer job progress"
```

## Task 8: Deploy And Production Verification

**Files:**

- Modify: `docs/superpowers/plans/2026-05-25-code-indexer-public-saas.md`

- [ ] **Step 1: Build backend Docker image**

Use the existing deployment flow for `ydb-qdrant-code-indexer` and build an image tagged with the current short commit.

- [ ] **Step 2: Deploy backend first**

Deploy backend to `111.88.152.4`, keeping current env:

- `YDB_QDRANT_ENDPOINT=grpc://ydb-local:2141`
- `YDB_QDRANT_DATABASE=/local/qdrant-v3`
- existing GitHub App secrets and OpenAI proxy env.

- [ ] **Step 3: Verify backend health**

Run:

```bash
curl -fsSL https://code-indexer.ydb-qdrant.tech/health
ssh -l astandrik 111.88.152.4 'docker ps --format "{{.Names}} {{.Image}} {{.Status}}" | grep ydb-qdrant-code-indexer'
```

Expected: health returns `{"status":"ok"}` and active container is healthy.

- [ ] **Step 4: Deploy UI**

In `/Users/astandrik/workspace/ydb-qdrant-ui`, run:

```bash
bash scripts/deploy-static.sh
```

- [ ] **Step 5: Verify production progress**

From the dashboard, click `Reindex` for `astandrik/local-ydb-toolkit`.

Verify by API/YDB:

- `POST /api/repositories/:repoId/reindex` returns a job id.
- `qdrant_code_indexer_job_progress` receives a row.
- dashboard shows phase/counters.
- row reaches `completed`.
- repository returns to `ready`.

- [ ] **Step 6: Record evidence**

Append production evidence to `docs/superpowers/plans/2026-05-25-code-indexer-public-saas.md` and commit:

```bash
git add docs/superpowers/plans/2026-05-25-code-indexer-public-saas.md
git commit -m "docs: record code indexer progress verification"
```

## Final Verification

Run in backend repo:

```bash
npm run typecheck
npm run lint
npm run test:code-indexer
YDB_ANONYMOUS_CREDENTIALS=1 npm run test:integration:code-indexer
npm run build
```

Run in UI repo:

```bash
npm run lint
npm run build
```

Acceptance evidence:

- Manual reindex returns `jobId`.
- Dashboard shows concrete job progress, counters, stale warning logic, and failures.
- Production YDB has `qdrant_code_indexer_job_progress`.
- Latest production manual reindex reaches `completed`.
