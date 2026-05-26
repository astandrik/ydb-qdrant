import type { Payload } from "../qdrant/QdrantRestTypes.js";
import {
    defaultBranchCollectionForRepo,
    pullRequestCollectionForRepo,
    userUidForInstallation,
} from "./naming.js";
import type {
    CodeIndexStore,
    CodeSearchResult,
    EmbeddingProvider,
} from "./types.js";
import type { CodeIndexerQuota } from "./quota.js";

export type CodeSearchRequest = {
    githubUserId?: number | string;
    installationId: number;
    prNumber?: number;
    query: string;
    repoId: number;
    top?: number;
};

export type CodeSearchResponse = {
    collection: string;
    points: CodeSearchResult[];
    userUid: string;
};

export type CodeSearchDeps = {
    embeddingProvider: EmbeddingProvider;
    quota?: CodeIndexerQuota;
    store: CodeIndexStore;
};

export class CodeSearchRequestError extends Error {
    readonly statusCode = 400;

    constructor(message: string) {
        super(message);
        this.name = "CodeSearchRequestError";
    }
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : null;
}

function readPayloadString(payload: Payload | undefined, key: string): string | null {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return null;
    }
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "string" ? value : null;
}

function readPayloadNumber(payload: Payload | undefined, key: string): number | null {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return null;
    }
    const value = (payload as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function parseCodeSearchRequest(value: unknown): CodeSearchRequest {
    const body =
        typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)
            : {};
    const installationId = readNumber(body.installationId);
    const repoId = readNumber(body.repoId);
    const query = readString(body.query);
    const top = readNumber(body.top) ?? 10;
    const prNumber = readNumber(body.prNumber);

    if (installationId === null || repoId === null || query === null) {
        throw new CodeSearchRequestError(
            "installationId, repoId, and query are required"
        );
    }
    if (top <= 0) {
        throw new CodeSearchRequestError("top must be greater than 0");
    }

    return {
        installationId,
        ...(prNumber === null ? {} : { prNumber }),
        query,
        repoId,
        top,
    };
}

export async function searchCode(
    deps: CodeSearchDeps,
    request: CodeSearchRequest
): Promise<CodeSearchResponse> {
    const userUid = userUidForInstallation(request.installationId);
    const collection =
        request.prNumber === undefined
            ? defaultBranchCollectionForRepo(request.repoId)
            : pullRequestCollectionForRepo(request.repoId, request.prNumber);
    if (request.githubUserId !== undefined) {
        await deps.quota?.recordSearch({
            githubUserId: request.githubUserId,
            installationId: request.installationId,
            repoId: request.repoId,
        });
    }
    const queryVector = await deps.embeddingProvider.embedQuery(request.query);
    const points = await deps.store.search({
        collection,
        queryVector,
        top: request.top ?? 10,
        userUid,
    });
    return { collection, points, userUid };
}

export function formatCodeSearchResponse(response: CodeSearchResponse): string {
    if (response.points.length === 0) {
        return `No indexed code results found in ${response.collection}.`;
    }

    const lines = [
        `Found ${response.points.length} indexed code result(s) in ${response.collection}.`,
    ];
    response.points.forEach((point, index) => {
        const path = readPayloadString(point.payload, "path") ?? String(point.id);
        const startLine = readPayloadNumber(point.payload, "startLine");
        const endLine = readPayloadNumber(point.payload, "endLine");
        const language = readPayloadString(point.payload, "language");
        const text = readPayloadString(point.payload, "text");
        const lineRange =
            startLine !== null && endLine !== null ? `:${startLine}-${endLine}` : "";
        const languageSuffix = language ? ` ${language}` : "";
        lines.push(
            `${index + 1}. ${path}${lineRange}${languageSuffix} score=${point.score}`
        );
        if (text) {
            lines.push(truncateText(text, 1_200));
        }
    });
    return lines.join("\n");
}
