import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock("../../src/ydb/client.js", () => {
    class FakeAlterTableDescription {
        addColumns: unknown[] = [];
    }

    class FakeTableDescription {
        withColumns(...columns: unknown[]) {
            void columns;
            return this;
        }

        withPrimaryKeys(...keys: string[]) {
            void keys;
            return this;
        }
    }

    class FakeColumn {
        readonly name: string;

        constructor(name: string, type: unknown) {
            void type;
            this.name = name;
        }
    }

    return {
        AlterTableDescription: FakeAlterTableDescription,
        Column: FakeColumn,
        TableDescription: FakeTableDescription,
        Types: {
            JSON_DOCUMENT: "JsonDocument",
            TIMESTAMP: "Timestamp",
            UINT32: "Uint32",
            UTF8: "Utf8",
            optional: (inner: unknown) => ({ optional: inner }),
        },
        TypedValues: {
            VOID: { value: "VOID" },
            jsonDocument: vi.fn((value: string) => ({
                type: "JsonDocument",
                value,
            })),
            optional: vi.fn((value: unknown) => ({
                optional: true,
                value,
            })),
            timestamp: vi.fn((value: Date) => ({ type: "Timestamp", value })),
            uint32: vi.fn((value: number) => ({ type: "Uint32", value })),
            utf8: vi.fn((value: string) => ({ type: "Utf8", value })),
        },
        createExecuteQuerySettings: vi.fn(() => ({ settings: true })),
        withSession: vi.fn(),
    };
});

type FakeSession = {
    alterTable: Mock;
    createTable: Mock;
    describeTable: Mock;
    executeQuery: Mock;
};

function makeJob() {
    return {
        after: "b".repeat(40),
        before: "a".repeat(40),
        created: false,
        deleted: false,
        deliveryId: "delivery-1",
        forced: false,
        installationId: 7,
        kind: "incremental-push" as const,
        ref: "refs/heads/main",
        repository: {
            defaultBranch: "main",
            owner: "octo",
            repo: "demo",
            repoId: 42,
        },
    };
}

function makeJobForRepo(repoId: number, deliveryId: string) {
    const job = makeJob();
    return {
        ...job,
        deliveryId,
        repository: {
            ...job.repository,
            repo: `demo-${repoId}`,
            repoId,
        },
    };
}

function makePrJob() {
    return {
        baseRef: "main",
        headRef: "feature",
        headSha: "c".repeat(40),
        installationId: 7,
        kind: "pr-index" as const,
        prNumber: 3,
        repository: {
            defaultBranch: "main",
            owner: "octo",
            repo: "demo",
            repoId: 42,
        },
        sourceRepository: {
            defaultBranch: "main",
            owner: "octo",
            repo: "demo",
            repoId: 42,
        },
    };
}

function makeManifest() {
    return {
        collection: "gh_repo_42_default",
        files: [{ blobSha: "blob-1", path: "src/server.ts" }],
        ref: "refs/heads/main",
        repository: {
            defaultBranch: "main",
            owner: "octo",
            repo: "demo",
            repoId: 42,
        },
        sha: "b".repeat(40),
        userUid: "gh_installation_7",
    };
}

function makeStoredJobRow(jobId: string, job: ReturnType<typeof makeJob>) {
    return {
        items: [
            { textValue: jobId },
            { textValue: JSON.stringify(job) },
            { uint32Value: 0 },
        ],
    };
}

function createDeferred(): {
    promise: Promise<void>;
    resolve: () => void;
} {
    let resolve!: () => void;
    const promise = new Promise<void>((resolvePromise) => {
        resolve = resolvePromise;
    });
    return { promise, resolve };
}

function makeSession(overrides: Partial<FakeSession> = {}): FakeSession {
    return {
        alterTable: vi.fn(() => Promise.resolve()),
        createTable: vi.fn(() => Promise.resolve()),
        describeTable: vi.fn(() => Promise.resolve({ columns: [] })),
        executeQuery: vi.fn(() => Promise.resolve({ resultSets: [] })),
        ...overrides,
    };
}

async function importStateStore() {
    vi.resetModules();
    const client = await import("../../src/ydb/client.js");
    const stateStore = await import("../../src/code-indexer/stateStore.js");
    const withSessionMock = client.withSession as unknown as Mock;
    return { stateStore, withSessionMock };
}

function useSession(withSessionMock: Mock, session: FakeSession): void {
    withSessionMock.mockImplementation((fn: (s: FakeSession) => Promise<unknown>) =>
        fn(session)
    );
}

async function flushAsync(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
}

describe("code-indexer durable state store", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates app-owned YDB tables when they are missing", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const session = makeSession({
            describeTable: vi.fn(() =>
                Promise.reject(new Error("SchemeError (code 400070): []"))
            ),
        });
        useSession(withSessionMock, session);

        await stateStore.ensureCodeIndexerStateTables();

        expect(session.createTable).toHaveBeenCalledWith(
            stateStore.CODE_INDEXER_DELIVERIES_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            stateStore.CODE_INDEXER_JOBS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            stateStore.CODE_INDEXER_JOB_PROGRESS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            stateStore.CODE_INDEXER_MANIFESTS_TABLE,
            expect.anything()
        );
    });

    it("adds the PR number column to an existing job progress table", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const session = makeSession({
            describeTable: vi.fn((tableName: string) =>
                Promise.resolve({
                    columns:
                        tableName === stateStore.CODE_INDEXER_JOB_PROGRESS_TABLE
                            ? [{ name: "job_id" }]
                            : [{ name: "existing" }],
                })
            ),
        });
        useSession(withSessionMock, session);

        await stateStore.ensureCodeIndexerStateTables();

        expect(session.alterTable).toHaveBeenCalledWith(
            stateStore.CODE_INDEXER_JOB_PROGRESS_TABLE,
            expect.objectContaining({
                addColumns: [expect.objectContaining({ name: "pr_number" })],
            })
        );
    });

    it("checks and marks webhook deliveries in YDB", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const session = makeSession({
            executeQuery: vi
                .fn()
                .mockResolvedValueOnce({
                    resultSets: [
                        {
                            rows: [
                                {
                                    items: [{ textValue: "delivery-1" }],
                                },
                            ],
                        },
                    ],
                })
                .mockResolvedValueOnce({ resultSets: [] }),
        });
        useSession(withSessionMock, session);
        const deliveryStore = new stateStore.YdbDeliveryStore();

        await expect(deliveryStore.has("delivery-1")).resolves.toBe(true);
        await deliveryStore.mark("delivery-1");

        expect(session.executeQuery).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("SELECT delivery_id"),
            { $delivery_id: { type: "Utf8", value: "delivery-1" } },
            undefined,
            { settings: true }
        );
        expect(session.executeQuery).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_deliveries"),
            { $delivery_id: { type: "Utf8", value: "delivery-1" } },
            undefined,
            { settings: true }
        );
    });

    it("persists repo manifests in YDB", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const manifest = makeManifest();
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT payload")) {
                    return Promise.resolve({
                        resultSets: [
                            {
                                rows: [
                                    {
                                        items: [
                                            { textValue: JSON.stringify(manifest) },
                                        ],
                                    },
                                ],
                            },
                        ],
                    });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const manifestStore = new stateStore.YdbRepoManifestStore();

        await expect(
            manifestStore.get({
                collection: "gh_repo_42_default",
                userUid: "gh_installation_7",
            })
        ).resolves.toEqual(manifest);
        await manifestStore.save(manifest);
        await manifestStore.delete({
            collection: "gh_repo_42_default",
            userUid: "gh_installation_7",
        });

        expect(session.executeQuery).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining("SELECT payload"),
            {
                $manifest_id: {
                    type: "Utf8",
                    value: "gh_installation_7/gh_repo_42_default",
                },
            },
            undefined,
            { settings: true }
        );
        const upsertCall = session.executeQuery.mock.calls.find(
            ([yql]: [string]) =>
                yql.includes("UPSERT INTO qdrant_code_indexer_manifests")
        );
        expect(upsertCall).toBeDefined();
        const upsertParams = upsertCall?.[1] as
            | {
                  $manifest_id?: { type?: unknown; value?: unknown };
                  $payload?: { type?: unknown; value?: unknown };
              }
            | undefined;
        expect(upsertParams?.$manifest_id).toEqual({
            type: "Utf8",
            value: "gh_installation_7/gh_repo_42_default",
        });
        expect(upsertParams?.$payload?.type).toBe("JsonDocument");
        expect(JSON.parse(String(upsertParams?.$payload?.value))).toEqual(
            manifest
        );
        expect(
            session.executeQuery.mock.calls.some(
                ([yql, params]: [
                    string,
                    { $manifest_id?: { value?: unknown } },
                ]) =>
                    yql.includes("DELETE FROM qdrant_code_indexer_manifests") &&
                    params.$manifest_id?.value ===
                        "gh_installation_7/gh_repo_42_default"
            )
        ).toBe(true);
    });

    it("builds deterministic delivery-scoped job IDs", async () => {
        const { stateStore } = await importStateStore();
        const job = makeJob();

        expect(stateStore.jobIdForJob(job)).toBe(stateStore.jobIdForJob(job));
        expect(stateStore.jobIdForJob(job)).toMatch(/^delivery-1:[a-f0-9]{24}$/);
    });

    it("persists and reads job progress in YDB", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const createdAt = new Date("2026-05-25T12:00:00.000Z");
        const startedAt = new Date("2026-05-25T12:00:05.000Z");
        const updatedAt = new Date("2026-05-25T12:00:10.000Z");
        const row = {
            items: [
                { textValue: "manual:job-1" },
                { textValue: "7" },
                { textValue: "42" },
                { textValue: "octo" },
                { textValue: "demo" },
                { textValue: "incremental-push" },
                { textValue: "running" },
                { textValue: "embedding" },
                { textValue: "Embedding chunks" },
                { uint32Value: 3 },
                { uint32Value: 2 },
                { uint32Value: 10 },
                { uint32Value: 8 },
                { textValue: "src/index.ts" },
                { textValue: "" },
                { timestampValue: createdAt },
                { timestampValue: startedAt },
                { timestampValue: updatedAt },
                { nullFlagValue: 0 },
            ],
        };
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT") && yql.includes("WHERE job_id")) {
                    return Promise.resolve({ resultSets: [{ rows: [row] }] });
                }
                if (
                    yql.includes("SELECT") &&
                    yql.includes("WHERE installation_id")
                ) {
                    return Promise.resolve({ resultSets: [{ rows: [row] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const progressStore = new stateStore.YdbIndexingProgressStore();

        await progressStore.createJobProgress({
            job: makeJob(),
            jobId: "manual:job-1",
        });
        await progressStore.updateJobProgress({
            jobId: "manual:job-1",
            update: {
                currentPath: "src/index.ts",
                message: "Embedding chunks",
                phase: "embedding",
                processedChunks: 8,
                processedFiles: 2,
                startedAt,
                status: "running",
                totalChunks: 10,
                totalFiles: 3,
            },
        });

        await expect(progressStore.getJobProgress("manual:job-1")).resolves.toMatchObject({
            currentPath: "src/index.ts",
            installationId: "7",
            jobId: "manual:job-1",
            jobKind: "incremental-push",
            message: "Embedding chunks",
            owner: "octo",
            phase: "embedding",
            processedChunks: 8,
            processedFiles: 2,
            repo: "demo",
            repoId: "42",
            startedAt,
            status: "running",
            totalChunks: 10,
            totalFiles: 3,
            updatedAt,
        });
        await expect(
            progressStore.listActiveJobsForInstallation("7")
        ).resolves.toHaveLength(1);

        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes("UPSERT INTO qdrant_code_indexer_job_progress")
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes("UPDATE qdrant_code_indexer_job_progress")
            )
        ).toBe(true);
    });

    it("persists and reads PR numbers in job progress", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const row = {
            items: [
                { textValue: "delivery-pr:job" },
                { textValue: "7" },
                { textValue: "42" },
                { textValue: "octo" },
                { textValue: "demo" },
                { textValue: "pr-index" },
                { textValue: "running" },
                { textValue: "embedding" },
                { nullFlagValue: 0 },
                { nullFlagValue: 0 },
                { uint32Value: 0 },
                { nullFlagValue: 0 },
                { uint32Value: 0 },
                { nullFlagValue: 0 },
                { nullFlagValue: 0 },
                { timestampValue: new Date("2026-05-25T12:00:00.000Z") },
                { nullFlagValue: 0 },
                { timestampValue: new Date("2026-05-25T12:00:00.000Z") },
                { nullFlagValue: 0 },
                { uint32Value: 3 },
            ],
        };
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT") && yql.includes("WHERE job_id")) {
                    return Promise.resolve({ resultSets: [{ rows: [row] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const progressStore = new stateStore.YdbIndexingProgressStore();

        await expect(
            progressStore.createJobProgress({
                job: makePrJob(),
                jobId: "delivery-pr:job",
            })
        ).resolves.toMatchObject({
            jobKind: "pr-index",
            prNumber: 3,
        });
        await expect(
            progressStore.getJobProgress("delivery-pr:job")
        ).resolves.toMatchObject({
            jobKind: "pr-index",
            prNumber: 3,
        });

        const progressUpsertCall = session.executeQuery.mock.calls.find(
            (call: unknown[]) =>
                typeof call[0] === "string" &&
                call[0].includes("UPSERT INTO qdrant_code_indexer_job_progress")
        );
        expect(progressUpsertCall?.[1]).toMatchObject({
            $pr_number: { optional: true, value: { type: "Uint32", value: 3 } },
        });
    });

    it("serializes concurrent progress updates for the same job", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const firstUpdate = createDeferred();
        let activeUpdates = 0;
        let maxActiveUpdates = 0;
        let updateCalls = 0;
        const session = makeSession({
            executeQuery: vi.fn(async (yql: string) => {
                if (
                    yql.includes(
                        `UPDATE ${stateStore.CODE_INDEXER_JOB_PROGRESS_TABLE}`
                    )
                ) {
                    updateCalls += 1;
                    activeUpdates += 1;
                    maxActiveUpdates = Math.max(maxActiveUpdates, activeUpdates);
                    if (updateCalls === 1) {
                        await firstUpdate.promise;
                    }
                    activeUpdates -= 1;
                }
                return { resultSets: [] };
            }),
        });
        useSession(withSessionMock, session);
        const progressStore = new stateStore.YdbIndexingProgressStore();

        await progressStore.createJobProgress({
            job: makeJob(),
            jobId: "manual:job-1",
        });
        const first = progressStore.updateJobProgress({
            jobId: "manual:job-1",
            update: { phase: "embedding", processedFiles: 1 },
        });
        await vi.waitFor(() => {
            expect(updateCalls).toBe(1);
        });
        const second = progressStore.updateJobProgress({
            jobId: "manual:job-1",
            update: { phase: "upserting", processedFiles: 2 },
        });
        await flushAsync();

        expect(updateCalls).toBe(1);

        firstUpdate.resolve();
        await Promise.all([first, second]);

        expect(updateCalls).toBe(2);
        expect(maxActiveUpdates).toBe(1);
    });

    it("lists recent job progress records for a repository", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const updatedAt = new Date("2026-05-25T14:01:00.000Z");
        const row = {
            items: [
                { textValue: "delivery-pr:job" },
                { textValue: "7" },
                { textValue: "42" },
                { textValue: "octo" },
                { textValue: "demo" },
                { textValue: "pr-index" },
                { textValue: "completed" },
                { textValue: "completed" },
                { nullFlagValue: 0 },
                { uint32Value: 3 },
                { uint32Value: 3 },
                { uint32Value: 12 },
                { uint32Value: 12 },
                { nullFlagValue: 0 },
                { nullFlagValue: 0 },
                { timestampValue: new Date("2026-05-25T14:00:00.000Z") },
                { timestampValue: new Date("2026-05-25T14:00:01.000Z") },
                { timestampValue: updatedAt },
                { timestampValue: updatedAt },
                { uint32Value: 71 },
            ],
        };
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (
                    yql.includes("WHERE installation_id = $installation_id") &&
                    yql.includes("repo_id = $repo_id")
                ) {
                    return Promise.resolve({ resultSets: [{ rows: [row] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const progressStore = new stateStore.YdbIndexingProgressStore();

        await expect(
            (
                progressStore as {
                    listJobsForRepository(params: {
                        installationId: string;
                        limit: number;
                        repoId: string;
                    }): Promise<unknown>;
                }
            ).listJobsForRepository({
                installationId: "7",
                limit: 5,
                repoId: "42",
            })
        ).resolves.toMatchObject([
            {
                jobId: "delivery-pr:job",
                jobKind: "pr-index",
                prNumber: 71,
                repoId: "42",
                status: "completed",
                updatedAt,
            },
        ]);

        const queryCall = session.executeQuery.mock.calls.find(
            ([yql]: [string]) =>
                yql.includes("WHERE installation_id = $installation_id") &&
                yql.includes("repo_id = $repo_id")
        );
        expect(queryCall?.[0]).toContain("LIMIT 5");
        expect(queryCall?.[1]).toMatchObject({
            $installation_id: { type: "Utf8", value: "7" },
            $repo_id: { type: "Utf8", value: "42" },
        });
    });

    it("persists enqueued jobs and drains no-op pending state", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT job_id, payload, attempts")) {
                    return Promise.resolve({ resultSets: [{ rows: [] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(vi.fn());

        await queue.enqueue(makeJob());
        await flushAsync();

        const executeCalls = session.executeQuery.mock.calls as unknown as Array<
            [string, Record<string, unknown>]
        >;
        const upsertCall = executeCalls.find(([yql]) =>
            yql.includes("UPSERT INTO qdrant_code_indexer_jobs")
        );
        const progressUpsertCall = executeCalls.find(([yql]) =>
            yql.includes("UPSERT INTO qdrant_code_indexer_job_progress")
        );
        expect(upsertCall).toBeDefined();
        expect(progressUpsertCall).toBeDefined();
        expect(upsertCall?.[0]).toContain('Utf8("pending")');
        expect(upsertCall?.[0]).toContain("0u");
        const params = upsertCall?.[1] as
            | {
                  $job_id?: { type?: unknown; value?: unknown };
                  $payload?: { type?: unknown };
              }
            | undefined;
        expect(params?.$job_id?.type).toBe("Utf8");
        expect(params?.$job_id?.value).toEqual(
            expect.stringMatching(/^delivery-1:[a-f0-9]{24}$/)
        );
        expect(params?.$payload?.type).toBe("JsonDocument");
    });

    it("resets interrupted jobs, claims pending jobs, and marks them completed", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const job = makeJob();
        const processJob = vi.fn(() => Promise.resolve());
        let selected = false;
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT job_id, payload, attempts")) {
                    if (selected) {
                        return Promise.resolve({ resultSets: [{ rows: [] }] });
                    }
                    selected = true;
                    return Promise.resolve({
                        resultSets: [
                            {
                                rows: [
                                    {
                                        items: [
                                            { textValue: "delivery-1:job" },
                                            {
                                                textValue: JSON.stringify(job),
                                            },
                                            { uint32Value: 0 },
                                        ],
                                    },
                                ],
                            },
                        ],
                    });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob);

        queue.start();
        await flushAsync();
        await flushAsync();

        expect(processJob).toHaveBeenCalledWith(job, { jobId: "delivery-1:job" });
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("pending")')
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("running")')
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("completed")')
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(
                ([yql, params]: [
                    string,
                    { $status?: { value?: unknown }; $phase?: { value?: unknown } },
                ]) =>
                    yql.includes("UPDATE qdrant_code_indexer_job_progress") &&
                    params.$status?.value === "running" &&
                    params.$phase?.value === "claiming"
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(
                ([yql, params]: [
                    string,
                    { $status?: { value?: unknown }; $phase?: { value?: unknown } },
                ]) =>
                    yql.includes("UPDATE qdrant_code_indexer_job_progress") &&
                    params.$status?.value === "completed" &&
                    params.$phase?.value === "completed"
            )
        ).toBe(true);
    });

    it("processes durable jobs for different repositories concurrently", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const jobA = makeJobForRepo(42, "delivery-a");
        const jobB = makeJobForRepo(43, "delivery-b");
        const pending = [
            { job: jobA, jobId: "delivery-a:job" },
            { job: jobB, jobId: "delivery-b:job" },
        ];
        const blockers = new Map([
            ["delivery-a:job", createDeferred()],
            ["delivery-b:job", createDeferred()],
        ]);
        const processJob = vi.fn(
            (_job, context: { jobId: string }) =>
                blockers.get(context.jobId)?.promise ?? Promise.resolve()
        );
        const session = makeSession({
            executeQuery: vi.fn(
                (
                    yql: string,
                    params?: { $job_id?: { value?: unknown } }
                ) => {
                    if (yql.includes("SELECT job_id, payload, attempts")) {
                        return Promise.resolve({
                            resultSets: [
                                {
                                    rows: pending.map(({ job, jobId }) =>
                                        makeStoredJobRow(jobId, job)
                                    ),
                                },
                            ],
                        });
                    }
                    if (yql.includes('SET status = Utf8("running")')) {
                        const jobId = params?.$job_id?.value;
                        const index = pending.findIndex(
                            (item) => item.jobId === jobId
                        );
                        if (index >= 0) {
                            pending.splice(index, 1);
                        }
                    }
                    return Promise.resolve({ resultSets: [] });
                }
            ),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            concurrency: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(2);
        });
        blockers.get("delivery-a:job")?.resolve();
        blockers.get("delivery-b:job")?.resolve();
        await vi.waitFor(() => {
            expect(
                session.executeQuery.mock.calls.filter(([yql]: [string]) =>
                    yql.includes('SET status = Utf8("completed")')
                )
            ).toHaveLength(2);
        });
    });

    it("does not process two durable jobs for the same repository concurrently", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const jobA = makeJobForRepo(42, "delivery-a");
        const jobB = makeJobForRepo(42, "delivery-b");
        const pending = [
            { job: jobA, jobId: "delivery-a:job" },
            { job: jobB, jobId: "delivery-b:job" },
        ];
        const firstJob = createDeferred();
        const processJob = vi.fn((_job, context: { jobId: string }) =>
            context.jobId === "delivery-a:job"
                ? firstJob.promise
                : Promise.resolve()
        );
        const session = makeSession({
            executeQuery: vi.fn(
                (
                    yql: string,
                    params?: { $job_id?: { value?: unknown } }
                ) => {
                    if (yql.includes("SELECT job_id, payload, attempts")) {
                        return Promise.resolve({
                            resultSets: [
                                {
                                    rows: pending.map(({ job, jobId }) =>
                                        makeStoredJobRow(jobId, job)
                                    ),
                                },
                            ],
                        });
                    }
                    if (yql.includes('SET status = Utf8("running")')) {
                        const jobId = params?.$job_id?.value;
                        const index = pending.findIndex(
                            (item) => item.jobId === jobId
                        );
                        if (index >= 0) {
                            pending.splice(index, 1);
                        }
                    }
                    return Promise.resolve({ resultSets: [] });
                }
            ),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            concurrency: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(1);
        });
        await flushAsync();
        await flushAsync();
        expect(processJob).toHaveBeenCalledTimes(1);

        firstJob.resolve();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(2);
        });
    });

    it("scans past locked same-repository pending jobs to claim other repositories", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const firstJob = makeJobForRepo(42, "delivery-a");
        const otherRepoJob = makeJobForRepo(43, "delivery-z");
        const firstBlocker = createDeferred();
        const pending = [
            { job: firstJob, jobId: "delivery-a:job" },
            ...Array.from({ length: 59 }, (_, index) => {
                const deliveryId = `delivery-same-${index}`;
                return {
                    job: makeJobForRepo(42, deliveryId),
                    jobId: `${deliveryId}:job`,
                };
            }),
            { job: otherRepoJob, jobId: "delivery-z:job" },
        ];
        const processJob = vi.fn((_job, context: { jobId: string }) =>
            context.jobId === "delivery-a:job"
                ? firstBlocker.promise
                : Promise.resolve()
        );
        const session = makeSession({
            executeQuery: vi.fn(
                (
                    yql: string,
                    params?: { $job_id?: { value?: unknown } }
                ) => {
                    if (yql.includes("SELECT job_id, payload, attempts")) {
                        const offsetMatch = /OFFSET\s+(\d+)/i.exec(yql);
                        const offset = offsetMatch ? Number(offsetMatch[1]) : 0;
                        return Promise.resolve({
                            resultSets: [
                                {
                                    rows: pending
                                        .slice(offset, offset + 50)
                                        .map(({ job, jobId }) =>
                                            makeStoredJobRow(jobId, job)
                                        ),
                                },
                            ],
                        });
                    }
                    if (yql.includes('SET status = Utf8("running")')) {
                        const jobId = params?.$job_id?.value;
                        const index = pending.findIndex(
                            (item) => item.jobId === jobId
                        );
                        if (index >= 0) {
                            pending.splice(index, 1);
                        }
                    }
                    return Promise.resolve({ resultSets: [] });
                }
            ),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            concurrency: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledWith(firstJob, {
                jobId: "delivery-a:job",
            });
            expect(processJob).toHaveBeenCalledWith(otherRepoJob, {
                jobId: "delivery-z:job",
            });
        });

        firstBlocker.resolve();
    });

    it("starts newly enqueued jobs while another repository is still running", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const runningJob = makeJobForRepo(42, "delivery-a");
        const lateJob = makeJobForRepo(43, "delivery-b");
        const runningBlocker = createDeferred();
        const pending = [{ job: runningJob, jobId: "delivery-a:job" }];
        const processJob = vi.fn((_job, context: { jobId: string }) =>
            context.jobId === "delivery-a:job"
                ? runningBlocker.promise
                : Promise.resolve()
        );
        const session = makeSession({
            executeQuery: vi.fn(
                (
                    yql: string,
                    params?: {
                        $job_id?: { value?: unknown };
                        $payload?: { value?: unknown };
                    }
                ) => {
                    if (yql.includes("SELECT job_id, payload, attempts")) {
                        return Promise.resolve({
                            resultSets: [
                                {
                                    rows: pending.map(({ job, jobId }) =>
                                        makeStoredJobRow(jobId, job)
                                    ),
                                },
                            ],
                        });
                    }
                    if (yql.includes("UPSERT INTO qdrant_code_indexer_jobs")) {
                        const jobId = params?.$job_id?.value;
                        const payload = params?.$payload?.value;
                        if (typeof jobId === "string" && typeof payload === "string") {
                            pending.push({
                                job: JSON.parse(payload) as ReturnType<typeof makeJob>,
                                jobId,
                            });
                        }
                    }
                    if (yql.includes('SET status = Utf8("running")')) {
                        const jobId = params?.$job_id?.value;
                        const index = pending.findIndex(
                            (item) => item.jobId === jobId
                        );
                        if (index >= 0) {
                            pending.splice(index, 1);
                        }
                    }
                    return Promise.resolve({ resultSets: [] });
                }
            ),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            concurrency: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledWith(runningJob, {
                jobId: "delivery-a:job",
            });
        });

        const enqueued = await queue.enqueue(lateJob);
        try {
            await vi.waitFor(
                () => {
                    expect(processJob).toHaveBeenCalledWith(lateJob, {
                        jobId: enqueued.jobId,
                    });
                },
                { timeout: 250 }
            );
        } finally {
            runningBlocker.resolve();
        }
    });

    it("retries failed durable jobs before completing a later attempt", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const job = makeJob();
        const processJob = vi
            .fn()
            .mockRejectedValueOnce(new Error("temporary failure"))
            .mockResolvedValueOnce(undefined);
        let selectCount = 0;
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT job_id, payload, attempts")) {
                    selectCount += 1;
                    if (selectCount <= 2) {
                        return Promise.resolve({
                            resultSets: [
                                {
                                    rows: [
                                        {
                                            items: [
                                                { textValue: "delivery-1:job" },
                                                {
                                                    textValue: JSON.stringify(job),
                                                },
                                                { uint32Value: selectCount - 1 },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        });
                    }
                    return Promise.resolve({ resultSets: [{ rows: [] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            maxAttempts: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(processJob).toHaveBeenCalledTimes(2);
        });
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("pending")') &&
                yql.includes("last_error = $last_error")
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(
                ([yql, params]: [
                    string,
                    { $status?: { value?: unknown }; $phase?: { value?: unknown } },
                ]) =>
                    yql.includes("UPDATE qdrant_code_indexer_job_progress") &&
                    params.$status?.value === "pending" &&
                    params.$phase?.value === "queued"
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("completed")')
            )
        ).toBe(true);
    });

    it("marks durable jobs failed after the configured attempt limit", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const job = makeJob();
        const processJob = vi.fn(() => Promise.reject(new Error("permanent")));
        let selected = false;
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT job_id, payload, attempts")) {
                    if (selected) {
                        return Promise.resolve({ resultSets: [{ rows: [] }] });
                    }
                    selected = true;
                    return Promise.resolve({
                        resultSets: [
                            {
                                rows: [
                                    {
                                        items: [
                                            { textValue: "delivery-1:job" },
                                            {
                                                textValue: JSON.stringify(job),
                                            },
                                            { uint32Value: 1 },
                                        ],
                                    },
                                ],
                            },
                        ],
                    });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const queue = new stateStore.YdbIndexingQueue(processJob, {
            maxAttempts: 2,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(
                session.executeQuery.mock.calls.some(([yql]: [string]) =>
                    yql.includes('SET status = Utf8("failed")')
                )
            ).toBe(true);
        });
        expect(processJob).toHaveBeenCalledTimes(1);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = Utf8("pending")') &&
                yql.includes("last_error = $last_error")
            )
        ).toBe(false);
        expect(
            session.executeQuery.mock.calls.some(
                ([yql, params]: [
                    string,
                    { $status?: { value?: unknown }; $phase?: { value?: unknown } },
                ]) =>
                    yql.includes("UPDATE qdrant_code_indexer_job_progress") &&
                    params.$status?.value === "failed" &&
                    params.$phase?.value === "failed"
            )
        ).toBe(true);
    });

    it("cleans up completed jobs, failed jobs, and old delivery ids on startup", async () => {
        const { stateStore, withSessionMock } = await importStateStore();
        const session = makeSession({
            executeQuery: vi.fn((yql: string) => {
                if (yql.includes("SELECT job_id, payload, attempts")) {
                    return Promise.resolve({ resultSets: [{ rows: [] }] });
                }
                return Promise.resolve({ resultSets: [] });
            }),
        });
        useSession(withSessionMock, session);
        const now = new Date("2026-05-24T00:00:00.000Z");
        const queue = new stateStore.YdbIndexingQueue(vi.fn(), {
            now: () => now,
            retentionDays: 7,
            retryBackoffMs: 0,
        });

        queue.start();

        await vi.waitFor(() => {
            expect(
                session.executeQuery.mock.calls.some(([yql]: [string]) =>
                    yql.includes("DELETE FROM qdrant_code_indexer_jobs")
                )
            ).toBe(true);
            expect(
                session.executeQuery.mock.calls.some(([yql]: [string]) =>
                    yql.includes("DELETE FROM qdrant_code_indexer_deliveries")
                )
            ).toBe(true);
        });
        const cleanupCall = session.executeQuery.mock.calls.find(
            ([yql]: [string]) => yql.includes("DELETE FROM qdrant_code_indexer_jobs")
        );
        const params = cleanupCall?.[1] as
            | { $cutoff?: { type?: unknown; value?: unknown } }
            | undefined;
        expect(params?.$cutoff?.type).toBe("Timestamp");
        expect(params?.$cutoff?.value).toEqual(
            new Date("2026-05-17T00:00:00.000Z")
        );
    });
});
