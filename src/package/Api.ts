import { readyOrThrow, configureDriver } from "../ydb/client.js";
import type { IAuthService } from "ydb-sdk";
import { ensureMetaTable } from "../ydb/schema.js";
import {
  createCollection as serviceCreateCollection,
  deleteCollection as serviceDeleteCollection,
  getCollection as serviceGetCollection,
  putCollectionIndex as servicePutCollectionIndex,
  upsertPoints as serviceUpsertPoints,
  searchPoints as serviceSearchPoints,
  deletePoints as serviceDeletePoints,
} from "../services/QdrantService.js";

export { QdrantServiceError } from "../services/QdrantService.js";
export {
  CreateCollectionReq,
  UpsertPointsReq,
  SearchReq,
  DeletePointsReq,
} from "../types.js";

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
  upsertPoints(collection: string, body: unknown): Promise<UpsertPointsResult>;
  searchPoints(collection: string, body: unknown): Promise<SearchPointsResult>;
  deletePoints(collection: string, body: unknown): Promise<DeletePointsResult>;
}

export interface YdbQdrantClient extends YdbQdrantTenantClient {
  forTenant(tenant: string): YdbQdrantTenantClient;
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

  const resolveTenant = (tenant?: string): string => tenant ?? defaultTenant;

  const client: YdbQdrantClient = {
    async createCollection(
      collection: string,
      body: unknown
    ): Promise<CreateCollectionResult> {
      const tenant = resolveTenant(undefined);
      return await serviceCreateCollection({ tenant, collection }, body);
    },

    async getCollection(collection: string): Promise<GetCollectionResult> {
      const tenant = resolveTenant(undefined);
      return await serviceGetCollection({ tenant, collection });
    },

    async deleteCollection(
      collection: string
    ): Promise<DeleteCollectionResult> {
      const tenant = resolveTenant(undefined);
      return await serviceDeleteCollection({ tenant, collection });
    },

    async putCollectionIndex(collection: string): Promise<PutIndexResult> {
      const tenant = resolveTenant(undefined);
      return await servicePutCollectionIndex({ tenant, collection });
    },

    async upsertPoints(
      collection: string,
      body: unknown
    ): Promise<UpsertPointsResult> {
      const tenant = resolveTenant(undefined);
      return await serviceUpsertPoints({ tenant, collection }, body);
    },

    async searchPoints(
      collection: string,
      body: unknown
    ): Promise<SearchPointsResult> {
      const tenant = resolveTenant(undefined);
      return await serviceSearchPoints({ tenant, collection }, body);
    },

    async deletePoints(
      collection: string,
      body: unknown
    ): Promise<DeletePointsResult> {
      const tenant = resolveTenant(undefined);
      return await serviceDeletePoints({ tenant, collection }, body);
    },

    forTenant(tenantId: string): YdbQdrantTenantClient {
      const tenant = resolveTenant(tenantId);
      return {
        createCollection(
          collection: string,
          body: unknown
        ): Promise<CreateCollectionResult> {
          return serviceCreateCollection({ tenant, collection }, body);
        },

        getCollection(collection: string): Promise<GetCollectionResult> {
          return serviceGetCollection({ tenant, collection });
        },

        deleteCollection(collection: string): Promise<DeleteCollectionResult> {
          return serviceDeleteCollection({ tenant, collection });
        },

        putCollectionIndex(collection: string): Promise<PutIndexResult> {
          return servicePutCollectionIndex({ tenant, collection });
        },

        upsertPoints(
          collection: string,
          body: unknown
        ): Promise<UpsertPointsResult> {
          return serviceUpsertPoints({ tenant, collection }, body);
        },

        searchPoints(
          collection: string,
          body: unknown
        ): Promise<SearchPointsResult> {
          return serviceSearchPoints({ tenant, collection }, body);
        },

        deletePoints(
          collection: string,
          body: unknown
        ): Promise<DeletePointsResult> {
          return serviceDeletePoints({ tenant, collection }, body);
        },
      };
    },
  };

  return client;
}
