import {
    sanitizeCollectionName,
    metaKeyFor,
    uidFor,
} from "../utils/tenant.js";
import { QdrantServiceError } from "./errors.js";

export interface NormalizedCollectionContextLike {
    userUid: string;
    collection: string;
    metaKey: string;
    uid: string;
}

function requireAndSanitizeUserUid(userUid: string | undefined): string {
    if (!userUid || userUid.trim() === "") {
        throw new QdrantServiceError(401, {
            status: "error",
            error: "unauthorized",
        });
    }

    const raw = userUid.toString();
    const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
    const lowered = cleaned.toLowerCase().replace(/^_+/, "");

    if (lowered.length === 0) {
        throw new QdrantServiceError(401, {
            status: "error",
            error: "unauthorized",
        });
    }

    return lowered;
}

export function uidForCollection(
    userUid: string,
    collection: string
): string {
    return uidFor(userUid, collection);
}

export function normalizeCollectionContextShared(
    userUid: string,
    collection: string,
    _userAgent?: string
): {
    userUid: string;
    collection: string;
    metaKey: string;
    uid: string;
} {
    void _userAgent;
    const normalizedUserUid = requireAndSanitizeUserUid(userUid);
    const normalizedCollection = sanitizeCollectionName(collection);
    const metaKey = metaKeyFor(normalizedUserUid, normalizedCollection);
    return {
        userUid: normalizedUserUid,
        collection: normalizedCollection,
        metaKey,
        uid: uidForCollection(normalizedUserUid, normalizedCollection),
    };
}
