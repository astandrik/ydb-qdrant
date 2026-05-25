import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock("../../src/ydb/client.js", () => {
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
            jsonDocument: vi.fn((value: string) => ({
                type: "JsonDocument",
                value,
            })),
            timestamp: vi.fn((value: Date) => ({ type: "Timestamp", value })),
            utf8: vi.fn((value: string) => ({ type: "Utf8", value })),
        },
        createExecuteQuerySettings: vi.fn(() => ({ settings: true })),
        withSession: vi.fn(),
    };
});

type FakeSession = {
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

function makeSession(overrides: Partial<FakeSession> = {}): FakeSession {
    return {
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
            stateStore.CODE_INDEXER_MANIFESTS_TABLE,
            expect.anything()
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
        expect(upsertCall).toBeDefined();
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

        expect(processJob).toHaveBeenCalledWith(job);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = "pending"')
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = "running"')
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = "completed"')
            )
        ).toBe(true);
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
                yql.includes('SET status = "pending"') &&
                yql.includes("last_error = $last_error")
            )
        ).toBe(true);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = "completed"')
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
                    yql.includes('SET status = "failed"')
                )
            ).toBe(true);
        });
        expect(processJob).toHaveBeenCalledTimes(1);
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes('SET status = "pending"') &&
                yql.includes("last_error = $last_error")
            )
        ).toBe(false);
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
