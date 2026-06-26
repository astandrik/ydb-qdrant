import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("../../src/ydb/client.js", () => {
    const createExecuteQuerySettings = vi.fn(() => ({
        kind: "ExecuteQuerySettings",
    }));
    const createExecuteQuerySettingsWithTimeout = vi.fn(
        (opts: unknown) => ({ kind: "ExecuteQuerySettings", opts } as const)
    );

    return {
        Types: {
            UTF8: "UTF8",
            BYTES: "BYTES",
            JSON_DOCUMENT: "JSON_DOCUMENT",
            FLOAT: "FLOAT",
            list: vi.fn((t: unknown) => ({ kind: "list", t })),
        },
        TypedValues: {
            utf8: vi.fn((v: string) => ({ type: "utf8", v })),
            uint32: vi.fn((v: number) => ({ type: "uint32", v })),
            timestamp: vi.fn((v: Date) => ({ type: "timestamp", v })),
            optional: vi.fn((value: unknown) => ({ type: "optional", value })),
            optionalNull: vi.fn((type: unknown) => ({
                type: "optionalNull",
                typeRef: type,
            })),
            list: vi.fn((t: unknown, list: unknown[]) => ({
                type: "list",
                t,
                list,
            })),
        },
        withSession: vi.fn(),
        TableDescription: class {
            cols: unknown[] = [];
            pk: string[] = [];
            withColumns(...cols: unknown[]) {
                this.cols = cols;
                return this;
            }
            withPrimaryKey(...pk: string[]) {
                this.pk = pk;
                return this;
            }
            withPrimaryKeys(...pk: string[]) {
                this.pk = pk;
                return this;
            }
        },
        Column: class {
            name: string;
            type: unknown;
            constructor(name: string, type: unknown) {
                this.name = name;
                this.type = type;
            }
        },
        createExecuteQuerySettings,
        createExecuteQuerySettingsWithTimeout,
    };
});

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));
import {
    countPointsForCollections,
    countPointsForCollection,
    createCollection,
    getCollectionMeta,
    hasPointsForCollection,
    listCollectionsForLegacyUserPrefix,
    listCollectionsForUser,
} from "../../src/repositories/collectionsRepo.js";
import * as ydbClient from "../../src/ydb/client.js";
import { UPSERT_OPERATION_TIMEOUT_MS } from "../../src/config/env.js";

const withSessionMock = ydbClient.withSession as unknown as Mock;

describe("collectionsRepo (with mocked YDB)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("upserts collection metadata (one-table; no per-collection table)", async () => {
        const sessionMock = {
            createTable: vi.fn(),
            executeQuery: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                await fn(sessionMock);
            }
        );

        await createCollection(
            "tenant_a/my_collection",
            128,
            "Cosine",
            "float",
            undefined
        );

        expect(sessionMock.createTable).not.toHaveBeenCalled();
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);

        const params = sessionMock.executeQuery.mock.calls[0]?.[1] as
            | { $table?: { v?: string } }
            | undefined;
        expect(params?.$table?.v).toBe("qdrant_all_points");

        const { createExecuteQuerySettingsWithTimeout } =
            ydbClient as unknown as {
                createExecuteQuerySettingsWithTimeout: Mock;
            };
        expect(createExecuteQuerySettingsWithTimeout).toHaveBeenCalledWith({
            keepInCache: true,
            idempotent: true,
            timeoutMs: UPSERT_OPERATION_TIMEOUT_MS,
        });

        // Ensure the 4th argument (settings) is passed to executeQuery.
        const call = sessionMock.executeQuery.mock.calls[0];
        expect(call?.[2]).toBe(undefined);
        expect(call?.[3]).toMatchObject({ kind: "ExecuteQuerySettings" });
    });

    it("returns null from getCollectionMeta when no rows returned", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [{ rows: [] }],
        } as unknown as never);

        const meta = await getCollectionMeta("tenant_a/my_collection");

        expect(meta).toBeNull();
    });

    it("parses collection metadata row into typed object", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "qdr_tenant_a__my_collection" },
                                { uint32Value: 128 },
                                { textValue: "Euclid" },
                                { textValue: "float" },
                            ],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const meta = await getCollectionMeta("tenant_a/my_collection");

        expect(meta).toEqual({
            table: "qdr_tenant_a__my_collection",
            dimension: 128,
            distance: "Euclid",
            vectorType: "float",
        });
    });

    it("lists collection metadata scoped by user_uid", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "test_user/docs" },
                                { uint32Value: 128 },
                                { textValue: "Cosine" },
                                { textValue: "float" },
                                { textValue: "2026-06-25T09:00:00.000Z" },
                            ],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const collections = await listCollectionsForUser("test_user");

        expect(collections).toEqual([
            {
                distance: "Cosine",
                lastAccessedAt: new Date("2026-06-25T09:00:00.000Z"),
                metaKey: "test_user/docs",
                name: "docs",
                vectorSize: 128,
                vectorType: "float",
            },
        ]);
        const params = (
            withSessionMock.mock.calls[0]?.[0] as (session: {
                executeQuery: Mock;
            }) => unknown
        );
        expect(params).toBeTypeOf("function");
    });

    it("omits invalid last_accessed_at values from collection listings", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "test_user/docs" },
                                { uint32Value: 128 },
                                { textValue: "Cosine" },
                                { textValue: "float" },
                                { textValue: "not-a-date" },
                            ],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const collections = await listCollectionsForUser("test_user");

        expect(collections).toEqual([
            {
                distance: "Cosine",
                metaKey: "test_user/docs",
                name: "docs",
                vectorSize: 128,
                vectorType: "float",
            },
        ]);
    });

    it("lists legacy null-user metadata by collection prefix range", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "legacy_user/docs" },
                                    { uint32Value: 128 },
                                    { textValue: "Cosine" },
                                    { textValue: "float" },
                                    {
                                        textValue:
                                            "2026-06-25T09:00:00.000Z",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );

        const collections = await listCollectionsForLegacyUserPrefix(
            "legacy_user"
        );

        expect(collections).toEqual([
            {
                distance: "Cosine",
                lastAccessedAt: new Date("2026-06-25T09:00:00.000Z"),
                metaKey: "legacy_user/docs",
                name: "docs",
                vectorSize: 128,
                vectorType: "float",
            },
        ]);
        const firstCall = sessionMock.executeQuery.mock.calls[0] as
            | [string, Record<string, unknown>]
            | undefined;
        expect(firstCall).toBeDefined();
        const query = firstCall?.[0] ?? "";
        const params = firstCall?.[1];
        expect(query).toContain("user_uid IS NULL");
        expect(query).toContain("collection >= $collection_prefix");
        expect(query).toContain("collection < $collection_prefix_end");
        expect(params).toMatchObject({
            $collection_prefix: { type: "utf8", v: "legacy_user/" },
            $collection_prefix_end: { type: "utf8" },
        });
    });

    it("returns true from hasPointsForCollection when a row exists", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [{ textValue: "p1" }],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const hasPoints = await hasPointsForCollection("tenant_a/my_collection");

        expect(hasPoints).toBe(true);
        expect(withSessionMock).toHaveBeenCalledTimes(1);
    });

    it("returns false from hasPointsForCollection when no rows returned", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [{ rows: [] }],
        } as unknown as never);

        const hasPoints = await hasPointsForCollection("tenant_a/my_collection");

        expect(hasPoints).toBe(false);
    });

    it("returns exact point count for a collection", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [{ textValue: "2" }],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const pointsCount = await countPointsForCollection(
            "tenant_a/my_collection"
        );

        expect(pointsCount).toBe(2);
    });

    it("returns point counts for multiple collections in one grouped query", async () => {
        const sessionMock = {
            executeQuery: vi.fn().mockResolvedValue({
                resultSets: [
                    {
                        rows: [
                            {
                                items: [
                                    { textValue: "tenant_a/docs" },
                                    { textValue: "2" },
                                ],
                            },
                            {
                                items: [
                                    { textValue: "tenant_a/images" },
                                    { uint64Value: { low: 3, high: 0 } },
                                ],
                            },
                        ],
                    },
                ],
            }),
        };
        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => await fn(sessionMock)
        );

        const pointsCounts = await countPointsForCollections([
            "tenant_a/docs",
            "tenant_a/images",
        ]);

        expect(pointsCounts).toEqual(
            new Map([
                ["tenant_a/docs", 2],
                ["tenant_a/images", 3],
            ])
        );
        expect(sessionMock.executeQuery).toHaveBeenCalledTimes(1);
        const firstCall = sessionMock.executeQuery.mock.calls[0] as
            | [string, Record<string, unknown>]
            | undefined;
        expect(firstCall).toBeDefined();
        const query = firstCall?.[0] ?? "";
        const params = firstCall?.[1];
        expect(query).toContain("WHERE collection IN $collections");
        expect(query).toContain("GROUP BY collection");
        expect(params).toMatchObject({
            $collections: {
                type: "list",
                t: "UTF8",
                list: ["tenant_a/docs", "tenant_a/images"],
            },
        });
    });

    it("does not query YDB when counting an empty collection list", async () => {
        const counts = await countPointsForCollections([]);

        expect(counts).toEqual(new Map());
        expect(withSessionMock).not.toHaveBeenCalled();
    });

    it("parses point count from YDB Long-like Uint64 values", async () => {
        withSessionMock.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                {
                                    uint64Value: {
                                        low: 2,
                                        high: 0,
                                        unsigned: true,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        } as unknown as never);

        const pointsCount = await countPointsForCollection(
            "tenant_a/my_collection"
        );

        expect(pointsCount).toBe(2);
    });
});
