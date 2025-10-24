export function sanitizeCollectionName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const lowered = cleaned.toLowerCase().replace(/^_+/, "");
  return lowered.length > 0 ? lowered : "collection";
}

export function sanitizeTenantId(tenantId: string | undefined): string {
  const raw = (tenantId ?? "default").toString();
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
  const lowered = cleaned.toLowerCase().replace(/^_+/, "");
  return lowered.length > 0 ? lowered : "default";
}

export function tableNameFor(tenantId: string, collection: string): string {
  return `qdr_${sanitizeTenantId(tenantId)}__${sanitizeCollectionName(
    collection
  )}`;
}

export function metaKeyFor(tenantId: string, collection: string): string {
  return `${sanitizeTenantId(tenantId)}/${sanitizeCollectionName(collection)}`;
}
