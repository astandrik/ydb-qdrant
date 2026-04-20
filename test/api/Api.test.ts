import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/ydb/client.js", () => ({
    readyOrThrow: vi.fn().mockResolvedValue(undefined),
    configureDriver: vi.fn(),
}));

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

vi.mock("../../src/services/errors.js", () => ({
    QdrantServiceError: class QdrantServiceError extends Error {},
}));

vi.mock("../../src/services/CollectionService.js", () => ({
    createCollection: vi.fn().mockResolvedValue({ name: "col" }),
    getCollection: vi.fn().mockResolvedValue({
        name: "col",
        vectors: { size: 4, distance: "Cosine", data_type: "float" },
    }),
    deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
    putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
}));

vi.mock("../../src/services/PointsService.js", () => ({
    upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
    searchPoints: vi.fn().mockResolvedValue({ points: [] }),
    deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
}));

import * as ydbClient from "../../src/ydb/client.js";
import * as schema from "../../src/ydb/schema.js";
import * as collectionService from "../../src/services/CollectionService.js";
import * as pointsService from "../../src/services/PointsService.js";
import { createYdbQdrantClient } from "../../src/package/api.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("YdbQdrantClient (programmatic API, mocked YDB)", () => {
    it("forwards all client methods to service (single-tenant)", async () => {
        const client = await createYdbQdrantClient({
            userUid: "test_user",
            apiKey: "test-api-key",
        });

        await client.createCollection("col_all", {
            vectors: { size: 4, distance: "Cosine", data_type: "float" },
        });
        await client.getCollection("col_all");
        await client.deleteCollection("col_all");
        await client.putCollectionIndex("col_all");

        const upsertBody = {
            points: [{ id: "p1", vector: [0, 0, 0, 1] }],
        };
        await client.upsertPoints("col_all", upsertBody);

        const searchBody = {
            vector: [0, 0, 0, 1],
            top: 1,
        };
        await client.searchPoints("col_all", searchBody);

        const deleteBody = { points: ["p1", "p2"] };
        await client.deletePoints("col_all", deleteBody);

        expect(collectionService.createCollection).toHaveBeenCalledWith(
            { userUid: "test_user", collection: "col_all", apiKey: "test-api-key" },
            expect.anything()
        );
        expect(collectionService.getCollection).toHaveBeenCalledWith({
            userUid: "test_user",
            collection: "col_all",
            apiKey: "test-api-key",
        });
        expect(collectionService.deleteCollection).toHaveBeenCalledWith({
            userUid: "test_user",
            collection: "col_all",
            apiKey: "test-api-key",
        });
        expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
            userUid: "test_user",
            collection: "col_all",
            apiKey: "test-api-key",
        });
        expect(pointsService.upsertPoints).toHaveBeenCalledWith(
            { userUid: "test_user", collection: "col_all", apiKey: "test-api-key" },
            upsertBody
        );
        expect(pointsService.searchPoints).toHaveBeenCalledWith(
            { userUid: "test_user", collection: "col_all", apiKey: "test-api-key" },
            searchBody
        );
        expect(pointsService.deletePoints).toHaveBeenCalledWith(
            { userUid: "test_user", collection: "col_all", apiKey: "test-api-key" },
            deleteBody
        );
    });

    it("configures the YDB driver and ensures metadata table before returning a client", async () => {
        const client = await createYdbQdrantClient({
            userUid: "test_user",
            apiKey: "test-api-key",
            endpoint: "grpc://localhost:2136",
            database: "/local",
        });

        expect(ydbClient.configureDriver).toHaveBeenCalledWith({
            endpoint: "grpc://localhost:2136",
            database: "/local",
            connectionString: undefined,
            authService: undefined,
        });
        expect(ydbClient.readyOrThrow).toHaveBeenCalledTimes(1);
        expect(schema.ensureMetaTable).toHaveBeenCalledTimes(1);

        await client.getCollection("col_driver");
    });
});
