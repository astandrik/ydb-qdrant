import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
    },
}));

vi.mock("../../src/ydb/client.js", () => {
    class FakeTableDescription {
        withColumns(...columns: unknown[]) {
            void columns;
            return this;
        }

        withPrimaryKeys(...keys: string[]) {
            void keys;
            return this;
        }
    }

    class FakeColumn {
        readonly name: string;

        constructor(name: string, type: unknown) {
            void type;
            this.name = name;
        }
    }

    return {
        Column: FakeColumn,
        TableDescription: FakeTableDescription,
        Types: {
            JSON_DOCUMENT: { typeId: "JsonDocument" },
            TIMESTAMP: { typeId: "Timestamp" },
            UINT32: { typeId: "Uint32" },
            UTF8: { typeId: "Utf8" },
            optional: (inner: unknown) => ({ optionalType: { item: inner } }),
        },
        TypedValues: {
            VOID: { type: { voidType: 0 }, value: { nullFlagValue: 0 } },
            jsonDocument: vi.fn((value: string) => ({
                type: { typeId: "JsonDocument" },
                value: { textValue: value },
            })),
            optional: vi.fn((value: { type: unknown; value: unknown }) => ({
                type: { optionalType: { item: value.type } },
                value: value.value,
            })),
            timestamp: vi.fn((value: Date) => ({
                type: { typeId: "Timestamp" },
                value,
            })),
            uint32: vi.fn((value: number) => ({
                type: { typeId: "Uint32" },
                value,
            })),
            utf8: vi.fn((value: string) => ({
                type: { typeId: "Utf8" },
                value: { textValue: value },
            })),
        },
        createExecuteQuerySettings: vi.fn(() => ({ settings: true })),
        withSession: vi.fn(),
    };
});

type FakeSession = {
    createTable: Mock;
    describeTable: Mock;
    executeQuery: Mock;
};

type FakeTypedValue = {
    value?: unknown;
};

type FakeQueryParams = Record<string, FakeTypedValue>;

function makeSession(overrides: Partial<FakeSession> = {}): FakeSession {
    return {
        createTable: vi.fn(() => Promise.resolve()),
        describeTable: vi.fn(() => Promise.resolve({ columns: [] })),
        executeQuery: vi.fn(() => Promise.resolve({ resultSets: [] })),
        ...overrides,
    };
}

async function importSaasStore() {
    vi.resetModules();
    const client = await import("../../src/ydb/client.js");
    const saasStore = await import("../../src/code-indexer/saasStore.js");
    const withSessionMock = client.withSession as unknown as Mock;
    return { saasStore, withSessionMock };
}

function useSession(withSessionMock: Mock, session: FakeSession): void {
    withSessionMock.mockImplementation((fn: (s: FakeSession) => Promise<unknown>) =>
        fn(session)
    );
}

function readyStore(params?: {
    executeQuery?: Mock;
    withSessionMock: Mock;
}): FakeSession {
    const session = makeSession(
        params?.executeQuery ? { executeQuery: params.executeQuery } : {}
    );
    useSession(params?.withSessionMock ?? vi.fn(), session);
    return session;
}

function queryParamsAt(session: FakeSession, index: number): FakeQueryParams {
    return session.executeQuery.mock.calls[index]?.[1] as FakeQueryParams;
}

describe("code-indexer SaaS store", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates SaaS YDB tables when they are missing", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = makeSession({
            describeTable: vi.fn(() =>
                Promise.reject(new Error("SchemeError (code 400070): []"))
            ),
        });
        useSession(withSessionMock, session);

        await saasStore.ensureCodeIndexerSaasTables();

        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_USERS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_SESSIONS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_INSTALLATIONS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_REPOSITORIES_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_API_TOKENS_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_USAGE_DAILY_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_AUDIT_LOG_TABLE,
            expect.anything()
        );
    });

    it("encrypts GitHub tokens before storing and decrypts stored user rows", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.upsertGitHubUser({
            accessToken: "ghu_access",
            githubUserId: 123,
            login: "octo",
            refreshToken: "ghu_refresh",
        });

        const upsertParams = session.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { value?: { textValue?: string } }
        >;
        const accessCiphertext =
            upsertParams.$access_token_ciphertext?.value?.textValue;
        const refreshCiphertext =
            upsertParams.$refresh_token_ciphertext?.value?.textValue;
        expect(accessCiphertext).toBeDefined();
        expect(refreshCiphertext).toBeDefined();
        expect(accessCiphertext).not.toBe("ghu_access");
        expect(refreshCiphertext).not.toBe("ghu_refresh");
        expect(
            saasStore.decryptSecret(
                accessCiphertext ?? "",
                "encryption-secret"
            )
        ).toBe("ghu_access");
        expect(
            saasStore.decryptSecret(
                refreshCiphertext ?? "",
                "encryption-secret"
            )
        ).toBe("ghu_refresh");

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "123" },
                                { textValue: "octo" },
                                { textValue: accessCiphertext },
                                { textValue: refreshCiphertext },
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(store.getGitHubUser(123)).resolves.toEqual({
            accessToken: "ghu_access",
            githubUserId: "123",
            login: "octo",
            refreshToken: "ghu_refresh",
        });
    });

    it("stores API token hashes and resolves only non-revoked plaintext tokens", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.createApiToken({
            githubUserId: "123",
            name: "Codex",
            plaintextToken: "mcp-token",
            tokenId: "tok_1",
        });

        const createParams = session.executeQuery.mock.calls[0]?.[1] as Record<
            string,
            { value?: { textValue?: string } }
        >;
        expect(createParams.$token_hash?.value?.textValue).toBe(
            saasStore.hashApiToken("mcp-token", "pepper")
        );
        expect(createParams.$token_hash?.value?.textValue).not.toBe("mcp-token");

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "tok_1" },
                                { textValue: "123" },
                                { textValue: "Codex" },
                                { boolValue: false },
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(
            store.findApiTokenByPlaintextToken("mcp-token")
        ).resolves.toEqual({
            githubUserId: "123",
            name: "Codex",
            revoked: false,
            tokenId: "tok_1",
        });

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "tok_1" },
                                { textValue: "123" },
                                { textValue: "Codex" },
                                { boolValue: true },
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(
            store.findApiTokenByPlaintextToken("mcp-token")
        ).resolves.toBeNull();
    });

    it("persists and reads non-expired sessions", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();
        const expiresAt = new Date("2026-05-25T12:00:00Z");

        await store.createSession({
            expiresAt,
            githubUserId: 123,
            sessionId: "session-1",
        });

        expect(session.executeQuery.mock.calls[0]?.[0]).toEqual(
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_sessions")
        );
        expect(queryParamsAt(session, 0).$expires_at?.value).toBe(expiresAt);
        expect(queryParamsAt(session, 0).$github_user_id?.value).toEqual({
            textValue: "123",
        });
        expect(queryParamsAt(session, 0).$session_id?.value).toEqual({
            textValue: "session-1",
        });

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "session-1" },
                                { textValue: "123" },
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(store.getSession("session-1")).resolves.toEqual({
            githubUserId: "123",
            sessionId: "session-1",
        });
    });

    it("upserts repository status and parses repository rows", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.upsertRepository({
            chunkCount: 17,
            defaultBranch: "main",
            installationId: "700",
            lastIndexedSha: "f".repeat(40),
            owner: "octo",
            repo: "demo",
            repoId: "42",
            status: "ready",
        });

        expect(session.executeQuery.mock.calls[0]?.[0]).toEqual(
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_repositories")
        );
        expect(queryParamsAt(session, 0).$chunk_count?.value).toBe(17);
        expect(queryParamsAt(session, 0).$last_indexed_sha?.value).toEqual({
            textValue: "f".repeat(40),
        });
        expect(queryParamsAt(session, 0).$status?.value).toEqual({
            textValue: "ready",
        });

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "42" },
                                { textValue: "700" },
                                { textValue: "octo" },
                                { textValue: "demo" },
                                { textValue: "main" },
                                { textValue: "ready" },
                                { textValue: "f".repeat(40) },
                                {},
                                { uint32Value: 17 },
                                {},
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(store.listRepositoriesForInstallation("700")).resolves.toEqual([
            {
                chunkCount: 17,
                defaultBranch: "main",
                installationId: "700",
                lastIndexedSha: "f".repeat(40),
                owner: "octo",
                repo: "demo",
                repoId: "42",
                status: "ready",
            },
        ]);
    });

    it("increments daily usage counters", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            now: () => new Date("2026-05-25T08:00:00Z"),
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();
        session.executeQuery.mockResolvedValueOnce({
            resultSets: [{ rows: [{ items: [{ uint32Value: 5 }] }] }],
        });
        session.executeQuery.mockResolvedValueOnce({ resultSets: [] });

        await expect(
            store.incrementDailyUsage({
                amount: 3,
                githubUserId: "123",
                metric: "search",
            })
        ).resolves.toBe(8);

        expect(session.executeQuery.mock.calls[1]?.[0]).toEqual(
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_usage_daily")
        );
        expect(queryParamsAt(session, 1).$count?.value).toBe(8);
        expect(queryParamsAt(session, 1).$usage_date?.value).toEqual({
            textValue: "2026-05-25",
        });
        expect(queryParamsAt(session, 1).$usage_key?.value).toEqual({
            textValue: "2026-05-25/123/search",
        });
    });

    it("writes sanitized audit metadata as optional JSON", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.appendAuditLog({
            action: "token.create",
            auditId: "audit-1",
            githubUserId: "123",
            metadata: { tokenId: "tok_1" },
            target: "tok_1",
        });

        expect(session.executeQuery.mock.calls[0]?.[0]).toEqual(
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_audit_log")
        );
        expect(queryParamsAt(session, 0).$metadata?.value).toEqual({
            textValue: JSON.stringify({ tokenId: "tok_1" }),
        });
        expect(queryParamsAt(session, 0).$target?.value).toEqual({
            textValue: "tok_1",
        });
    });
});
