# Code Indexer Job Progress Design

## Problem

The dashboard can show only repository-level status today: `queued`, `indexing`, `ready`, `failed`, or `deleted`. Operators can inspect `qdrant_code_indexer_jobs` and Docker logs manually, but users cannot see whether a reindex is actively progressing, stalled, or failed until the repository status changes.

The goal is to make every indexing operation observable from the product UI without requiring shell/YDB access.

## Scope

Implement durable job progress for code-indexer jobs and expose it through the existing dashboard API.

In scope:

- Manual reindex jobs from `POST /api/repositories/:repoId/reindex`.
- Webhook-created jobs for installation, push, and pull request indexing.
- Durable progress across process restarts.
- Dashboard polling and user-visible progress/stall/error states.

Out of scope:

- Exact ETA prediction.
- WebSockets or server-sent events.
- Fine-grained token-level embedding progress.
- Changing the existing indexed collection layout.

## User Experience

When a user clicks `Reindex`, the button should immediately show that a concrete job was queued. The repository card should then show:

- job id, shortened for display;
- phase;
- processed files / total files when total is known;
- processed chunks and discovered chunks;
- elapsed time;
- last update time;
- current file path when available;
- failure message when the job fails.

If a job is `pending` or `running` but `updatedAt` has not changed for a configured threshold, the UI should show a stale warning such as `No progress update for 5 minutes`. It should not mark the job failed locally; failure remains a backend state.

## Data Model

Add a new YDB table instead of altering the existing `qdrant_code_indexer_jobs` table:

`qdrant_code_indexer_job_progress`

Columns:

- `job_id Utf8`
- `installation_id Utf8`
- `repo_id Utf8`
- `owner Utf8`
- `repo Utf8`
- `job_kind Utf8`
- `status Utf8`
- `phase Utf8`
- `message Utf8?`
- `total_files Uint32?`
- `processed_files Uint32`
- `total_chunks Uint32?`
- `processed_chunks Uint32`
- `current_path Utf8?`
- `last_error Utf8?`
- `created_at Timestamp`
- `started_at Timestamp?`
- `updated_at Timestamp`
- `finished_at Timestamp?`

Primary key: `job_id`.

Secondary reads are needed by repository and installation. Use bounded queries filtered by `installation_id` and `repo_id`; if this becomes slow, add a secondary table keyed by `(repo_id, updated_at, job_id)`. For the current beta scale, the single table is acceptable.

Statuses:

- `pending`
- `running`
- `completed`
- `failed`

Phases:

- `queued`
- `claiming`
- `loading_config`
- `fetching_tree`
- `resetting_collection`
- `processing_files`
- `fetching_file`
- `chunking`
- `embedding`
- `upserting`
- `saving_manifest`
- `deleting`
- `completed`
- `failed`

## Backend Flow

Change `IndexingQueue.enqueue(job)` to return `{ jobId }`.

For `YdbIndexingQueue`:

1. Generate the same `job_id` currently stored in `qdrant_code_indexer_jobs`.
2. Insert the durable job row.
3. Insert a progress row with `status=pending`, `phase=queued`, and repository metadata copied from the job payload.
4. When the worker claims a job, update progress to `status=running`, `phase=claiming`, and `started_at`.
5. On success, update progress to `status=completed`, `phase=completed`, and `finished_at`.
6. On retryable failure, keep status `pending`, preserve `last_error`, and update `message`.
7. On final failure, update progress to `status=failed`, `phase=failed`, `last_error`, and `finished_at`.

Pass job execution metadata into the indexer as `processJob(job, { jobId })`. The in-memory queue used by tests should also return a generated `jobId`, but it may keep progress in memory only when tests need it.

## Indexer Progress Reporting

Add an optional `IndexingProgressStore` or `IndexingProgressReporter` dependency to `RepoIndexer`.

Full repository and PR indexing:

- after config load: `phase=loading_config`;
- after file listing: set `total_files` to the number of indexable files;
- before reset: `phase=resetting_collection`;
- for each file:
  - set `current_path`;
  - `phase=fetching_file` before content fetch;
  - `phase=chunking` before chunking;
  - increment `total_chunks` by discovered chunks;
  - `phase=embedding` before embedding;
  - `phase=upserting` before upsert;
  - increment `processed_files` and `processed_chunks` after successful upsert.
- before manifest save: `phase=saving_manifest`.

Incremental push indexing:

- set `total_files` to changed files that require inspection;
- count deletes as processed files after delete completes;
- if it falls back to full indexing, keep the same `jobId` and report `message=Falling back to full index: <reason>`.

Delete jobs:

- report `phase=deleting`;
- complete after collection and manifest deletion.

Progress updates should be throttled where needed, but file-level updates are acceptable for the current expected repo sizes. Errors should be sanitized to the same 4000-character limit used elsewhere.

## API Contract

`POST /api/repositories/:repoId/reindex`

Response:

```json
{
  "status": "ok",
  "job": {
    "jobId": "manual:...",
    "status": "pending",
    "phase": "queued"
  }
}
```

`GET /api/repositories?installationId=<id>`

Keep existing repository fields and add:

```json
{
  "activeJob": {
    "jobId": "manual:...",
    "status": "running",
    "phase": "embedding",
    "processedFiles": 42,
    "totalFiles": 120,
    "processedChunks": 310,
    "totalChunks": 350,
    "currentPath": "src/index.ts",
    "message": null,
    "lastError": null,
    "createdAt": "...",
    "startedAt": "...",
    "updatedAt": "...",
    "finishedAt": null
  }
}
```

An active job is the latest `pending` or `running` job for that repository. A latest terminal job may be returned later if the dashboard needs post-completion history, but the MVP only needs active progress plus repository `ready/failed` status.

`GET /api/jobs/:jobId`

Return the same job progress shape for direct inspection and support links.

Authorization must resolve the job's `repo_id` to repository access and use the same dashboard session checks as repository reindex.

## Dashboard

The static dashboard should:

- store the `jobId` returned by manual reindex;
- poll repositories while any `activeJob` exists or any manual job is locally pending;
- render a compact progress area on each repository card;
- show a determinate progress bar when `totalFiles` is known;
- show an indeterminate state before file listing is complete;
- show stale warning based on `Date.now() - updatedAt`;
- disable duplicate reindex while an active job exists for the repository.

## Failure And Stale Behavior

Backend final failure updates both:

- `qdrant_code_indexer_job_progress.status=failed`;
- repository status through existing `reportFinalFailure`.

The UI should display backend failures as terminal. Stale jobs are only warnings. A stale warning should mention that the job is still recorded as running/pending and that the dashboard is waiting for a new backend update.

## Tests

Backend unit tests:

- `YdbIndexingQueue` creates and updates progress rows for pending, running, retry, completed, and failed.
- `publicApi` returns `jobId` from manual reindex.
- repository API includes active job progress only for authorized repositories.
- unauthorized users cannot read job progress for repos they do not own.
- `RepoIndexer` reports progress phases and counters for full index and failure.

Integration tests:

- local YDB smoke verifies a manual/full job creates progress rows and reaches `completed`.
- existing public SaaS integration verifies dashboard repository payload includes active progress during a queued job.

UI tests/checks:

- dashboard renders queued/running progress.
- stale warning appears for an old `updatedAt`.
- failed progress renders backend error.
- `npm run lint` and `npm run build` pass in `ydb-qdrant-ui`.

## Rollout

1. Add the new progress table and store.
2. Extend queue enqueue/process lifecycle to create and update progress.
3. Add `jobId` execution context to `RepoIndexer`.
4. Add API response fields.
5. Update dashboard polling/rendering.
6. Deploy backend first, then UI.

This is backward compatible with existing completed jobs: old rows remain in `qdrant_code_indexer_jobs`; only new jobs get progress rows.
