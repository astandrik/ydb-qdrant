import { describe, expect, it } from "vitest";

import {
    CODE_INDEXER_SESSION_COOKIE,
    CodeIndexerAuthError,
    GitHubOAuthClient,
    buildUiRedirectUrl,
    clearSessionCookie,
    createOAuthState,
    createSessionCookie,
    readSessionCookie,
    verifyOAuthState,
} from "../../src/code-indexer/auth.js";

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        status,
        statusText: status === 200 ? "OK" : "Bad Gateway",
    });
}

describe("code-indexer auth", () => {
    it("signs and verifies OAuth state with return path and installation id", () => {
        const state = createOAuthState({
            installationId: 777,
            nowMs: 1_000,
            returnPath: "/code-indexer/dashboard/?tab=repos",
            secret: "session-secret",
        });

        expect(state).toMatch(/^v1\./u);
        expect(
            verifyOAuthState({
                nowMs: 1_000,
                secret: "session-secret",
                state,
                ttlSeconds: 60,
            })
        ).toMatchObject({
            createdAtMs: 1_000,
            installationId: "777",
            returnPath: "/code-indexer/dashboard/?tab=repos",
        });
    });

    it("rejects tampered OAuth state", () => {
        const state = createOAuthState({
            nowMs: 1_000,
            returnPath: "/code-indexer/dashboard/",
            secret: "session-secret",
        });
        const [version, payload, signature] = state.split(".");
        if (!version || !payload || !signature) {
            throw new Error("test state did not include all signed parts");
        }
        const lastPayloadChar = payload.slice(-1);
        const replacement = lastPayloadChar === "A" ? "B" : "A";
        const tamperedPayload = `${payload.slice(0, -1)}${replacement}`;
        const tamperedState = `${version}.${tamperedPayload}.${signature}`;

        expect(() =>
            verifyOAuthState({
                nowMs: 1_000,
                secret: "session-secret",
                state: tamperedState,
                ttlSeconds: 60,
            })
        ).toThrow(CodeIndexerAuthError);
    });

    it("rejects expired OAuth state", () => {
        const state = createOAuthState({
            nowMs: 1_000,
            returnPath: "/code-indexer/dashboard/",
            secret: "session-secret",
        });

        expect(() =>
            verifyOAuthState({
                nowMs: 62_000,
                secret: "session-secret",
                state,
                ttlSeconds: 60,
            })
        ).toThrow("OAuth state expired");
    });

    it("creates secure host-only session cookies", () => {
        const cookie = createSessionCookie("session/value", 3_600);

        expect(cookie).toContain(
            `${CODE_INDEXER_SESSION_COOKIE}=session%2Fvalue`
        );
        expect(cookie).toContain("Max-Age=3600");
        expect(cookie).toContain("Path=/");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Secure");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).not.toContain("Domain=");
        expect(readSessionCookie(cookie)).toBe("session/value");

        expect(clearSessionCookie()).toContain(
            `${CODE_INDEXER_SESSION_COOKIE}=;`
        );
        expect(clearSessionCookie()).toContain("Max-Age=0");
    });

    it("ignores malformed encoded session cookies", () => {
        expect(
            readSessionCookie(`${CODE_INDEXER_SESSION_COOKIE}=%E0%A4%A`)
        ).toBeNull();
    });

    it("builds GitHub authorization URLs with client id, redirect uri, and state", () => {
        const client = new GitHubOAuthClient({
            clientId: "client-id",
            clientSecret: "client-secret",
            githubBaseUrl: "https://github.example.test",
            redirectUri:
                "https://code-indexer.example.test/github/oauth/callback",
        });

        const url = new URL(client.authorizationUrl({ state: "signed-state" }));

        expect(url.origin).toBe("https://github.example.test");
        expect(url.pathname).toBe("/login/oauth/authorize");
        expect(url.searchParams.get("client_id")).toBe("client-id");
        expect(url.searchParams.get("redirect_uri")).toBe(
            "https://code-indexer.example.test/github/oauth/callback"
        );
        expect(url.searchParams.get("state")).toBe("signed-state");
    });

    it("turns GitHub OAuth token errors into auth errors", async () => {
        const fetchImpl: typeof fetch = () =>
            Promise.resolve(
                jsonResponse({
                    error: "bad_verification_code",
                    error_description: "The code passed is incorrect or expired.",
                })
            );
        const client = new GitHubOAuthClient({
            clientId: "client-id",
            clientSecret: "client-secret",
            fetchImpl,
            githubBaseUrl: "https://github.example.test",
            redirectUri:
                "https://code-indexer.example.test/github/oauth/callback",
        });

        await expect(client.exchangeCode("bad-code")).rejects.toMatchObject({
            code: "github_oauth_token_exchange_failed",
            statusCode: 502,
        });
    });

    it("keeps UI redirects on the configured UI origin", () => {
        expect(
            buildUiRedirectUrl(
                "https://ydb-qdrant.tech",
                "/code-indexer/dashboard/?tab=tokens"
            )
        ).toBe("https://ydb-qdrant.tech/code-indexer/dashboard/?tab=tokens");
        expect(
            buildUiRedirectUrl("https://ydb-qdrant.tech", "https://evil.test")
        ).toBe("https://ydb-qdrant.tech/code-indexer/dashboard/");
    });
});
