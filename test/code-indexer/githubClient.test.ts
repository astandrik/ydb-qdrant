import { generateKeyPairSync } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it, vi } from "vitest";

import { GitHubAppClientFactory } from "../../src/code-indexer/githubClient.js";

const execFileAsync = promisify(execFile);

function generatePrivateKeyPem(): string {
    const { privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
    });
    return privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}

function requestUrl(input: URL | RequestInfo): string {
    if (typeof input === "string") {
        return input;
    }
    if (input instanceof URL) {
        return input.toString();
    }
    return input.url;
}

describe("GitHubAppClientFactory", () => {
    it("retries a content request after an exhausted GitHub rate limit response", async () => {
        const privateKey = generatePrivateKeyPem();
        let contentRequestCount = 0;
        const fetchImpl = vi.fn((input: URL | RequestInfo) => {
            const url = requestUrl(input);
            if (url.endsWith("/app/installations/42/access_tokens")) {
                return Promise.resolve(
                    new Response(JSON.stringify({ token: "installation-token" }), {
                        status: 201,
                    })
                );
            }

            if (url.includes("/contents/README.md")) {
                contentRequestCount += 1;
                if (contentRequestCount === 1) {
                    return Promise.resolve(
                        new Response(
                            JSON.stringify({
                                message:
                                    "API rate limit exceeded for installation ID 42",
                            }),
                            {
                                headers: {
                                    "x-ratelimit-remaining": "0",
                                    "x-ratelimit-reset": "0",
                                },
                                status: 403,
                                statusText: "Forbidden",
                            }
                        )
                    );
                }
                return Promise.resolve(
                    new Response("file-content", { status: 200 })
                );
            }

            throw new Error(`unexpected fetch: ${url}`);
        }) as unknown as typeof fetch;

        const factory = new GitHubAppClientFactory({
            appId: "123",
            fetchImpl,
            privateKey,
        });
        const client = await factory.forInstallation(42);

        await expect(
            client.getFileContent({
                owner: "owner",
                path: "README.md",
                ref: "main",
                repo: "repo",
            })
        ).resolves.toBe("file-content");
        expect(fetchImpl).toHaveBeenCalledTimes(3);
    });

    it("downloads a repository tarball and exposes a local snapshot", async () => {
        const tempDir = await mkdtemp(join(tmpdir(), "github-client-test-"));
        try {
            const archiveRoot = join(tempDir, "octo-demo-commit");
            await mkdir(join(archiveRoot, "src"), { recursive: true });
            await writeFile(join(archiveRoot, "src/server.ts"), "line1\nline2");
            await writeFile(join(archiveRoot, "README.md"), "# Demo\n");
            const archivePath = join(tempDir, "archive.tar.gz");
            await execFileAsync("tar", [
                "-czf",
                archivePath,
                "-C",
                tempDir,
                "octo-demo-commit",
            ]);
            const archiveBytes = await readFile(archivePath);
            const privateKey = generatePrivateKeyPem();
            const fetchImpl = vi.fn((input: URL | RequestInfo) => {
                const url = requestUrl(input);
                if (url.endsWith("/app/installations/42/access_tokens")) {
                    return Promise.resolve(
                        new Response(
                            JSON.stringify({ token: "installation-token" }),
                            { status: 201 }
                        )
                    );
                }
                if (url.endsWith("/repos/octo/demo/tarball/commit-1")) {
                    return Promise.resolve(
                        new Response(archiveBytes, { status: 200 })
                    );
                }
                throw new Error(`unexpected fetch: ${url}`);
            }) as unknown as typeof fetch;
            const factory = new GitHubAppClientFactory({
                appId: "123",
                fetchImpl,
                privateKey,
            });
            const client = await factory.forInstallation(42);

            const snapshot = await client.getRepositorySnapshot?.({
                owner: "octo",
                ref: "commit-1",
                repo: "demo",
            });

            expect(snapshot?.files).toEqual([
                { path: "README.md", size: 7 },
                { path: "src/server.ts", size: 11 },
            ]);
            const content = await snapshot?.getFileContent("src/server.ts");
            expect(content?.blobSha).toMatch(/^[0-9a-f]{40}$/);
            expect(content?.content).toBe("line1\nline2");
            await snapshot?.close();
        } finally {
            await rm(tempDir, { force: true, recursive: true });
        }
    });
});
