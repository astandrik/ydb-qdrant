import { describe, expect, it, vi } from "vitest";

import {
    requireInstallationAccess,
    requireRepositoryAccess,
    type CodeIndexerAccessContext,
    type CodeIndexerAccessStore,
} from "../../src/code-indexer/accessControl.js";

const context: CodeIndexerAccessContext = {
    sessionId: "session-id",
    user: {
        githubUserId: "123",
        login: "octocat",
    },
};

function createStore(status: "active" | "deleted" | "suspended") {
    return {
        getGitHubUser: vi.fn(),
        getRepository: vi.fn(() =>
            Promise.resolve({
                defaultBranch: "main",
                installationId: "777",
                owner: "astandrik",
                repo: "local-ydb-toolkit",
                repoId: "456",
                status: "ready",
            })
        ),
        getSession: vi.fn(),
        listInstallationsForUser: vi.fn(() =>
            Promise.resolve([
                {
                    accountLogin: "astandrik",
                    accountType: "User",
                    createdByGithubUserId: "123",
                    installationId: "777",
                    status,
                },
            ])
        ),
    } satisfies CodeIndexerAccessStore;
}

describe("code-indexer access control", () => {
    it("allows active installations", async () => {
        const store = createStore("active");

        await expect(
            requireInstallationAccess({
                context,
                installationId: "777",
                store,
            })
        ).resolves.toMatchObject({ installationId: "777" });
    });

    it("rejects deleted or suspended installations", async () => {
        for (const status of ["deleted", "suspended"] as const) {
            const store = createStore(status);

            await expect(
                requireInstallationAccess({
                    context,
                    installationId: "777",
                    store,
                })
            ).rejects.toMatchObject({
                code: "github_installation_forbidden",
                statusCode: 403,
            });

            await expect(
                requireRepositoryAccess({
                    context,
                    repoId: "456",
                    store,
                })
            ).rejects.toMatchObject({
                code: "github_repository_forbidden",
                statusCode: 403,
            });
        }
    });
});
