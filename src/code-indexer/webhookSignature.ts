import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

export function createWebhookSignature(
    secret: string,
    body: Buffer
): string {
    return `${SIGNATURE_PREFIX}${createHmac("sha256", secret)
        .update(body)
        .digest("hex")}`;
}

export function verifyWebhookSignature(params: {
    body: Buffer;
    secret: string;
    signatureHeader: string | undefined;
}): boolean {
    const signatureHeader = params.signatureHeader?.trim();
    if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
        return false;
    }

    const expected = createWebhookSignature(params.secret, params.body);
    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(signatureHeader, "utf8");

    if (actualBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
}
