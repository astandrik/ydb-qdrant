import type { Request } from "express";
import {
    deriveAnonymousUserUid,
    deriveUserUidFromApiKey,
} from "./tenant.js";

export function parseClientIpFromXForwardedFor(
    value: string | undefined
): string | undefined {
    if (!value) {
        return undefined;
    }

    const first = value.split(",")[0]?.trim();
    return first && first.length > 0 ? first : undefined;
}

export function getRequestApiKey(req: Request): string | undefined {
    const apiKey = req.header("api-key")?.trim();
    return apiKey && apiKey.length > 0 ? apiKey : undefined;
}

export function resolveRequestUserUid(req: Request): string {
    const apiKey = getRequestApiKey(req);
    if (apiKey) {
        return deriveUserUidFromApiKey(apiKey);
    }

    const clientIp =
        parseClientIpFromXForwardedFor(req.header("x-forwarded-for")) ??
        req.socket.remoteAddress ??
        undefined;

    return deriveAnonymousUserUid({
        clientIp,
        userAgent: req.header("User-Agent") ?? undefined,
    });
}

export function resolveRequestSigningKey(
    req: Request,
    userUid?: string
): string {
    const apiKey = getRequestApiKey(req);
    if (apiKey) {
        return apiKey;
    }

    const fallbackUserUid = userUid?.trim();
    if (fallbackUserUid) {
        return fallbackUserUid;
    }

    return resolveRequestUserUid(req);
}
