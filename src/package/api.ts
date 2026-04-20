import { readyOrThrow, configureDriver } from "../ydb/client.js";
import type { IAuthService } from "ydb-sdk";
import { ensureMetaTable } from "../ydb/schema.js";
import {
    createCollection as serviceCreateCollection,
    deleteCollection as serviceDeleteCollection,
    getCollection as serviceGetCollection,
    putCollectionIndex as servicePutCollectionIndex,
} from "../services/CollectionService.js";
import {
    upsertPoints as serviceUpsertPoints,
    searchPoints as serviceSearchPoints,
    deletePoints as serviceDeletePoints,
    retrievePoints as serviceRetrievePoints,
} from "../services/PointsService.js";
import { deriveUserUidFromApiKey } from "../utils/tenant.js";

export { QdrantServiceError } from "../services/errors.js";
export {
    CreateCollectionReq,
    UpsertPointsReq,
    SearchReq,
    DeletePointsReq,
    RetrievePointsReq,
} from "../qdrant/Requests.js";
export type { UpsertPointsBody, SearchPointsBody } from "../qdrant/Requests.js";
import type { UpsertPointsBody, SearchPointsBody } from "../qdrant/Requests.js";

type CreateCollectionResult = Awaited<
    ReturnType<typeof serviceCreateCollection>
>;
type GetCollectionResult = Awaited<ReturnType<typeof serviceGetCollection>>;
type DeleteCollectionResult = Awaited<
    ReturnType<typeof serviceDeleteCollection>
>;
type PutIndexResult = Awaited<ReturnType<typeof servicePutCollectionIndex>>;
type UpsertPointsResult = Awaited<ReturnType<typeof serviceUpsertPoints>>;
type SearchPointsResult = Awaited<ReturnType<typeof serviceSearchPoints>>;
type DeletePointsResult = Awaited<ReturnType<typeof serviceDeletePoints>>;
type RetrievePointsResult = Awaited<ReturnType<typeof serviceRetrievePoints>>;

export interface YdbQdrantClientOptions {
    userUid?: string;
    apiKey?: string;
    endpoint?: string;
    database?: string;
    connectionString?: string;
    authService?: IAuthService;
}

export interface YdbQdrantClient {
    createCollection(
        collection: string,
        body: unknown
    ): Promise<CreateCollectionResult>;
    getCollection(collection: string): Promise<GetCollectionResult>;
    deleteCollection(collection: string): Promise<DeleteCollectionResult>;
    putCollectionIndex(collection: string): Promise<PutIndexResult>;
    upsertPoints(
        collection: string,
        body: UpsertPointsBody
    ): Promise<UpsertPointsResult>;
    upsertPoints(
        collection: string,
        body: unknown
    ): Promise<UpsertPointsResult>;
    searchPoints(
        collection: string,
        body: SearchPointsBody
    ): Promise<SearchPointsResult>;
    searchPoints(
        collection: string,
        body: unknown
    ): Promise<SearchPointsResult>;
    deletePoints(
        collection: string,
        body: unknown
    ): Promise<DeletePointsResult>;
    retrievePoints(
        collection: string,
        body: unknown
    ): Promise<RetrievePointsResult>;
}

function buildClient(userUid: string, apiKey: string): YdbQdrantClient {
    return {
        createCollection(
            collection: string,
            body: unknown
        ): Promise<CreateCollectionResult> {
            return serviceCreateCollection({ userUid, collection, apiKey }, body);
        },

        getCollection(collection: string): Promise<GetCollectionResult> {
            return serviceGetCollection({
                userUid,
                collection,
                apiKey,
            });
        },

        deleteCollection(collection: string): Promise<DeleteCollectionResult> {
            return serviceDeleteCollection({
                userUid,
                collection,
                apiKey,
            });
        },

        putCollectionIndex(collection: string): Promise<PutIndexResult> {
            return servicePutCollectionIndex({
                userUid,
                collection,
                apiKey,
            });
        },

        upsertPoints(
            collection: string,
            body: unknown
        ): Promise<UpsertPointsResult> {
            return serviceUpsertPoints({ userUid, collection, apiKey }, body);
        },

        searchPoints(
            collection: string,
            body: unknown
        ): Promise<SearchPointsResult> {
            return serviceSearchPoints({ userUid, collection, apiKey }, body);
        },

        deletePoints(
            collection: string,
            body: unknown
        ): Promise<DeletePointsResult> {
            return serviceDeletePoints({ userUid, collection, apiKey }, body);
        },

        retrievePoints(
            collection: string,
            body: unknown
        ): Promise<RetrievePointsResult> {
            return serviceRetrievePoints({ userUid, collection, apiKey }, body);
        },
    };
}

function resolveClientUserUid(options: YdbQdrantClientOptions): string {
    const providedUserUid = options.userUid?.trim();
    if (providedUserUid) {
        return providedUserUid;
    }

    const apiKey = options.apiKey?.trim();
    if (apiKey) {
        return deriveUserUidFromApiKey(apiKey);
    }

    throw new Error(
        "createYdbQdrantClient requires either userUid or apiKey"
    );
}

export async function createYdbQdrantClient(
    options: YdbQdrantClientOptions = {}
): Promise<YdbQdrantClient> {
    if (
        options.endpoint !== undefined ||
        options.database !== undefined ||
        options.connectionString !== undefined ||
        options.authService !== undefined
    ) {
        configureDriver({
            endpoint: options.endpoint,
            database: options.database,
            connectionString: options.connectionString,
            authService: options.authService,
        });
    }

    await readyOrThrow();
    await ensureMetaTable();

    const userUid = resolveClientUserUid(options);
    const signingKey = options.apiKey?.trim() || userUid;

    return buildClient(userUid, signingKey);
}
