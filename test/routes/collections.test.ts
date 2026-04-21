import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/services/errors.js", () => {
    class QdrantServiceError extends Error {
        statusCode: number;
        payload: { status: "error"; error: unknown };

        constructor(
            statusCode: number,
            payload: { status: "error"; error: unknown },
            message?: string
        ) {
            super(message ?? String(payload.error));
            this.statusCode = statusCode;
            this.payload = payload;
        }
    }

    return {
        QdrantServiceError,
    };
});

vi.mock("../../src/services/CollectionService.js", () => ({
    createCollection: vi.fn().mockResolvedValue({ name: "col" }),
    getCollection: vi.fn().mockResolvedValue({
        name: "col",
        vectors: { size: 4, distance: "Cosine", data_type: "float" },
    }),
    deleteCollection: vi.fn().mockResolvedValue({ acknowledged: true }),
    putCollectionIndex: vi.fn().mockResolvedValue({ acknowledged: true }),
}));

vi.mock("../../src/utils/requestIdentity.js", () => ({
    isAnonymousIdentityError: vi.fn(
        (err: unknown) =>
            err instanceof Error && err.name === "AnonymousIdentityError"
    ),
    resolveRequestSigningKey: vi.fn(() => "test-api-key"),
    resolveRequestNamespaceUserUid: vi.fn((req: { header: (name: string) => string | undefined }) => {
        const tenantId = req.header("x-tenant-id");
        if (tenantId === "tenant_a") {
            return "tenant_scoped_a";
        }
        if (tenantId === "tenant_b") {
            return "tenant_scoped_b";
        }
        return "1120000000101690";
    }),
}));

import { collectionsRouter } from "../../src/routes/collections.js";
import * as collectionService from "../../src/services/CollectionService.js";
import { QdrantServiceError } from "../../src/services/errors.js";
import * as requestIdentity from "../../src/utils/requestIdentity.js";
import {
    findHandler,
    createMockRes,
    createRequest,
} from "../helpers/routeTestHelpers.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("collectionsRouter (HTTP, mocked service)", () => {
    it("creates collection with raw collection and apiKey", async () => {
        const handler = findHandler(collectionsRouter, "put", "/:collection");
        const req = createRequest({
            method: "PUT",
            collection: "My-Collection",
            body: {
                vectors: { size: 4, distance: "Cosine", data_type: "float" },
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await handler(req, res);

        expect(collectionService.createCollection).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "My-Collection",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            {
                vectors: { size: 4, distance: "Cosine", data_type: "float" },
            }
        );
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ status: "ok", result: true });
        expect(res.body).toHaveProperty("time");
        expect(typeof res.body?.time).toBe("number");
        expect(res.body).toHaveProperty("usage", null);
    });

    it("passes res.locals.authUserUid as userUid into service calls", async () => {
        const handler = findHandler(collectionsRouter, "put", "/:collection");
        const req = createRequest({
            method: "PUT",
            collection: "My-Collection",
            body: {
                vectors: { size: 4, distance: "Cosine", data_type: "float" },
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await handler(req, res);

        expect(collectionService.createCollection).toHaveBeenCalledWith(
            expect.objectContaining({
                userUid: "1120000000101690",
            }),
            expect.anything()
        );
        expect(res.statusCode).toBe(200);
    });

    it("returns QdrantServiceError payload and status code on collection error", async () => {
        const handler = findHandler(collectionsRouter, "put", "/:collection");
        const req = createRequest({
            method: "PUT",
            collection: "col",
            body: {
                vectors: { size: 4, distance: "Cosine", data_type: "float" },
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        const error = new QdrantServiceError(
            422,
            { status: "error", error: "invalid" },
            "invalid"
        );

        vi.mocked(collectionService.createCollection).mockRejectedValueOnce(
            error
        );

        await handler(req, res);
        expect(res.statusCode).toBe(422);
        expect(res.body).toMatchObject({ status: "error", error: "invalid" });
    });

    it("handles get and delete collection through service", async () => {
        const getHandler = findHandler(
            collectionsRouter,
            "get",
            "/:collection"
        );
        const deleteHandler = findHandler(
            collectionsRouter,
            "delete",
            "/:collection"
        );

        const getReq = createRequest({
            method: "GET",
            collection: "My-Collection",
        });
        const getRes = createMockRes({ authUserUid: "1120000000101690" });

        await getHandler(getReq, getRes);

        expect(collectionService.getCollection).toHaveBeenCalledWith({
            userUid: "1120000000101690",
            collection: "My-Collection",
            apiKey: "test-api-key",
            userAgent: undefined,
        });
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body).toHaveProperty("time");
        expect(getRes.body).toHaveProperty("usage", null);

        const deleteReq = createRequest({
            method: "DELETE",
            collection: "My-Collection",
        });
        const deleteRes = createMockRes({ authUserUid: "1120000000101690" });

        await deleteHandler(deleteReq, deleteRes);

        expect(collectionService.deleteCollection).toHaveBeenCalledWith({
            userUid: "1120000000101690",
            collection: "My-Collection",
            apiKey: "test-api-key",
            userAgent: undefined,
        });
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body).toMatchObject({ status: "ok", result: true });
        expect(deleteRes.body).toHaveProperty("time");
        expect(deleteRes.body).toHaveProperty("usage", null);
    });

    it("invokes putCollectionIndex with raw collection and apiKey from request", async () => {
        const handler = findHandler(
            collectionsRouter,
            "put",
            "/:collection/index"
        );
        const req = createRequest({
            method: "PUT",
            collection: "raw-col",
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await handler(req, res);

        expect(collectionService.putCollectionIndex).toHaveBeenCalledWith({
            userUid: "1120000000101690",
            collection: "raw-col",
            apiKey: "test-api-key",
            userAgent: undefined,
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            status: "ok",
            result: { operation_id: 0, status: "completed" },
        });
        expect(res.body).toHaveProperty("time");
        expect(res.body).toHaveProperty("usage", null);
    });

    it("passes different tenant-scoped userUids for the same api-key", async () => {
        const handler = findHandler(collectionsRouter, "get", "/:collection");

        const tenantAReq = createRequest({
            method: "GET",
            collection: "My-Collection",
            headers: {
                "api-key": "shared-api-key",
                "x-tenant-id": "tenant_a",
            },
        });
        const tenantARes = createMockRes();

        await handler(tenantAReq, tenantARes);

        expect(collectionService.getCollection).toHaveBeenNthCalledWith(1, {
            userUid: "tenant_scoped_a",
            collection: "My-Collection",
            apiKey: "test-api-key",
            userAgent: undefined,
        });

        const tenantBReq = createRequest({
            method: "GET",
            collection: "My-Collection",
            headers: {
                "api-key": "shared-api-key",
                "x-tenant-id": "tenant_b",
            },
        });
        const tenantBRes = createMockRes();

        await handler(tenantBReq, tenantBRes);

        expect(collectionService.getCollection).toHaveBeenNthCalledWith(2, {
            userUid: "tenant_scoped_b",
            collection: "My-Collection",
            apiKey: "test-api-key",
            userAgent: undefined,
        });
    });

    it("returns validation error when anonymous identity cannot be resolved", async () => {
        const handler = findHandler(collectionsRouter, "get", "/:collection");
        const error = new Error(
            "Anonymous requests require api-key or identifiable client metadata."
        );
        error.name = "AnonymousIdentityError";
        vi.mocked(
            requestIdentity.resolveRequestNamespaceUserUid
        ).mockImplementationOnce(() => {
            throw error;
        });

        const req = createRequest({
            method: "GET",
            collection: "My-Collection",
        });
        const res = createMockRes();

        await handler(req, res);

        expect(collectionService.getCollection).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            status: "error",
            error: "Anonymous requests require api-key or identifiable client metadata.",
        });
    });
});
