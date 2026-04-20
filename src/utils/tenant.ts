import { createHash } from "node:crypto";

const API_KEY_UID_PREFIX = "ak";
const ANONYMOUS_UID_PREFIX = "anon";
const UID_HASH_LENGTH = 16;

function shortHash(value: string): string {
    return createHash("sha256").update(value).digest("hex").slice(0, UID_HASH_LENGTH);
}

export function normalizeUserAgent(
    userAgent: string | undefined
): string | undefined {
    if (!userAgent || userAgent.trim() === "") return undefined;
    let lowered = userAgent
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (lowered.length === 0) return undefined;

    const MAX_LEN = 32;
    if (lowered.length > MAX_LEN) {
        lowered = lowered.slice(0, MAX_LEN).replace(/_+$/g, "");
    }

    if (lowered.length === 0) return undefined;

    return lowered;
}

export function sanitizeCollectionName(
    name: string,
    _userAgentNormalized?: string
): string {
    void _userAgentNormalized;
    const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
    const lowered = cleaned.toLowerCase().replace(/^_+/, "");
    return lowered.length > 0 ? lowered : "collection";
}

export function sanitizeUserUid(userUid: string): string {
    const raw = userUid.toString();
    const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
    const lowered = cleaned.toLowerCase().replace(/^_+/, "");
    return lowered.length > 0 ? lowered : "anonymous";
}

export function deriveUserUidFromApiKey(apiKey: string): string {
    const normalizedApiKey = apiKey.trim();
    if (normalizedApiKey.length === 0) {
        throw new Error("deriveUserUidFromApiKey: apiKey is empty");
    }

    return sanitizeUserUid(`${API_KEY_UID_PREFIX}_${shortHash(normalizedApiKey)}`);
}

export function deriveAnonymousUserUid(args: {
    clientIp?: string;
    userAgent?: string;
}): string {
    const normalizedUserAgent = normalizeUserAgent(args.userAgent);
    const identitySeed = [
        args.clientIp?.trim() || "unknown_ip",
        normalizedUserAgent || "unknown_ua",
    ].join("|");

    return sanitizeUserUid(`${ANONYMOUS_UID_PREFIX}_${shortHash(identitySeed)}`);
}

export function metaKeyFor(
    sanitizedUserUid: string,
    sanitizedCollection: string
): string {
    return `${sanitizedUserUid}/${sanitizedCollection}`;
}

export function uidFor(
    sanitizedUserUid: string,
    sanitizedCollection: string
): string {
    return metaKeyFor(sanitizedUserUid, sanitizedCollection);
}
