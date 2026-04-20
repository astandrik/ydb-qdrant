import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/ydb/schema.js", () => ({
    ensureMetaTable: vi.fn().mockResolvedValue(undefined),
    ensureGlobalPointsTable: vi.fn().mockResolvedValue(undefined),
    GLOBAL_POINTS_TABLE: "qdrant_all_points",
}));

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/config/env.js", async () => {
    const actual = await vi.importActual<
        typeof import("../../src/config/env.js")
    >("../../src/config/env.js");

    return {
        ...actual,
        LOG_LEVEL: "info",
    };
});

vi.mock("../../src/repositories/collectionsRepo.js", () => ({
    getCollectionMeta: vi.fn(),
    createCollection: vi.fn(),
    deleteCollection: vi.fn(),
    deleteAllPointsForCollection: vi.fn().mockResolvedValue(undefined),
    touchCollectionLastAccess: vi.fn().mockResolvedValue(undefined),
    hasPointsForCollection: vi.fn().mockResolvedValue(false),
}));

vi.mock("../../src/repositories/pointsRepo.js", () => ({
    upsertPoints: vi.fn(),
    searchPoints: vi.fn(),
    deletePoints: vi.fn(),
    deletePointsByPathSegments: vi.fn(),
    retrievePointsByIds: vi.fn(),
}));

import * as collectionsRepo from "../../src/repositories/collectionsRepo.js";
import * as pointsRepo from "../../src/repositories/pointsRepo.js";
import { logger } from "../../src/logging/logger.js";
import {
    createCollection,
    getCollection,
    deleteCollection,
    putCollectionIndex,
} from "../../src/services/CollectionService.js";
import {
    upsertPoints,
    searchPoints,
    queryPoints,
    deletePoints,
    retrievePoints,
} from "../../src/services/PointsService.js";
import { QdrantServiceError } from "../../src/services/errors.js";

describe("QdrantService (with mocked YDB)", () => {
    const collection = "my_collection";
    const userUid = "test_user";
    const apiKey = "test-api-key";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates a new collection when metadata is missing", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );
        vi.mocked(collectionsRepo.createCollection).mockResolvedValueOnce(
            undefined
        );

        const result = await createCollection(
            { userUid, collection, apiKey },
            {
                vectors: {
                    size: 128,
                    distance: "Cosine",
                    data_type: "float",
                },
            }
        );

        expect(result).toEqual({ name: "my_collection" });
        expect(collectionsRepo.createCollection).toHaveBeenCalledTimes(1);
    });

    it("returns existing collection when config matches metadata", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 128,
            distance: "Cosine",
            vectorType: "float",
        });

        const result = await createCollection(
            { userUid, collection, apiKey },
            {
                vectors: {
                    size: 128,
                    distance: "Cosine",
                    data_type: "float",
                },
            }
        );

        expect(result).toEqual({ name: "my_collection" });
        expect(collectionsRepo.createCollection).not.toHaveBeenCalled();
    });

    it("throws when creating collection with conflicting config", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 256,
            distance: "Euclid",
            vectorType: "float",
        });

        await expect(
            createCollection(
                { userUid, collection, apiKey },
                {
                    vectors: {
                        size: 128,
                        distance: "Euclid",
                        data_type: "float",
                    },
                }
            )
        ).rejects.toBeInstanceOf(QdrantServiceError);
    });

    it("rejects invalid create collection payload", async () => {
        await expect(
            createCollection({ userUid, collection, apiKey }, { invalid: true })
        ).rejects.toHaveProperty("statusCode", 400);
        expect(collectionsRepo.getCollectionMeta).not.toHaveBeenCalled();
    });

    it("returns collection description when metadata exists", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 128,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(collectionsRepo.hasPointsForCollection).mockResolvedValueOnce(
            true
        );

        const result = await getCollection({ userUid, collection, apiKey });

        expect(result).toEqual({
            status: "green",
            points_count: 1,
            name: "my_collection",
            vectors: {
                size: 128,
                distance: "Cosine",
                data_type: "float",
            },
            config: {
                params: {
                    vectors: {
                        size: 128,
                        distance: "Cosine",
                        data_type: "float",
                    },
                },
            },
        });
    });

    it("throws when getting collection that does not exist", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            getCollection({ userUid, collection, apiKey })
        ).rejects.toHaveProperty(
            "statusCode",
            404
        );
    });

    it("deletes collection via repository", async () => {
        vi.mocked(collectionsRepo.deleteCollection).mockResolvedValueOnce(
            undefined
        );

        const result = await deleteCollection({ userUid, collection, apiKey });

        expect(result).toEqual({ acknowledged: true });
        expect(collectionsRepo.deleteCollection).toHaveBeenCalledWith(
            "test_user/my_collection"
        );
    });

    it("acknowledges putCollectionIndex when metadata exists", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 128,
            distance: "Cosine",
            vectorType: "float",
        });

        const result = await putCollectionIndex({ userUid, collection, apiKey });

        expect(result).toEqual({ acknowledged: true });
        expect(collectionsRepo.getCollectionMeta).toHaveBeenCalledTimes(1);
    });

    it("throws 404 from putCollectionIndex when collection is missing", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            putCollectionIndex({ userUid, collection, apiKey })
        ).rejects.toHaveProperty("statusCode", 404);
    });

    it("upserts points via repository", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.upsertPoints).mockResolvedValueOnce(2);

        const result = await upsertPoints(
            { userUid, collection, apiKey },
            {
                points: [
                    { id: "p1", vector: [0, 0, 0, 1] },
                    { id: "p2", vector: [0, 0, 1, 0] },
                ],
            }
        );

        expect(result).toEqual({ upserted: 2 });
        expect(pointsRepo.upsertPoints).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                phase: "upsertPrepare",
                collection: "my_collection",
                uid: "test_user/my_collection",
                pointCount: 2,
                pathCount: 0,
            }),
            "upsert: prepare phase"
        );
        expect(logger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                phase: "upsertComplete",
                collection: "my_collection",
                uid: "test_user/my_collection",
                pointCount: 2,
            }),
            "upsert: completed"
        );
    });

    it("logs unique payload paths during upsert", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.upsertPoints).mockResolvedValueOnce(3);

        await upsertPoints(
            { userUid, collection, apiKey },
            {
                points: [
                    {
                        id: "p1",
                        vector: [0, 0, 0, 1],
                        payload: {
                            pathSegments: ["src", "hooks", "useMonacoGhost.ts"],
                        },
                    },
                    {
                        id: "p2",
                        vector: [0, 0, 1, 0],
                        payload: {
                            pathSegments: {
                                0: "src",
                                1: "hooks",
                                2: "useMonacoGhost.ts",
                            },
                        },
                    },
                    {
                        id: "p3",
                        vector: [0, 1, 0, 0],
                        payload: {
                            pathSegments: ["src", "components", "Button.tsx"],
                        },
                    },
                ],
            }
        );

        expect(logger.info).toHaveBeenCalledWith(
            {
                collection: "my_collection",
                uid: "test_user/my_collection",
                pointCount: 3,
                pathCount: 2,
                paths: [
                    "src/hooks/useMonacoGhost.ts",
                    "src/components/Button.tsx",
                ],
                pathsTruncated: false,
            },
            "upsertPoints: payload paths"
        );
    });

    it("maps vector dimension mismatch during upsert to QdrantServiceError 400", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.upsertPoints).mockRejectedValueOnce(
            new Error(
                "Vector dimension mismatch for id=p1: got 4096, expected 3072"
            )
        );

        await expect(
            upsertPoints(
                { userUid, collection, apiKey },
                {
                    points: [{ id: "p1", vector: [0, 0, 0, 1] }],
                }
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            payload: {
                status: "error",
                error: "Vector dimension mismatch for id=p1: got 4096, expected 3072",
            },
        });
    });

    it("throws 404 when upserting points into a missing collection", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            upsertPoints(
                { userUid, collection, apiKey },
                {
                    points: [{ id: "p1", vector: [0, 0, 0, 1] }],
                }
            )
        ).rejects.toHaveProperty("statusCode", 404);
    });

    it("rejects invalid upsert points payload", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });

        await expect(
            upsertPoints(
                { userUid, collection, apiKey },
                {
                    points: [{ id: "p1", vector: "not-a-vector" }],
                }
            )
        ).rejects.toHaveProperty("statusCode", 400);
        expect(pointsRepo.upsertPoints).not.toHaveBeenCalled();
    });

    it("searches points via repository and applies no threshold by default", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.9, payload: { a: 1 } },
            { id: "p2", score: 0.7, payload: { b: 2 } },
        ]);

        const result = await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 2,
                with_payload: true,
            }
        );

        expect(result.points).toHaveLength(2);
        expect(pointsRepo.searchPoints).toHaveBeenCalledTimes(1);
    });

    it("forwards pathSegments filter to repository for search", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.75 },
        ]);

        await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 5,
                with_payload: false,
                filter: {
                    must: [
                        { key: "pathSegments.0", match: { value: "src" } },
                        { key: "pathSegments.1", match: { value: "hooks" } },
                    ],
                },
            }
        );

        expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            false,
            "Cosine",
            4,
            "test_user/my_collection",
            expect.any(String),
            [["src", "hooks"]]
        );
    });

    it("ignores malformed pathSegments filter in searchPoints", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.75 },
        ]);

        const result = await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 5,
                filter: {
                    must: [{ key: "pathSegments.1", match: { value: "hooks" } }],
                },
            }
        );

        expect(result.points).toEqual([{ id: "p1", score: 0.25 }]);
        expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
            "qdrant_all_points",
            [0, 0, 0, 1],
            5,
            undefined,
            "Cosine",
            4,
            "test_user/my_collection",
            apiKey,
            undefined
        );
    });

    it("filters search results using score_threshold for similarity metrics", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Dot",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.9, payload: { a: 1 } },
            { id: "p2", score: 0.4, payload: { b: 2 } },
        ]);

        const result = await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 10,
                with_payload: true,
                score_threshold: 0.5,
            }
        );

        expect(result.points.map((p) => p.id)).toEqual(["p1"]);
    });

    it("filters search results using score_threshold for distance metrics", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Euclid",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.3 },
            { id: "p2", score: 0.8 },
        ]);

        const result = await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 10,
                with_payload: false,
                score_threshold: 0.5,
            }
        );

        expect(result.points.map((p) => p.id)).toEqual(["p1"]);
    });

    it("interprets score_threshold for Cosine as minimum similarity and returns similarity-like scores", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.1 },
            { id: "p2", score: 0.7 },
        ]);

        const result = await searchPoints(
            { userUid, collection, apiKey },
            {
                vector: [0, 0, 0, 1],
                top: 10,
                with_payload: false,
                score_threshold: 0.5,
            }
        );

        expect(result.points.map((p) => p.id)).toEqual(["p1"]);
        // Repository returns distance scores; service converts to ~1 - distance.
        expect(result.points[0]?.score).toBeCloseTo(0.9, 5);
    });

    it("maps vector dimension mismatch during search to QdrantServiceError 400", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 3072,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockRejectedValueOnce(
            new Error("Vector dimension mismatch: got 4096, expected 3072")
        );

        await expect(
            searchPoints(
                { userUid, collection, apiKey },
                {
                    vector: new Array(4096).fill(0),
                    top: 1,
                }
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            payload: {
                status: "error",
                error: "Vector dimension mismatch: got 4096, expected 3072",
            },
        });
    });

    it("uses loose query normalization in queryPoints", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([]);

        await queryPoints(
            { userUid, collection, apiKey },
            {
                query: {
                    nearest: {
                        vector: [0, 0, 0, 1],
                    },
                },
                limit: 1,
                with_payload: { some: "field" },
            }
        );

        expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
            "qdrant_all_points",
            [0, 0, 0, 1],
            1,
            true,
            "Cosine",
            4,
            "test_user/my_collection",
            apiKey,
            undefined
        );
    });

    it("forwards pathSegments filter in queryPoints", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([]);

        await queryPoints(
            { userUid, collection, apiKey },
            {
                query: {
                    nearest: {
                        vector: [0, 0, 0, 1],
                    },
                },
                limit: 3,
                filter: {
                    must: [
                        { key: "pathSegments.0", match: { value: "src" } },
                        { key: "pathSegments.1", match: { value: "hooks" } },
                    ],
                },
            }
        );

        expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
            "qdrant_all_points",
            [0, 0, 0, 1],
            3,
            undefined,
            "Cosine",
            4,
            "test_user/my_collection",
            apiKey,
            [["src", "hooks"]]
        );
    });

    it("ignores malformed pathSegments filter in queryPoints", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.searchPoints).mockResolvedValueOnce([
            { id: "p1", score: 0.75 },
        ]);

        const result = await queryPoints(
            { userUid, collection, apiKey },
            {
                query: {
                    nearest: {
                        vector: [0, 0, 0, 1],
                    },
                },
                limit: 3,
                filter: {
                    must: [{ key: "pathSegments.1", match: { value: "hooks" } }],
                },
            }
        );

        expect(result.points).toEqual([{ id: "p1", score: 0.25 }]);
        expect(pointsRepo.searchPoints).toHaveBeenCalledWith(
            "qdrant_all_points",
            [0, 0, 0, 1],
            3,
            undefined,
            "Cosine",
            4,
            "test_user/my_collection",
            apiKey,
            undefined
        );
    });

    it("logs and throws when search payload is invalid", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });

        await expect(
            searchPoints(
                { userUid, collection, apiKey },
                {
                    vector: "not-a-vector",
                    top: "not-a-number",
                }
            )
        ).rejects.toHaveProperty("statusCode", 400);

        expect(logger.warn).toHaveBeenCalled();
        expect(pointsRepo.searchPoints).not.toHaveBeenCalled();
    });

    it("logs and throws 404 when collection is missing during search", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            searchPoints(
                { userUid, collection, apiKey },
                {
                    vector: [0, 0, 0, 1],
                    top: 1,
                }
            )
        ).rejects.toHaveProperty("statusCode", 404);

        expect(logger.warn).toHaveBeenCalled();
        expect(pointsRepo.searchPoints).not.toHaveBeenCalled();
    });

    it("deletes points via repository", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.deletePoints).mockResolvedValueOnce(3);

        const result = await deletePoints(
            { userUid, collection, apiKey },
            { points: ["p1", "p2", "p3"] }
        );

        expect(result).toEqual({ deleted: 3 });
        expect(pointsRepo.deletePoints).toHaveBeenCalledTimes(1);
    });

    it("deletes points by filter (pathSegments.*) via repository", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.deletePointsByPathSegments).mockResolvedValueOnce(
            2
        );

        const result = await deletePoints(
            { userUid, collection, apiKey },
            {
                filter: {
                    must: [
                        { key: "pathSegments.0", match: { value: "src" } },
                        { key: "pathSegments.1", match: { value: "hooks" } },
                        {
                            key: "pathSegments.2",
                            match: { value: "useMonacoGhost.ts" },
                        },
                    ],
                },
            }
        );

        expect(result).toEqual({ deleted: 2 });
        expect(pointsRepo.deletePointsByPathSegments).toHaveBeenCalledWith(
            "qdrant_all_points",
            "test_user/my_collection",
            [["src", "hooks", "useMonacoGhost.ts"]]
        );
    });

    it("throws 404 when deleting points for a missing collection", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            deletePoints(
                { userUid, collection, apiKey },
                {
                    points: ["p1"],
                }
            )
        ).rejects.toHaveProperty("statusCode", 404);
        expect(pointsRepo.deletePoints).not.toHaveBeenCalled();
    });

    it("rejects invalid delete points payload", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });

        await expect(
            deletePoints(
                { userUid, collection, apiKey },
                {
                    points: "not-an-array",
                }
            )
        ).rejects.toHaveProperty("statusCode", 400);
        expect(pointsRepo.deletePoints).not.toHaveBeenCalled();
    });

    it("deletes all points via empty filter { must: [] }", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });

        const result = await deletePoints(
            { userUid, collection, apiKey },
            { filter: { must: [] } }
        );

        expect(result).toEqual({ deleted: -1 });
        expect(
            collectionsRepo.deleteAllPointsForCollection
        ).toHaveBeenCalledWith("test_user/my_collection");
        expect(pointsRepo.deletePoints).not.toHaveBeenCalled();
        expect(pointsRepo.deletePointsByPathSegments).not.toHaveBeenCalled();
    });

    it("retrieves points by IDs via repository", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });
        vi.mocked(pointsRepo.retrievePointsByIds).mockResolvedValueOnce([
            { id: "p1", payload: { indexing_complete: true } },
            { id: "p2", payload: { key: "value" } },
        ]);

        const result = await retrievePoints(
            { userUid, collection, apiKey },
            { ids: ["p1", "p2"], with_payload: true }
        );

        expect(result.points).toHaveLength(2);
        expect(result.points[0]).toEqual({ id: "p1", payload: { indexing_complete: true } });
        expect(pointsRepo.retrievePointsByIds).toHaveBeenCalledWith(
            "qdrant_all_points",
            ["p1", "p2"],
            "test_user/my_collection",
            apiKey,
            true
        );
    });

    it("throws 404 when retrieving points from a missing collection", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce(
            null
        );

        await expect(
            retrievePoints(
                { userUid, collection, apiKey },
                { ids: ["p1"] }
            )
        ).rejects.toHaveProperty("statusCode", 404);
        expect(pointsRepo.retrievePointsByIds).not.toHaveBeenCalled();
    });

    it("rejects invalid retrieve points payload", async () => {
        vi.mocked(collectionsRepo.getCollectionMeta).mockResolvedValueOnce({
            table: "qdrant_all_points",
            dimension: 4,
            distance: "Cosine",
            vectorType: "float",
        });

        await expect(
            retrievePoints(
                { userUid, collection, apiKey },
                { ids: [] }
            )
        ).rejects.toHaveProperty("statusCode", 400);
        expect(pointsRepo.retrievePointsByIds).not.toHaveBeenCalled();
    });
});
