import { describe, expect, it } from "vitest";

import {
    createWebhookSignature,
    verifyWebhookSignature,
} from "../../src/code-indexer/webhookSignature.js";

describe("code-indexer webhook signature", () => {
    it("accepts a valid sha256 signature", () => {
        const body = Buffer.from(JSON.stringify({ ok: true }));
        const signature = createWebhookSignature("secret", body);

        expect(
            verifyWebhookSignature({
                body,
                secret: "secret",
                signatureHeader: signature,
            })
        ).toBe(true);
    });

    it("rejects missing, malformed, and mismatched signatures", () => {
        const body = Buffer.from("payload");

        expect(
            verifyWebhookSignature({
                body,
                secret: "secret",
                signatureHeader: undefined,
            })
        ).toBe(false);
        expect(
            verifyWebhookSignature({
                body,
                secret: "secret",
                signatureHeader: "md5=bad",
            })
        ).toBe(false);
        expect(
            verifyWebhookSignature({
                body,
                secret: "secret",
                signatureHeader: createWebhookSignature("other", body),
            })
        ).toBe(false);
    });
});
