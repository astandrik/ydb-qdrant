import crypto from "crypto";
import stableStringify from "fast-json-stable-stringify";

function canonicalizePayload(payload: unknown): string {
    const canonical = stableStringify(payload);
    if (typeof canonical !== "string") {
        // JSON.stringify returns undefined for top-level undefined/functions/symbols.
        throw new Error("computePayloadSign: payload is not JSON-serializable");
    }
    return canonical;
}

export function computePayloadSign(params: {
    apiKey: string;
    payload: unknown;
}): string {
    const apiKey = params.apiKey.trim();
    if (apiKey.length === 0) {
        throw new Error("computePayloadSign: apiKey is empty");
    }
    const canonical = canonicalizePayload(params.payload);
    return crypto.createHmac("sha256", apiKey).update(canonical).digest("hex");
}

