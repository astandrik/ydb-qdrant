import { describe, expect, it } from "vitest";

import {
    hashApiToken,
    YdbCodeIndexerSaasStore,
} from "../../src/code-indexer/saasStore.js";

const hasSdkCredentials = [
    "YDB_ACCESS_TOKEN_CREDENTIALS",
    "YDB_ANONYMOUS_CREDENTIALS",
    "YDB_METADATA_CREDENTIALS",
    "YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS",
].some((name) => process.env[name]);
if (!hasSdkCredentials && !process.env.YDB_STATIC_CREDENTIALS_USER) {
    process.env.YDB_ANONYMOUS_CREDENTIALS = "1";
}

const ydbQdrantEndpoint =
    process.env.YDB_QDRANT_ENDPOINT ?? "grpc://127.0.0.1:2136";
if (
    !process.env.YDB_ENDPOINT &&
    /^grpc:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(ydbQdrantEndpoint)
) {
    // The local-ydb container can advertise its Docker hostname through discovery.
    // Keep app config on YDB_QDRANT_* while overriding the SDK endpoint locally.
    process.env.YDB_ENDPOINT = ydbQdrantEndpoint;
}

describe("code-indexer SaaS YDB store", () => {
    it("persists SaaS state rows in local YDB", async () => {
        const runId = `${Date.now()}`;
        const githubUserId = `user-${runId}`;
        const installationId = `inst-${runId}`;
        const repoId = `repo-${runId}`;
        const tokenId = `tok-${runId}`;
        const plaintextToken = `mcp-${runId}`;
        const encryptionSecret = `integration-encryption-${runId}`;
        const tokenPepper = `integration-pepper-${runId}`;
        const store = new YdbCodeIndexerSaasStore({
            encryptionSecret,
            now: () => new Date("2026-05-25T08:00:00Z"),
            tokenPepper,
        });

        await store.upsertGitHubUser({
            accessToken: `access-${runId}`,
            githubUserId,
            login: `octo-${runId}`,
            refreshToken: `refresh-${runId}`,
        });
        await expect(store.getGitHubUser(githubUserId)).resolves.toEqual({
            accessToken: `access-${runId}`,
            githubUserId,
            login: `octo-${runId}`,
            refreshToken: `refresh-${runId}`,
        });

        await store.createSession({
            expiresAt: new Date("2030-01-01T00:00:00Z"),
            githubUserId,
            sessionId: `session-${runId}`,
        });
        await expect(store.getSession(`session-${runId}`)).resolves.toEqual({
            githubUserId,
            sessionId: `session-${runId}`,
        });

        await store.upsertInstallation({
            accountLogin: `octo-${runId}`,
            accountType: "User",
            createdByGithubUserId: githubUserId,
            installationId,
            status: "active",
        });
        await store.upsertRepository({
            defaultBranch: "main",
            installationId,
            owner: `octo-${runId}`,
            repo: "demo",
            repoId,
            status: "queued",
        });
        await store.markRepositoryStatus({
            chunkCount: 3,
            lastIndexedSha: "f".repeat(40),
            repoId,
            status: "ready",
        });
        await expect(
            store.listRepositoriesForInstallation(installationId)
        ).resolves.toEqual([
            {
                chunkCount: 3,
                defaultBranch: "main",
                installationId,
                lastIndexedSha: "f".repeat(40),
                owner: `octo-${runId}`,
                repo: "demo",
                repoId,
                status: "ready",
            },
        ]);

        await store.createApiToken({
            githubUserId,
            name: "integration",
            plaintextToken,
            tokenId,
        });
        await expect(store.listApiTokens(githubUserId)).resolves.toEqual([
            {
                githubUserId,
                name: "integration",
                revoked: false,
                tokenId,
            },
        ]);
        await expect(
            store.findApiTokenByPlaintextToken(plaintextToken)
        ).resolves.toEqual({
            githubUserId,
            name: "integration",
            revoked: false,
            tokenId,
        });
        await store.revokeApiToken({ githubUserId, tokenId });
        await expect(
            store.findApiTokenByPlaintextToken(plaintextToken)
        ).resolves.toBeNull();

        await expect(
            store.incrementDailyUsage({
                amount: 2,
                githubUserId,
                metric: "search",
            })
        ).resolves.toBe(2);
        await store.appendAuditLog({
            action: "integration.smoke",
            auditId: `audit-${runId}`,
            githubUserId,
            metadata: {
                tokenHash: hashApiToken(plaintextToken, tokenPepper),
            },
            target: repoId,
        });
    }, 60_000);
});
