import type { Request } from "express";
import {
    deriveAnonymousUserUid,
    deriveUserUidFromApiKey,
    sanitizeUserUid,
} from "./tenant.js";

function sanitizeTenantId(tenantId: string | undefined): string {
    const raw = (tenantId ?? "default").toString();
    const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_");
    const lowered = cleaned.toLowerCase().replace(/^_+/, "");
    return lowered.length > 0 ? lowered : "default";
}

export function getRequestApiKey(req: Request): string | undefined {
    const apiKey = req.header("api-key")?.trim();
    return apiKey && apiKey.length > 0 ? apiKey : undefined;
}

export function getRequestClientIp(req: Request): string | undefined {
    const reqIp =
        typeof req.ip === "string" && req.ip.trim().length > 0
            ? req.ip.trim()
            : undefined;
    if (reqIp) {
        return reqIp;
    }

    const remoteAddress = req.socket.remoteAddress;
    return typeof remoteAddress === "string" && remoteAddress.trim().length > 0
        ? remoteAddress.trim()
        : undefined;
}

export function resolveRequestUserUid(req: Request): string {
    const apiKey = getRequestApiKey(req);
    if (apiKey) {
        return deriveUserUidFromApiKey(apiKey);
    }

    return deriveAnonymousUserUid({
        clientIp: getRequestClientIp(req),
        userAgent: req.header("User-Agent") ?? undefined,
    });
}

export function resolveRequestNamespaceUserUid(req: Request): string {
    const baseUserUid = resolveRequestUserUid(req);
    const tenantId = sanitizeTenantId(req.header("X-Tenant-Id") ?? undefined);
    return sanitizeUserUid(`${baseUserUid}_${tenantId}`);
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
