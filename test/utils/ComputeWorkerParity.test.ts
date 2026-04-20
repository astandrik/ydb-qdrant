import { describe, it, expect } from "vitest";
import { buildVectorBinaryParams } from "../../src/ydb/helpers.js";
import { computePayloadSign } from "../../src/utils/PayloadSign.js";
import { extractPathPrefix } from "../../src/utils/pathPrefix.js";
import {
    prepareUpsertBatch,
    verifySearchRows,
    type PrepareUpsertBatchTask,
    type VerifySearchRowsTask,
} from "../../src/compute/ComputeWorker.js";

describe("ComputeWorker parity", () => {
    it("prepareUpsertBatch matches inline computation", () => {
        const task: PrepareUpsertBatchTask = {
            collection: "u/c",
            apiKey: " test-api-key ",
            batch: [
                {
                    id: "p1",
                    vector: [0, 0.5, -1, 2],
                    payload: { a: 1, nested: { b: "x", c: [1, 2, 3] } },
                },
                { id: 2, vector: [3, 4, 5, 6], payload: undefined },
            ],
        };

        const actual = prepareUpsertBatch(task);

        const expected = task.batch.map((p) => {
            const binaries = buildVectorBinaryParams(p.vector);
            const payloadObj = p.payload ?? {};
            return {
                collection: task.collection,
                point_id: String(p.id),
                embedding: binaries.float,
                embedding_quantized: binaries.bit,
                payload: JSON.stringify(payloadObj),
                payload_sign: computePayloadSign({
                    apiKey: task.apiKey.trim(),
                    payload: payloadObj,
                }),
                path_prefix: extractPathPrefix(payloadObj),
            };
        });

        expect(actual).toEqual(expected);
    });

    it("prepareUpsertBatch derives path_prefix from object pathSegments", () => {
        const actual = prepareUpsertBatch({
            collection: "u/c",
            apiKey: "test-api-key",
            batch: [
                {
                    id: "p1",
                    vector: [0, 0.5, -1, 2],
                    payload: {
                        pathSegments: {
                            0: "library",
                            1: "yql",
                            2: "file.cpp",
                        },
                    },
                },
            ],
        });

        expect(actual[0]?.path_prefix).toBe("library/yql/file.cpp");
    });

    it("prepareUpsertBatch encodes slash-containing path segments", () => {
        const actual = prepareUpsertBatch({
            collection: "u/c",
            apiKey: "test-api-key",
            batch: [
                {
                    id: "p1",
                    vector: [0, 0.5, -1, 2],
                    payload: {
                        pathSegments: ["src/hooks", "useMonacoGhost.ts"],
                    },
                },
            ],
        });

        expect(actual[0]?.path_prefix).toBe("src%2Fhooks/useMonacoGhost.ts");
    });

    it("verifySearchRows matches inline parse+signature filtering semantics", () => {
        const apiKey = " test-api-key ";
        const collection = "u/c";

        const validPayload = { a: 1, nested: { b: "x" } };
        const validPayloadText = JSON.stringify(validPayload);
        const validSign = computePayloadSign({
            apiKey: apiKey.trim(),
            payload: validPayload,
        });

        const task: VerifySearchRowsTask = {
            collection,
            apiKey,
            withPayload: true,
            rows: [
                {
                    pointId: "p1",
                    payloadText: validPayloadText,
                    payloadSign: validSign,
                    scoreFloat: 0.123,
                    scoreText: undefined,
                },
                {
                    pointId: "p2",
                    payloadText: undefined,
                    payloadSign: validSign,
                    scoreFloat: 0.5,
                    scoreText: undefined,
                },
                {
                    pointId: "p3",
                    payloadText: "{",
                    payloadSign: validSign,
                    scoreFloat: undefined,
                    scoreText: "0.7",
                },
                {
                    pointId: "p4",
                    payloadText: validPayloadText,
                    payloadSign: "bad",
                    scoreFloat: 1,
                    scoreText: undefined,
                },
            ],
        };

        const actual = verifySearchRows(task);

        const expectedPoints = [
            { id: "p1", score: 0.123, payload: validPayload },
        ];
        const expectedDropped = [
            { pointId: "p2", reason: "missing_payload_or_signature" as const },
            { pointId: "p3", reason: "missing_payload_or_signature" as const },
            { pointId: "p4", reason: "signature_mismatch" as const },
        ];

        expect(actual.points).toEqual(expectedPoints);
        expect(actual.dropped).toEqual(expectedDropped);
    });
});

