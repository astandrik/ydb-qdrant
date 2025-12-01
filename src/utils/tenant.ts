import { createHash } from "crypto";

export function hashApiKey(apiKey: string | undefined): string | undefined {
  if (!apiKey || apiKey.trim() === "") return undefined;
  const hash = createHash("sha256").update(apiKey).digest("hex");
  return hash.slice(0, 8);
}

export function hashUserAgent(
  userAgent: string | undefined
): string | undefined {
  if (!userAgent || userAgent.trim() === "") return undefined;
  const hash = createHash("sha256").update(userAgent).digest("hex");
  return hash.slice(0, 8);
}

export function sanitizeCollectionName(
  name: string,
  apiKeyHash?: string,
  userAgentHash?: string
): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const lowered = cleaned.toLowerCase().replace(/^_+/, "");
  const base = lowered.length > 0 ? lowered : "collection";

  const hasApiKey = apiKeyHash !== undefined && apiKeyHash.trim().length > 0;
  const hasUserAgent =
    userAgentHash !== undefined && userAgentHash.trim().length > 0;

  if (hasApiKey && hasUserAgent) {
    return `${base}_${apiKeyHash}_${userAgentHash}`;
  } else if (hasApiKey) {
    return `${base}_${apiKeyHash}`;
  } else if (hasUserAgent) {
    return `${base}_${userAgentHash}`;
  }
  return base;
}

export function sanitizeTenantId(tenantId: string | undefined): string {
  const raw = (tenantId ?? "default").toString();
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const lowered = cleaned.toLowerCase().replace(/^_+/, "");
  return lowered.length > 0 ? lowered : "default";
}

export function tableNameFor(
  sanitizedTenant: string,
  sanitizedCollection: string
): string {
  return `qdr_${sanitizedTenant}__${sanitizedCollection}`;
}

export function metaKeyFor(
  sanitizedTenant: string,
  sanitizedCollection: string
): string {
  return `${sanitizedTenant}/${sanitizedCollection}`;
}

export function uidFor(
  sanitizedTenant: string,
  sanitizedCollection: string
): string {
  return tableNameFor(sanitizedTenant, sanitizedCollection);
}
