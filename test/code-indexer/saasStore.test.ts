import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
    },
}));

vi.mock("../../src/ydb/client.js", () => {
    class FakeAlterTableDescription {
        addIndexes: unknown[] = [];
    }

    class FakeOperationParams {
        syncMode = false;

        withSyncMode() {
            this.syncMode = true;
            return this;
        }
    }

    class FakeAlterTableSettings {
        operationParams: unknown;

        withOperationParams(operationParams: unknown) {
            this.operationParams = operationParams;
            return this;
        }
    }

    class FakeTableDescription {
        indexes: unknown[] = [];

        withColumns(...columns: unknown[]) {
            void columns;
            return this;
        }

        withIndexes(...indexes: unknown[]) {
            this.indexes.push(...indexes);
            return this;
        }

        withPrimaryKeys(...keys: string[]) {
            void keys;
            return this;
        }
    }

    class FakeTableIndex {
        dataColumns: string[] = [];
        indexColumns: string[] = [];
        globalAsync = true;
        readonly name: string;

        constructor(name: string) {
            this.name = name;
        }

        withDataColumns(...dataColumns: string[]) {
            this.dataColumns.push(...dataColumns);
            return this;
        }

        withGlobalAsync(isAsync: boolean) {
            this.globalAsync = isAsync;
            return this;
        }

        withIndexColumns(...indexColumns: string[]) {
            this.indexColumns.push(...indexColumns);
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
        AlterTableDescription: FakeAlterTableDescription,
        AlterTableSettings: FakeAlterTableSettings,
        Column: FakeColumn,
        OperationParams: FakeOperationParams,
        TableDescription: FakeTableDescription,
        TableIndex: FakeTableIndex,
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
        createExecuteQuerySettings: vi.fn((options?: unknown) => ({
            options,
            settings: true,
        })),
        withSession: vi.fn(),
        withSessionOnce: vi.fn(),
    };
});

type FakeSession = {
    alterTable: Mock;
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
        alterTable: vi.fn(() => Promise.resolve()),
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
    const createExecuteQuerySettingsMock =
        client.createExecuteQuerySettings as unknown as Mock;
    const withSessionMock = client.withSession as unknown as Mock;
    const withSessionOnceMock = client.withSessionOnce as unknown as Mock;
    return {
        createExecuteQuerySettingsMock,
        saasStore,
        withSessionMock,
        withSessionOnceMock,
    };
}

function useSession(
    withSessionMock: Mock,
    session: FakeSession,
    withSessionOnceMock?: Mock
): void {
    withSessionMock.mockImplementation((fn: (s: FakeSession) => Promise<unknown>) =>
        fn(session)
    );
    withSessionOnceMock?.mockImplementation(
        (fn: (s: FakeSession) => Promise<unknown>) => fn(session)
    );
}

function readyStore(params?: {
    executeQuery?: Mock;
    withSessionMock: Mock;
    withSessionOnceMock?: Mock;
}): FakeSession {
    const session = makeSession(
        params?.executeQuery ? { executeQuery: params.executeQuery } : {}
    );
    useSession(
        params?.withSessionMock ?? vi.fn(),
        session,
        params?.withSessionOnceMock
    );
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
            saasStore.CODE_INDEXER_INSTALLATION_USERS_TABLE,
            expect.anything()
        );
        const installationUsersCreateCall = session.createTable.mock.calls.find(
            ([tableName]: [string]) =>
                tableName === saasStore.CODE_INDEXER_INSTALLATION_USERS_TABLE
        );
        expect(installationUsersCreateCall?.[1]).toMatchObject({
            indexes: [
                expect.objectContaining({
                    globalAsync: false,
                    indexColumns: ["installation_id", "github_user_id"],
                    name: "installation_users_by_installation_idx",
                }),
            ],
        });
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_REPOSITORIES_TABLE,
            expect.anything()
        );
        const repositoriesCreateCall = session.createTable.mock.calls.find(
            ([tableName]: [string]) =>
                tableName === saasStore.CODE_INDEXER_REPOSITORIES_TABLE
        );
        expect(repositoriesCreateCall?.[1]).toMatchObject({
            indexes: [
                expect.objectContaining({
                    dataColumns: [
                        "default_branch",
                        "status",
                        "last_indexed_sha",
                        "last_indexed_at",
                        "chunk_count",
                        "last_error",
                    ],
                    globalAsync: false,
                    indexColumns: ["installation_id", "owner", "repo", "repo_id"],
                    name: "repositories_by_installation_idx",
                }),
            ],
        });
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_API_TOKENS_TABLE,
            expect.anything()
        );
        const apiTokensCreateCall = session.createTable.mock.calls.find(
            ([tableName]: [string]) =>
                tableName === saasStore.CODE_INDEXER_API_TOKENS_TABLE
        );
        expect(apiTokensCreateCall?.[1]).toMatchObject({
            indexes: [
                expect.objectContaining({
                    dataColumns: [
                        "github_user_id",
                        "name",
                        "revoked_at",
                    ],
                    globalAsync: false,
                    indexColumns: ["token_hash"],
                    name: "token_hash_idx",
                }),
            ],
        });
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_USAGE_DAILY_TABLE,
            expect.anything()
        );
        expect(session.createTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_AUDIT_LOG_TABLE,
            expect.anything()
        );
    });

    it("adds the API token hash index to existing SaaS tables", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = makeSession({
            describeTable: vi.fn(() =>
                Promise.resolve({ columns: [], indexes: [] })
            ),
        });
        useSession(withSessionMock, session);

        await saasStore.ensureCodeIndexerSaasTables();

        expect(session.alterTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_API_TOKENS_TABLE,
            expect.objectContaining({
                addIndexes: [
                    expect.objectContaining({
                        indexColumns: ["token_hash"],
                        name: "token_hash_idx",
                    }),
                ],
            }),
            expect.anything()
        );
        const [, , alterSettings] = session.alterTable.mock.calls[0] as [
            string,
            unknown,
            { operationParams?: { syncMode?: boolean } },
        ];
        expect(alterSettings.operationParams?.syncMode).toBe(true);
    });

    it("adds installation lookup indexes to existing SaaS tables", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = makeSession({
            describeTable: vi.fn(() =>
                Promise.resolve({ columns: [], indexes: [] })
            ),
        });
        useSession(withSessionMock, session);

        await saasStore.ensureCodeIndexerSaasTables();

        expect(session.alterTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_INSTALLATION_USERS_TABLE,
            expect.objectContaining({
                addIndexes: [
                    expect.objectContaining({
                        indexColumns: ["installation_id", "github_user_id"],
                        name: "installation_users_by_installation_idx",
                    }),
                ],
            }),
            expect.anything()
        );
        expect(session.alterTable).toHaveBeenCalledWith(
            saasStore.CODE_INDEXER_REPOSITORIES_TABLE,
            expect.objectContaining({
                addIndexes: [
                    expect.objectContaining({
                        indexColumns: [
                            "installation_id",
                            "owner",
                            "repo",
                            "repo_id",
                        ],
                        name: "repositories_by_installation_idx",
                    }),
                ],
            }),
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
        expect(session.executeQuery.mock.calls[1]?.[0]).toContain(
            "VIEW token_hash_idx"
        );

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
                                { uint64Value: "1779707543244000" },
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
                lastIndexedAt: new Date(1_779_707_543_244),
                lastIndexedSha: "f".repeat(40),
                owner: "octo",
                repo: "demo",
                repoId: "42",
                status: "ready",
            },
        ]);
        const listQuery = session.executeQuery.mock.calls[1]?.[0] as string;
        expect(listQuery).toContain(
            "FROM qdrant_code_indexer_repositories VIEW repositories_by_installation_idx"
        );
    });

    it("uses installation indexes for installation-scoped reads and deletes", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.countInstallationUsers("700");
        await store.deleteInstallation("700");
        await store.deleteRepositoriesForInstallation("700");

        const queries = session.executeQuery.mock.calls.map(
            ([yql]: [string]) => yql
        );
        expect(queries[0]).toContain(
            "FROM qdrant_code_indexer_installation_users VIEW installation_users_by_installation_idx"
        );
        expect(queries[1]).toContain(
            "DELETE FROM qdrant_code_indexer_installation_users ON"
        );
        expect(queries[1]).toContain(
            "FROM qdrant_code_indexer_installation_users VIEW installation_users_by_installation_idx"
        );
        expect(queries[2]).toContain(
            "DELETE FROM qdrant_code_indexer_repositories ON"
        );
        expect(queries[2]).toContain(
            "FROM qdrant_code_indexer_repositories VIEW repositories_by_installation_idx"
        );
    });

    it("preserves indexed repository metrics when marking transient status", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.markRepositoryStatus({
            repoId: "42",
            status: "indexing",
        });

        const yql = session.executeQuery.mock.calls[0]?.[0] as string;
        expect(yql).toContain("status = $status");
        expect(yql).not.toContain("last_indexed_sha = $last_indexed_sha");
        expect(yql).not.toContain("last_indexed_at = $last_indexed_at");
        expect(yql).not.toContain("chunk_count = $chunk_count");
        expect(yql).toContain("last_error = CAST(NULL AS Utf8?)");
    });

    it("creates missing repository rows when marking status with metadata", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.markRepositoryStatus({
            defaultBranch: "main",
            installationId: 700,
            owner: "octo",
            repo: "demo",
            repoId: "42",
            status: "queued",
        });

        const upsertCall = session.executeQuery.mock.calls.find(
            ([yql]: [string]) =>
                yql.includes(
                    `UPSERT INTO ${saasStore.CODE_INDEXER_REPOSITORIES_TABLE}`
                )
        );
        expect(upsertCall?.[1]).toMatchObject({
            $default_branch: { value: { textValue: "main" } },
            $installation_id: { value: { textValue: "700" } },
            $owner: { value: { textValue: "octo" } },
            $repo: { value: { textValue: "demo" } },
            $repo_id: { value: { textValue: "42" } },
            $status: { value: { textValue: "queued" } },
        });
        expect(
            session.executeQuery.mock.calls.some(([yql]: [string]) =>
                yql.includes(`UPDATE ${saasStore.CODE_INDEXER_REPOSITORIES_TABLE}`)
            )
        ).toBe(true);
    });

    it("preserves linked GitHub user ownership when webhook updates omit it", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.upsertInstallation({
            accountLogin: "octo",
            accountType: "User",
            createdByGithubUserId: "123",
            installationId: "700",
            status: "active",
        });
        await store.upsertInstallation({
            accountLogin: "octo",
            accountType: "User",
            installationId: "700",
            status: "active",
        });

        expect(session.executeQuery.mock.calls[0]?.[0]).toContain(
            "created_by_github_user_id"
        );
        expect(queryParamsAt(session, 0).$created_by_github_user_id?.value).toEqual({
            textValue: "123",
        });
        expect(session.executeQuery.mock.calls[1]?.[0]).not.toContain(
            "created_by_github_user_id"
        );
        expect(queryParamsAt(session, 1).$created_by_github_user_id).toBeUndefined();
    });

    it("links multiple GitHub users to the same installation", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.upsertInstallation({
            accountLogin: "octo",
            accountType: "User",
            createdByGithubUserId: "123",
            installationId: "700",
            status: "active",
        });
        await store.upsertInstallation({
            accountLogin: "octo",
            accountType: "User",
            createdByGithubUserId: "456",
            installationId: "700",
            status: "active",
        });

        expect(session.executeQuery.mock.calls[0]?.[0]).toContain(
            "qdrant_code_indexer_installation_users"
        );
        expect(session.executeQuery.mock.calls[1]?.[0]).toContain(
            "qdrant_code_indexer_installation_users"
        );
        expect(queryParamsAt(session, 0).$created_by_github_user_id?.value).toEqual({
            textValue: "123",
        });
        expect(queryParamsAt(session, 1).$created_by_github_user_id?.value).toEqual({
            textValue: "456",
        });

        session.executeQuery.mockResolvedValueOnce({
            resultSets: [
                {
                    rows: [
                        {
                            items: [
                                { textValue: "700" },
                                { textValue: "octo" },
                                { textValue: "User" },
                                { textValue: "123" },
                                { textValue: "active" },
                            ],
                        },
                    ],
                },
            ],
        });

        await expect(store.listInstallationsForUser("456")).resolves.toEqual([
            {
                accountLogin: "octo",
                accountType: "User",
                createdByGithubUserId: "123",
                installationId: "700",
                status: "active",
            },
        ]);
        expect(session.executeQuery.mock.calls[2]?.[0]).toContain(
            "qdrant_code_indexer_installation_users"
        );
        expect(queryParamsAt(session, 2).$github_user_id?.value).toEqual({
            textValue: "456",
        });
    });

    it("increments daily usage counters without session-level retries", async () => {
        const {
            createExecuteQuerySettingsMock,
            saasStore,
            withSessionMock,
            withSessionOnceMock,
        } = await importSaasStore();
        const session = readyStore({ withSessionMock, withSessionOnceMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            now: () => new Date("2026-05-25T08:00:00Z"),
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        createExecuteQuerySettingsMock.mockClear();
        session.executeQuery.mockClear();
        withSessionMock.mockClear();
        withSessionOnceMock.mockClear();
        session.executeQuery.mockResolvedValueOnce({
            resultSets: [{ rows: [{ items: [{ uint32Value: 8 }] }] }],
        });

        await expect(
            store.incrementDailyUsage({
                amount: 3,
                githubUserId: "123",
                metric: "search",
            })
        ).resolves.toBe(8);

        expect(session.executeQuery).toHaveBeenCalledTimes(1);
        expect(withSessionMock).not.toHaveBeenCalled();
        expect(withSessionOnceMock).toHaveBeenCalledTimes(1);
        expect(createExecuteQuerySettingsMock).toHaveBeenCalledWith({
            idempotent: false,
        });
        expect(session.executeQuery.mock.calls[0]?.[0]).toEqual(
            expect.stringContaining("UPSERT INTO qdrant_code_indexer_usage_daily")
        );
        expect(session.executeQuery.mock.calls[0]?.[0]).toContain("COALESCE");
        expect(queryParamsAt(session, 0).$amount?.value).toBe(3);
        expect(queryParamsAt(session, 0).$usage_date?.value).toEqual({
            textValue: "2026-05-25",
        });
        expect(queryParamsAt(session, 0).$usage_key?.value).toEqual({
            textValue: "2026-05-25/123/search",
        });
    });

    it("deletes usage counters when deleting a GitHub user", async () => {
        const { saasStore, withSessionMock } = await importSaasStore();
        const session = readyStore({ withSessionMock });
        const store = new saasStore.YdbCodeIndexerSaasStore({
            encryptionSecret: "encryption-secret",
            tokenPepper: "pepper",
        });
        await saasStore.ensureCodeIndexerSaasTables();
        session.executeQuery.mockClear();

        await store.deleteGitHubUser("123");

        expect(session.executeQuery.mock.calls[0]?.[0]).toContain(
            "DELETE FROM qdrant_code_indexer_usage_daily"
        );
        expect(queryParamsAt(session, 0).$github_user_id?.value).toEqual({
            textValue: "123",
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
