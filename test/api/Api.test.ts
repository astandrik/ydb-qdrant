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
    retrievePoints: vi.fn().mockResolvedValue({ points: [] }),
}));

import * as ydbClient from "../../src/ydb/client.js";
import * as schema from "../../src/ydb/schema.js";
import * as collectionService from "../../src/services/CollectionService.js";
import * as pointsService from "../../src/services/PointsService.js";
import { createYdbQdrantClient } from "../../src/package/api.js";
import { deriveUserUidFromApiKey } from "../../src/utils/tenant.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("YdbQdrantClient (programmatic API, mocked YDB)", () => {
    it("forwards all client methods to service when initialized with apiKey", async () => {
        const apiKey = "test-api-key";
        const userUid = deriveUserUidFromApiKey(apiKey);
        const client = await createYdbQdrantClient({
            apiKey,
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
        const retrieveBody = { ids: ["p1"], with_payload: true };
        await client.retrievePoints("col_all", retrieveBody);

        expect(collectionService.createCollection).toHaveBeenCalledWith(
            { userUid, collection: "col_all", apiKey },
            expect.anything()
        );
        expect(collectionService.getCollection).toHaveBeenCalledWith({
            userUid,
            collection: "col_all",
            apiKey,
        });
        expect(collectionService.deleteCollection).toHaveBeenCalledWith({
            userUid,
            collection: "col_all",
            apiKey,
        });
        expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
            userUid,
            collection: "col_all",
            apiKey,
        });
        expect(pointsService.upsertPoints).toHaveBeenCalledWith(
            { userUid, collection: "col_all", apiKey },
            upsertBody
        );
        expect(pointsService.searchPoints).toHaveBeenCalledWith(
            { userUid, collection: "col_all", apiKey },
            searchBody
        );
        expect(pointsService.deletePoints).toHaveBeenCalledWith(
            { userUid, collection: "col_all", apiKey },
            deleteBody
        );
        expect(pointsService.retrievePoints).toHaveBeenCalledWith(
            { userUid, collection: "col_all", apiKey },
            retrieveBody
        );
    });

    it("uses userUid as signing key when initialized with userUid only", async () => {
        const client = await createYdbQdrantClient({
            userUid: "test_user",
        });

        await client.searchPoints("col_user", {
            vector: [0, 0, 0, 1],
            top: 1,
        });

        expect(pointsService.searchPoints).toHaveBeenCalledWith(
            {
                userUid: "test_user",
                collection: "col_user",
                apiKey: "test_user",
            },
            {
                vector: [0, 0, 0, 1],
                top: 1,
            }
        );
    });

    it("configures the YDB driver and ensures metadata table before returning a client", async () => {
        const client = await createYdbQdrantClient({
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

    it("rejects ambiguous identity when apiKey and userUid are both provided", async () => {
        await expect(
            createYdbQdrantClient({
                userUid: "test_user",
                apiKey: "test-api-key",
            })
        ).rejects.toThrow(/exactly one of apiKey or userUid/);
    });
});
