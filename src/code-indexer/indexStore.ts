import {
    createYdbQdrantClient,
    QdrantServiceError,
    type YdbQdrantClient,
} from "../package/api.js";
import type { Payload } from "../qdrant/QdrantRestTypes.js";
import type {
    CodeIndexStore,
    CodeSearchResult,
    IndexedCodeChunk,
} from "./types.js";
import { pathSegmentsForPath, pointIdForChunk } from "./naming.js";

function pathSegmentsFilter(pathSegments: string[]): {
    filter: {
        must: Array<{ key: string; match: { value: string } }>;
    };
} {
    return {
        filter: {
            must: pathSegments.map((segment, index) => ({
                key: `pathSegments.${index}`,
                match: { value: segment },
            })),
        },
    };
}

function isCollectionMissingError(err: unknown): boolean {
    return err instanceof QdrantServiceError && err.statusCode === 404;
}

function payloadForChunk(chunk: IndexedCodeChunk): Payload {
    const payload: Payload = {
        blobSha: chunk.blobSha,
        endLine: chunk.endLine,
        language: chunk.language,
        owner: chunk.owner,
        path: chunk.path,
        pathSegments: chunk.pathSegments,
        ref: chunk.ref,
        repo: chunk.repo,
        repoId: chunk.repoId,
        sha: chunk.sha,
        source: "github",
        startLine: chunk.startLine,
    };

    if (chunk.text.length > 0) {
        payload.text = chunk.text;
    }
    if (chunk.chunker) {
        payload.chunker = chunk.chunker;
    }
    if (chunk.chunkKind) {
        payload.chunkKind = chunk.chunkKind;
    }
    if (chunk.symbolName) {
        payload.symbolName = chunk.symbolName;
    }
    if (chunk.symbolPath) {
        payload.symbolPath = chunk.symbolPath;
    }

    return payload;
}

export class YdbQdrantIndexStore implements CodeIndexStore {
    private readonly clients = new Map<string, Promise<YdbQdrantClient>>();
    private readonly includeTextInPayload: boolean;

    constructor(options: { includeTextInPayload?: boolean } = {}) {
        this.includeTextInPayload = options.includeTextInPayload ?? true;
    }

    async countCollection(params: {
        collection: string;
        userUid: string;
    }): Promise<number> {
        const client = await this.clientForUser(params.userUid);
        try {
            const result = await client.getCollection(params.collection);
            return result.points_count;
        } catch (err: unknown) {
            if (!isCollectionMissingError(err)) {
                throw err;
            }
            return 0;
        }
    }

    async deleteCollection(params: {
        collection: string;
        userUid: string;
    }): Promise<void> {
        const client = await this.clientForUser(params.userUid);
        try {
            await client.deleteCollection(params.collection);
        } catch (err: unknown) {
            if (!isCollectionMissingError(err)) {
                throw err;
            }
        }
    }

    async deletePath(params: {
        collection: string;
        pathSegments: string[];
        userUid: string;
    }): Promise<void> {
        if (params.pathSegments.length === 0) {
            return;
        }
        const client = await this.clientForUser(params.userUid);
        try {
            await client.deletePoints(
                params.collection,
                pathSegmentsFilter(params.pathSegments)
            );
        } catch (err: unknown) {
            if (!isCollectionMissingError(err)) {
                throw err;
            }
        }
    }

    async ensureCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void> {
        const client = await this.clientForUser(params.userUid);
        await client.createCollection(params.collection, {
            vectors: {
                data_type: "float",
                distance: "Cosine",
                size: params.dimension,
            },
        });
    }

    async resetCollection(params: {
        collection: string;
        dimension: number;
        userUid: string;
    }): Promise<void> {
        await this.deleteCollection({
            collection: params.collection,
            userUid: params.userUid,
        });
        await this.ensureCollection(params);
    }

    async search(params: {
        collection: string;
        queryVector: number[];
        top: number;
        userUid: string;
    }): Promise<CodeSearchResult[]> {
        const client = await this.clientForUser(params.userUid);
        const result = await client.searchPoints(params.collection, {
            top: params.top,
            vector: params.queryVector,
            with_payload: true,
        });
        return (result.points ?? []).map((point) => ({
            id: point.id,
            payload: point.payload,
            score: point.score,
        }));
    }

    async upsertChunks(params: {
        chunks: IndexedCodeChunk[];
        collection: string;
        userUid: string;
        vectors: number[][];
    }): Promise<void> {
        if (params.chunks.length === 0) {
            return;
        }
        if (params.chunks.length !== params.vectors.length) {
            throw new Error("chunks and vectors length mismatch");
        }

        const client = await this.clientForUser(params.userUid);
        await client.upsertPoints(params.collection, {
            points: params.chunks.map((chunk, index) => ({
                id: pointIdForChunk(chunk),
                payload: payloadForChunk({
                    ...chunk,
                    pathSegments:
                        chunk.pathSegments.length > 0
                            ? chunk.pathSegments
                            : pathSegmentsForPath(chunk.path),
                    text: this.includeTextInPayload ? chunk.text : "",
                }),
                vector: params.vectors[index],
            })),
        });
    }

    private clientForUser(userUid: string): Promise<YdbQdrantClient> {
        let client = this.clients.get(userUid);
        if (!client) {
            client = createYdbQdrantClient({ userUid });
            this.clients.set(userUid, client);
        }
        return client;
    }
}
