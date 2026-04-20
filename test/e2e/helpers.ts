import { randomUUID } from "node:crypto";
import { expect } from "vitest";

export type JsonObject = Record<string, unknown>;

export type JsonResponse = {
    status: string;
    result?: unknown;
    error?: unknown;
    time?: number;
    usage?: unknown;
};

export const DEFAULT_API_KEY = "live-ydb-test-api-key";

export const DEFAULT_HEADERS: Record<string, string> = {
    "content-type": "application/json",
    "api-key": DEFAULT_API_KEY,
};

export function headersWithApiKey(apiKey: string): Record<string, string> {
    return { "content-type": "application/json", "api-key": apiKey };
}

export function createCollectionName(): string {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
    return `live_ydb_${suffix}`;
}

export function resolveBaseUrl(): string {
    const configuredBaseUrl = process.env.TEST_BASE_URL?.trim();
    if (!configuredBaseUrl) {
        throw new Error(
            "TEST_BASE_URL must point to a running ydb-qdrant app for live e2e"
        );
    }
    return configuredBaseUrl.replace(/\/+$/, "");
}

export function assertOkResponse(
    response: Response,
    body: JsonResponse,
    context: string
): void {
    expect(response.ok, context).toBe(true);
    expect(body.status, context).toBe("ok");
    expect(typeof body.time, context).toBe("number");
    expect(body.usage, context).toBeNull();
}

export async function fetchJson(
    baseUrl: string,
    path: string,
    init?: RequestInit
): Promise<{ response: Response; body: JsonResponse }> {
    const response = await fetch(`${baseUrl}${path}`, init);
    const body = (await response.json()) as JsonResponse;
    return { response, body };
}

export async function putCollection(
    baseUrl: string,
    collection: string,
    vectors: { size: number; distance: string },
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(baseUrl, `/collections/${collection}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ vectors }),
    });
}

export async function getCollection(
    baseUrl: string,
    collection: string,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(baseUrl, `/collections/${collection}`, {
        method: "GET",
        headers,
    });
}

export async function deleteCollectionReq(
    baseUrl: string,
    collection: string,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(baseUrl, `/collections/${collection}`, {
        method: "DELETE",
        headers,
    });
}

export async function upsertPointsReq(
    baseUrl: string,
    collection: string,
    points: unknown[],
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(baseUrl, `/collections/${collection}/points`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ points }),
    });
}

export async function searchPointsReq(
    baseUrl: string,
    collection: string,
    searchBody: Record<string, unknown>,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(
        baseUrl,
        `/collections/${collection}/points/search`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(searchBody),
        }
    );
}

export async function queryPointsReq(
    baseUrl: string,
    collection: string,
    queryBody: Record<string, unknown>,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(
        baseUrl,
        `/collections/${collection}/points/query`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(queryBody),
        }
    );
}

export async function deletePointsReq(
    baseUrl: string,
    collection: string,
    deleteBody: Record<string, unknown>,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(
        baseUrl,
        `/collections/${collection}/points/delete`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(deleteBody),
        }
    );
}

export async function retrievePointsReq(
    baseUrl: string,
    collection: string,
    retrieveBody: Record<string, unknown>,
    headers: Record<string, string> = DEFAULT_HEADERS
): Promise<{ response: Response; body: JsonResponse }> {
    return fetchJson(baseUrl, `/collections/${collection}/points`, {
        method: "POST",
        headers,
        body: JSON.stringify(retrieveBody),
    });
}

export async function cleanupCollection(
    baseUrl: string,
    collection: string
): Promise<void> {
    try {
        await deleteCollectionReq(baseUrl, collection);
    } catch {
        // best-effort cleanup
    }
}
