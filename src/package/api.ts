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
} from "../services/PointsService.js";

export { QdrantServiceError } from "../services/errors.js";
export {
  CreateCollectionReq,
  UpsertPointsReq,
  SearchReq,
  DeletePointsReq,
} from "../types.js";
export type { UpsertPointsBody, SearchPointsBody } from "../types.js";

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

export interface YdbQdrantClientOptions {
  defaultTenant?: string;
  endpoint?: string;
  database?: string;
  connectionString?: string;
  authService?: IAuthService;
}

export interface YdbQdrantTenantClient {
  createCollection(
    collection: string,
    body: unknown
  ): Promise<CreateCollectionResult>;
  getCollection(collection: string): Promise<GetCollectionResult>;
  deleteCollection(collection: string): Promise<DeleteCollectionResult>;
  putCollectionIndex(collection: string): Promise<PutIndexResult>;
  upsertPoints(
    collection: string,
    body: import("../types.js").UpsertPointsBody
  ): Promise<UpsertPointsResult>;
  upsertPoints(collection: string, body: unknown): Promise<UpsertPointsResult>;
  searchPoints(
    collection: string,
    body: import("../types.js").SearchPointsBody
  ): Promise<SearchPointsResult>;
  searchPoints(collection: string, body: unknown): Promise<SearchPointsResult>;
  deletePoints(collection: string, body: unknown): Promise<DeletePointsResult>;
}

export interface YdbQdrantClient extends YdbQdrantTenantClient {
  forTenant(tenant: string): YdbQdrantTenantClient;
}

function buildTenantClient(resolveTenant: () => string): YdbQdrantTenantClient {
  return {
    createCollection(
      collection: string,
      body: unknown
    ): Promise<CreateCollectionResult> {
      return serviceCreateCollection(
        { tenant: resolveTenant(), collection },
        body
      );
    },

    getCollection(collection: string): Promise<GetCollectionResult> {
      return serviceGetCollection({ tenant: resolveTenant(), collection });
    },

    deleteCollection(collection: string): Promise<DeleteCollectionResult> {
      return serviceDeleteCollection({ tenant: resolveTenant(), collection });
    },

    putCollectionIndex(collection: string): Promise<PutIndexResult> {
      return servicePutCollectionIndex({ tenant: resolveTenant(), collection });
    },

    upsertPoints(
      collection: string,
      body: unknown
    ): Promise<UpsertPointsResult> {
      return serviceUpsertPoints({ tenant: resolveTenant(), collection }, body);
    },

    searchPoints(
      collection: string,
      body: unknown
    ): Promise<SearchPointsResult> {
      return serviceSearchPoints({ tenant: resolveTenant(), collection }, body);
    },

    deletePoints(
      collection: string,
      body: unknown
    ): Promise<DeletePointsResult> {
      return serviceDeletePoints({ tenant: resolveTenant(), collection }, body);
    },
  };
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

  const defaultTenant = options.defaultTenant ?? "default";

  const baseClient = buildTenantClient(() => defaultTenant);

  const client: YdbQdrantClient = {
    ...baseClient,

    forTenant(tenantId: string): YdbQdrantTenantClient {
      return buildTenantClient(() => tenantId);
    },
  };

  return client;
}
