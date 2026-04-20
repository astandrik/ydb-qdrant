import { describe, it, expect, vi, beforeEach } from "vitest";

const loggerErrorMock = vi.fn();

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: (...args: unknown[]) => {
            loggerErrorMock(...args);
        },
        debug: vi.fn(),
    },
}));

const isCompilationTimeoutErrorMock = vi.fn<(err: unknown) => boolean>();
const scheduleExitMock = vi.fn<(code: number) => void>();
const isUpsertRequestTimedOutMock = vi.fn<(req: unknown) => boolean>();

vi.mock("../../src/ydb/client.js", () => ({
    isCompilationTimeoutError: (...args: unknown[]) =>
        isCompilationTimeoutErrorMock(...(args as [unknown])),
}));

vi.mock("../../src/utils/exit.js", () => ({
    scheduleExit: (...args: unknown[]) => {
        scheduleExitMock(...(args as [number]));
    },
    __setExitFnForTests: vi.fn(),
}));

vi.mock("../../src/middleware/upsertRequestTimeout.js", () => ({
    isUpsertRequestTimedOut: (...args: unknown[]) =>
        isUpsertRequestTimedOutMock(...args),
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

vi.mock("../../src/services/PointsService.js", () => ({
    upsertPoints: vi.fn().mockResolvedValue({ upserted: 1 }),
    searchPoints: vi.fn().mockResolvedValue({ points: [] }),
    queryPoints: vi.fn().mockResolvedValue({ points: [] }),
    deletePoints: vi.fn().mockResolvedValue({ deleted: 1 }),
    retrievePoints: vi.fn().mockResolvedValue({ points: [] }),
}));

vi.mock("../../src/utils/requestIdentity.js", () => ({
    resolveRequestSigningKey: vi.fn(() => "test-api-key"),
    resolveRequestUserUid: vi.fn(() => "1120000000101690"),
}));

import { pointsRouter } from "../../src/routes/points.js";
import * as pointsService from "../../src/services/PointsService.js";
import { QdrantServiceError } from "../../src/services/errors.js";
import {
    findHandler,
    createMockRes,
    createRequest,
} from "../helpers/routeTestHelpers.js";

beforeEach(() => {
    vi.clearAllMocks();
    isCompilationTimeoutErrorMock.mockReturnValue(false);
    isUpsertRequestTimedOutMock.mockReturnValue(false);
});

describe("pointsRouter (HTTP, mocked service)", () => {
    it("upserts points via both PUT and POST aliases", async () => {
        const putHandler = findHandler(
            pointsRouter,
            "put",
            "/:collection/points"
        );
        const postUpsertHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/upsert"
        );

        const body = {
            points: [{ id: "p1", vector: [0, 0, 0, 1] }],
        };

        const putReq = createRequest({
            method: "PUT",
            collection: "col",
            body,
        });
        const putRes = createMockRes({ authUserUid: "1120000000101690" });

        await putHandler(putReq, putRes);

        expect(pointsService.upsertPoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            body
        );
        expect(putRes.statusCode).toBe(200);
        expect(putRes.body).toMatchObject({
            status: "ok",
            result: { operation_id: 0, status: "completed" },
        });
        expect(putRes.body).toHaveProperty("time");
        expect(typeof putRes.body?.time).toBe("number");
        expect(putRes.body).toHaveProperty("usage", null);

        const postReq = createRequest({
            method: "POST",
            collection: "col",
            body,
        });
        const postRes = createMockRes({ authUserUid: "1120000000101690" });

        await postUpsertHandler(postReq, postRes);

        expect(pointsService.upsertPoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            body
        );
        expect(postRes.statusCode).toBe(200);
        expect(postRes.body).toMatchObject({
            status: "ok",
            result: { operation_id: 0, status: "completed" },
        });
        expect(postRes.body).toHaveProperty("time");
        expect(postRes.body).toHaveProperty("usage", null);
    });

    it("does not call upsert service when request has already timed out", async () => {
        const putHandler = findHandler(
            pointsRouter,
            "put",
            "/:collection/points"
        );

        isUpsertRequestTimedOutMock.mockReturnValueOnce(true);

        const req = createRequest({
            method: "PUT",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await putHandler(req, res);

        expect(pointsService.upsertPoints).not.toHaveBeenCalled();
        expect(res.body).toBeUndefined();
    });

    it("searches, queries and deletes points through service", async () => {
        const searchHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/search"
        );
        const queryHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/query"
        );
        const deleteHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/delete"
        );

        const searchBody = {
            vector: [0, 0, 0, 1],
            top: 2,
        };
        const searchReq = createRequest({
            method: "POST",
            collection: "col",
            body: searchBody,
        });
        const searchRes = createMockRes({ authUserUid: "1120000000101690" });

        vi.mocked(pointsService.searchPoints).mockResolvedValueOnce({
            points: [{ id: "p1", score: 0.9, payload: { label: "p1" } }],
        });

        await searchHandler(searchReq, searchRes);

        expect(pointsService.searchPoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            searchBody
        );
        expect(searchRes.statusCode).toBe(200);
        expect(searchRes.body).toMatchObject({ status: "ok" });
        expect(searchRes.body).toHaveProperty("time");
        expect(typeof searchRes.body?.time).toBe("number");
        expect(searchRes.body).toHaveProperty("usage", null);
        expect(searchRes.body?.result).toEqual([
            expect.objectContaining({
                id: "p1",
                score: 0.9,
                version: 0,
                payload: { label: "p1" },
                vector: null,
                shard_key: null,
                order_value: null,
            }),
        ]);

        const queryBody = {
            query: { vector: [0, 0, 0, 1] },
            limit: 2,
        };
        const queryReq = createRequest({
            method: "POST",
            collection: "col",
            body: queryBody,
        });
        const queryRes = createMockRes({ authUserUid: "1120000000101690" });

        vi.mocked(pointsService.queryPoints).mockResolvedValueOnce({
            points: [{ id: "p2", score: 0.8 }],
        });

        await queryHandler(queryReq, queryRes);

        expect(pointsService.queryPoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            queryBody
        );
        expect(queryRes.statusCode).toBe(200);
        expect(queryRes.body).toMatchObject({ status: "ok" });
        expect(queryRes.body).toHaveProperty("time");
        expect(queryRes.body).toHaveProperty("usage", null);
        expect(queryRes.body?.result).toEqual({
            points: [
                expect.objectContaining({
                    id: "p2",
                    score: 0.8,
                    version: 0,
                    payload: null,
                    vector: null,
                    shard_key: null,
                    order_value: null,
                }),
            ],
        });

        const deleteBody = { points: ["p1", "p2"] };
        const deleteReq = createRequest({
            method: "POST",
            collection: "col",
            body: deleteBody,
        });
        const deleteRes = createMockRes({ authUserUid: "1120000000101690" });

        await deleteHandler(deleteReq, deleteRes);

        expect(pointsService.deletePoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            deleteBody
        );
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body).toMatchObject({
            status: "ok",
            result: { operation_id: 0, status: "completed" },
        });
        expect(deleteRes.body).toHaveProperty("time");
        expect(deleteRes.body).toHaveProperty("usage", null);
    });

    it("returns QdrantServiceError payload and status for points search failures", async () => {
        const searchHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/search"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: {
                vector: [0, 0, 0, 1],
                top: 1,
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        const error = new QdrantServiceError(
            400,
            { status: "error", error: "bad search" },
            "bad search"
        );

        vi.mocked(pointsService.searchPoints).mockRejectedValueOnce(error);

        await searchHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ status: "error", error: "bad search" });
    });

    it("returns 400 and payload for vector dimension mismatch on upsert", async () => {
        const putHandler = findHandler(
            pointsRouter,
            "put",
            "/:collection/points"
        );
        const req = createRequest({
            method: "PUT",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        const error = new QdrantServiceError(
            400,
            {
                status: "error",
                error: "Vector dimension mismatch for id=p1: got 4096, expected 3072",
            },
            "Vector dimension mismatch for id=p1: got 4096, expected 3072"
        );

        vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(error);

        await putHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            status: "error",
            error: "Vector dimension mismatch for id=p1: got 4096, expected 3072",
        });
    });

    it("logs unexpected errors and returns 500 for delete points", async () => {
        const deleteHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/delete"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: { points: ["p1"] },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        vi.mocked(pointsService.deletePoints).mockRejectedValueOnce(
            new Error("boom")
        );

        await deleteHandler(req, res);

        expect(loggerErrorMock).toHaveBeenCalled();
        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            error: "boom",
        });
    });

    it("returns 500 and schedules exit on compilation timeout during upsert (PUT)", async () => {
        const putHandler = findHandler(
            pointsRouter,
            "put",
            "/:collection/points"
        );
        const req = createRequest({
            method: "PUT",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await putHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            error: "compilation timeout",
        });
        expect(scheduleExitMock).toHaveBeenCalledWith(1);
    });

    it("still schedules exit for compilation timeout when PUT request has already timed out", async () => {
        const putHandler = findHandler(
            pointsRouter,
            "put",
            "/:collection/points"
        );
        const req = createRequest({
            method: "PUT",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isUpsertRequestTimedOutMock
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await putHandler(req, res);

        expect(scheduleExitMock).toHaveBeenCalledWith(1);
        expect(res.body).toBeUndefined();
    });

    it("returns 500 and schedules exit on compilation timeout during upsert (POST)", async () => {
        const postUpsertHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/upsert"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await postUpsertHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            error: "compilation timeout",
        });
        expect(loggerErrorMock).toHaveBeenCalled();
        expect(scheduleExitMock).toHaveBeenCalledWith(1);
    });

    it("still schedules exit for compilation timeout when POST upsert alias has already timed out", async () => {
        const postUpsertHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/upsert"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: {
                points: [{ id: "p1", vector: [0, 0, 0, 1] }],
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isUpsertRequestTimedOutMock
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.upsertPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await postUpsertHandler(req, res);

        expect(scheduleExitMock).toHaveBeenCalledWith(1);
        expect(res.body).toBeUndefined();
    });

    it("returns 500 and schedules exit on compilation timeout during search", async () => {
        const searchHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/search"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: {
                vector: [0, 0, 0, 1],
                top: 1,
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.searchPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await searchHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            error: "compilation timeout",
        });
        expect(scheduleExitMock).toHaveBeenCalledWith(1);
    });

    it("returns 500 and schedules exit on compilation timeout during query", async () => {
        const queryHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points/query"
        );
        const req = createRequest({
            method: "POST",
            collection: "col",
            body: {
                query: { vector: [0, 0, 0, 1] },
                limit: 2,
            },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        isCompilationTimeoutErrorMock.mockReturnValueOnce(true);
        vi.mocked(pointsService.queryPoints).mockRejectedValueOnce(
            new Error("compilation timeout")
        );

        await queryHandler(req, res);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            error: "compilation timeout",
        });
        expect(loggerErrorMock).toHaveBeenCalled();
        expect(scheduleExitMock).toHaveBeenCalledWith(1);
    });

    it("retrieves points by IDs via POST /:collection/points", async () => {
        const retrieveHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points"
        );

        vi.mocked(pointsService.retrievePoints).mockResolvedValueOnce({
            points: [
                { id: "meta-uuid", payload: { indexing_complete: true } },
            ],
        });

        const req = createRequest({
            method: "POST",
            collection: "col",
            body: { ids: ["meta-uuid"], with_payload: true },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await retrieveHandler(req, res);

        expect(pointsService.retrievePoints).toHaveBeenCalledWith(
            {
                userUid: "1120000000101690",
                collection: "col",
                apiKey: "test-api-key",
                userAgent: undefined,
            },
            { ids: ["meta-uuid"], with_payload: true }
        );
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ status: "ok" });
        expect(res.body).toHaveProperty("time");
        expect(res.body).toHaveProperty("usage", null);
        expect(res.body?.result).toEqual([
            {
                id: "meta-uuid",
                version: 0,
                payload: { indexing_complete: true },
                vector: null,
                shard_key: null,
                order_value: null,
            },
        ]);
    });

    it("returns QdrantServiceError for retrieve points failures", async () => {
        const retrieveHandler = findHandler(
            pointsRouter,
            "post",
            "/:collection/points"
        );

        const error = new QdrantServiceError(
            404,
            { status: "error", error: "collection not found" },
            "collection not found"
        );
        vi.mocked(pointsService.retrievePoints).mockRejectedValueOnce(error);

        const req = createRequest({
            method: "POST",
            collection: "col",
            body: { ids: ["p1"] },
        });
        const res = createMockRes({ authUserUid: "1120000000101690" });

        await retrieveHandler(req, res);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            status: "error",
            error: "collection not found",
        });
    });
});
