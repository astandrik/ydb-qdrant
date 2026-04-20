import { buildVectorBinaryParams } from "../ydb/helpers.js";
import type { UpsertPoint } from "../qdrant/Requests.js";
import type {
    Payload,
    YdbQdrantScoredPoint,
} from "../qdrant/QdrantRestTypes.js";
import { Piscina, move, transferableSymbol, valueSymbol } from "piscina";
import { computePayloadSign } from "../utils/PayloadSign.js";
import { extractPathPrefix } from "../utils/pathPrefix.js";

export type PrepareUpsertBatchTask = {
    collection: string;
    apiKey: string;
    batch: Array<Pick<UpsertPoint, "id" | "vector" | "payload">>;
};

export type PreparedUpsertRow = {
    collection: string;
    point_id: string;
    embedding: Buffer;
    payload: string;
    payload_sign: string;
    path_prefix: string | null;
};

export function prepareUpsertBatch(
    task: PrepareUpsertBatchTask
): PreparedUpsertRow[] {
    const apiKey = task.apiKey.trim();
    if (apiKey.length === 0) {
        throw new Error("prepareUpsertBatch: apiKey is empty");
    }

    const rows = task.batch.map((p) => {
        const binaries = buildVectorBinaryParams(p.vector);
        const payloadObj = p.payload ?? {};
        return {
            collection: task.collection,
            point_id: String(p.id),
            embedding: binaries.float,
            payload: JSON.stringify(payloadObj),
            payload_sign: computePayloadSign({ apiKey, payload: payloadObj }),
            path_prefix: extractPathPrefix(payloadObj),
        };
    });

    if (!Piscina.isWorkerThread) {
        return rows;
    }

    // Transfer underlying ArrayBuffers to the main thread to avoid cloning large binary payloads.
    // See Node worker_threads transferList semantics and Piscina's Transferable interface:
    // https://nodejs.org/api/worker_threads.html
    // https://www.npmjs.com/package/piscina
    const transferable = {
        get [transferableSymbol](): ArrayBufferLike[] {
            const out: ArrayBufferLike[] = [];
            for (const r of rows) {
                out.push(r.embedding.buffer);
            }
            return out;
        },
        get [valueSymbol](): PreparedUpsertRow[] {
            return rows;
        },
    };

    return move(transferable) as unknown as PreparedUpsertRow[];
}

export type VerifySearchRowsTask = {
    collection: string;
    apiKey: string;
    withPayload: boolean | undefined;
    rows: Array<{
        pointId: string;
        payloadText: string | undefined;
        payloadSign: string | undefined;
        scoreText: string | undefined;
        scoreFloat: number | undefined;
    }>;
};

export type VerifySearchRowsResult = {
    points: YdbQdrantScoredPoint[];
    dropped: Array<{
        pointId: string;
        reason: "missing_payload_or_signature" | "signature_mismatch";
    }>;
};

export function verifySearchRows(task: VerifySearchRowsTask): VerifySearchRowsResult {
    const apiKey = task.apiKey.trim();
    if (apiKey.length === 0) {
        throw new Error("verifySearchRows: apiKey is empty");
    }

    const shouldReturnPayload = task.withPayload === true;
    const points: YdbQdrantScoredPoint[] = [];
    const dropped: VerifySearchRowsResult["dropped"] = [];

    for (const row of task.rows) {
        let payload: Payload | undefined;
        if (row.payloadText) {
            try {
                payload = JSON.parse(row.payloadText) as Payload;
            } catch {
                payload = undefined;
            }
        }

        if (!payload || typeof row.payloadSign !== "string" || row.payloadSign === "") {
            dropped.push({
                pointId: row.pointId,
                reason: "missing_payload_or_signature",
            });
            continue;
        }

        const expected = computePayloadSign({ apiKey, payload });
        if (expected !== row.payloadSign) {
            dropped.push({
                pointId: row.pointId,
                reason: "signature_mismatch",
            });
            continue;
        }

        const score = Number(row.scoreFloat ?? row.scoreText);

        points.push({
            id: row.pointId,
            score,
            ...(shouldReturnPayload ? { payload } : {}),
        });
    }

    return { points, dropped };
}
