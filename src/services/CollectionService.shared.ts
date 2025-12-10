import {
  sanitizeCollectionName,
  sanitizeTenantId,
  metaKeyFor,
  tableNameFor as tableNameForInternal,
  uidFor as uidForInternal,
  hashApiKey,
  normalizeUserAgent,
} from "../utils/tenant.js";

export interface NormalizedCollectionContextLike {
  tenant: string;
  collection: string;
  metaKey: string;
}

export function tableNameFor(tenantId: string, collection: string): string {
  return tableNameForInternal(tenantId, collection);
}

export function uidFor(tenantId: string, collection: string): string {
  return uidForInternal(tenantId, collection);
}

export function normalizeCollectionContextShared(
  tenant: string | undefined,
  collection: string,
  apiKey?: string,
  userAgent?: string
): {
  tenant: string;
  collection: string;
  metaKey: string;
} {
  const normalizedTenant = sanitizeTenantId(tenant);
  const apiKeyHash = hashApiKey(apiKey);
  const userAgentNormalized = normalizeUserAgent(userAgent);
  const normalizedCollection = sanitizeCollectionName(
    collection,
    apiKeyHash,
    userAgentNormalized
  );
  const metaKey = metaKeyFor(normalizedTenant, normalizedCollection);
  return {
    tenant: normalizedTenant,
    collection: normalizedCollection,
    metaKey,
  };
}
