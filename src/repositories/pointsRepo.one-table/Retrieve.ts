import {
    Types,
    TypedValues,
    withSession,
    createExecuteQuerySettings,
} from "../../ydb/client.js";
import type { Payload } from "../../qdrant/QdrantRestTypes.js";
import { logger } from "../../logging/logger.js";
import { computePayloadSign } from "../../utils/PayloadSign.js";

export interface RetrievedPoint {
    id: string;
    payload: Payload | null;
}

export async function retrievePointsByIdsOneTable(
    tableName: string,
    ids: Array<string | number>,
    uid: string,
    apiKey: string,
    withPayload: boolean
): Promise<RetrievedPoint[]> {
    const stringIds = ids.map(String);

    const qry = `
    DECLARE $collection AS Utf8;
    DECLARE $ids AS List<Utf8>;
    SELECT point_id, payload, payload_sign
    FROM ${tableName}
    WHERE collection = $collection AND point_id IN $ids;
  `;

    const res = await withSession(async (s) => {
        const settings = createExecuteQuerySettings();
        return await s.executeQuery(
            qry,
            {
                $collection: TypedValues.utf8(uid),
                $ids: TypedValues.list(Types.UTF8, stringIds),
            },
            undefined,
            settings
        );
    });

    const rowset = res.resultSets?.[0];
    const rows = (rowset?.rows ?? []) as Array<{
        items?: Array<
            | { textValue?: string }
            | undefined
        >;
    }>;

    const trimmedApiKey = apiKey.trim();
    const out: RetrievedPoint[] = [];

    for (const row of rows) {
        const id = row.items?.[0]?.textValue;
        if (typeof id !== "string") continue;

        const payloadText = row.items?.[1]?.textValue;
        const payloadSign = row.items?.[2]?.textValue;

        let payload: Payload | null = null;
        if (payloadText) {
            try {
                payload = JSON.parse(payloadText) as Payload;
            } catch {
                payload = null;
            }
        }

        if (!payload || typeof payloadSign !== "string" || payloadSign === "") {
            logger.warn(
                { collection: uid, pointId: id },
                "retrieve: payload signature mismatch: missing payload or signature"
            );
            continue;
        }

        const expected = computePayloadSign({ apiKey: trimmedApiKey, payload });
        if (expected !== payloadSign) {
            logger.warn(
                { collection: uid, pointId: id },
                "retrieve: payload signature mismatch: dropping point from results"
            );
            continue;
        }

        out.push({
            id,
            payload: withPayload ? payload : null,
        });
    }

    return out;
}
