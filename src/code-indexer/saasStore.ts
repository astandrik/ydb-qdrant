import {
    createCipheriv,
    createDecipheriv,
    createHash,
    createHmac,
    randomBytes,
} from "node:crypto";
import type { Ydb } from "ydb-sdk";

import { logger } from "../logging/logger.js";
import {
    Column,
    createExecuteQuerySettings,
    TableDescription,
    TypedValues,
    Types,
    withSession,
} from "../ydb/client.js";

export const CODE_INDEXER_USERS_TABLE = "qdrant_code_indexer_users";
export const CODE_INDEXER_SESSIONS_TABLE = "qdrant_code_indexer_sessions";
export const CODE_INDEXER_INSTALLATIONS_TABLE =
    "qdrant_code_indexer_installations";
export const CODE_INDEXER_REPOSITORIES_TABLE =
    "qdrant_code_indexer_repositories";
export const CODE_INDEXER_API_TOKENS_TABLE = "qdrant_code_indexer_api_tokens";
export const CODE_INDEXER_USAGE_DAILY_TABLE =
    "qdrant_code_indexer_usage_daily";
export const CODE_INDEXER_AUDIT_LOG_TABLE = "qdrant_code_indexer_audit_log";

export type CodeIndexerRepositoryStatus =
    | "queued"
    | "indexing"
    | "ready"
    | "failed"
    | "deleted";

export type StoredGitHubUser = {
    accessToken: string;
    githubUserId: string;
    login: string;
    refreshToken?: string;
};

export type CodeIndexerSession = {
    githubUserId: string;
    sessionId: string;
};

export type CodeIndexerRepositoryRecord = {
    chunkCount?: number;
    defaultBranch: string;
    installationId: string;
    lastError?: string;
    lastIndexedSha?: string;
    owner: string;
    repo: string;
    repoId: string;
    status: CodeIndexerRepositoryStatus;
};

export type CodeIndexerApiTokenRecord = {
    githubUserId: string;
    name: string;
    revoked: boolean;
    tokenId: string;
};

export type YdbCodeIndexerSaasStoreOptions = {
    encryptionSecret: string;
    now?: () => Date;
    tokenPepper: string;
};

type QueryRow = {
    items?: Array<
        | {
              boolValue?: boolean;
              textValue?: string;
              uint32Value?: number;
              uint64Value?: unknown;
          }
        | undefined
    >;
};

type ExecuteQueryResultLike = {
    resultSets?: Array<{
        rows?: QueryRow[];
    }>;
};

type QueryParams = { [key: string]: Ydb.ITypedValue };

let saasTablesReady = false;
let saasTablesReadyInFlight: Promise<void> | null = null;

function normalizeId(value: number | string): string {
    return String(value);
}

function isTableNotFoundError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    const ctorName =
        err instanceof Error
            ? (err.constructor as { name?: unknown } | undefined)?.name
            : undefined;
    const statusCodeMatch = /code\s+(\d{6})/i.exec(msg);
    const statusCode =
        statusCodeMatch && statusCodeMatch[1]
            ? Number(statusCodeMatch[1])
            : undefined;

    if (ctorName === "NotFound" || statusCode === 400140) {
        return true;
    }
    if (
        (ctorName === "SchemeError" || statusCode === 400070) &&
        /:\s*\[\s*\]\s*$/i.test(msg)
    ) {
        return true;
    }
    return (
        /table.*not found/i.test(msg) ||
        /path.*not found/i.test(msg) ||
        /does not exist/i.test(msg)
    );
}

function isAlreadyExistsError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /already exists/i.test(msg) || /path.*exists/i.test(msg);
}

function toSafeNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) ? parsed : null;
    }
    if (value && typeof value === "object") {
        const longLike = value as { high?: unknown; low?: unknown };
        if (typeof longLike.low === "number" && typeof longLike.high === "number") {
            const parsed =
                BigInt(longLike.low >>> 0) +
                (BigInt(longLike.high >>> 0) << 32n);
            if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
                return null;
            }
            return Number(parsed);
        }
    }
    return null;
}

function readFirstRow(result: ExecuteQueryResultLike): QueryRow | null {
    return result.resultSets?.[0]?.rows?.[0] ?? null;
}

function readText(row: QueryRow, index: number): string | undefined {
    return row.items?.[index]?.textValue;
}

function readUint(row: QueryRow, index: number): number | undefined {
    return (
        toSafeNumber(row.items?.[index]?.uint32Value) ??
        toSafeNumber(row.items?.[index]?.uint64Value) ??
        undefined
    );
}

function readBool(row: QueryRow, index: number): boolean | undefined {
    return row.items?.[index]?.boolValue;
}

function optionalNull(itemType: Ydb.IType): Ydb.ITypedValue {
    return {
        type: Types.optional(itemType),
        value: TypedValues.VOID.value,
    } as Ydb.ITypedValue;
}

function optionalValue(
    value: Ydb.ITypedValue | undefined,
    itemType: Ydb.IType
): Ydb.ITypedValue {
    return value === undefined ? optionalNull(itemType) : TypedValues.optional(value);
}

function optionalUtf8(value: string | undefined): Ydb.ITypedValue {
    return optionalValue(value === undefined ? undefined : TypedValues.utf8(value), Types.UTF8);
}

function optionalUint32(value: number | undefined): Ydb.ITypedValue {
    return optionalValue(
        value === undefined ? undefined : TypedValues.uint32(value),
        Types.UINT32
    );
}

function optionalJsonDocument(value: string | undefined): Ydb.ITypedValue {
    return optionalValue(
        value === undefined ? undefined : TypedValues.jsonDocument(value),
        Types.JSON_DOCUMENT
    );
}

function keyFromSecret(secret: string): Buffer {
    return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string, secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
        "v1",
        iv.toString("base64url"),
        tag.toString("base64url"),
        ciphertext.toString("base64url"),
    ].join(":");
}

export function decryptSecret(ciphertext: string, secret: string): string {
    const [version, ivText, tagText, encryptedText] = ciphertext.split(":");
    if (
        version !== "v1" ||
        !ivText ||
        !tagText ||
        encryptedText === undefined
    ) {
        throw new Error("encrypted secret payload is invalid");
    }
    const decipher = createDecipheriv(
        "aes-256-gcm",
        keyFromSecret(secret),
        Buffer.from(ivText, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, "base64url")),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}

export function hashApiToken(plaintextToken: string, pepper: string): string {
    return createHmac("sha256", pepper).update(plaintextToken).digest("hex");
}

async function ensureTable(
    tableName: string,
    desc: InstanceType<typeof TableDescription>
): Promise<void> {
    await withSession(async (session) => {
        try {
            await session.describeTable(tableName);
            return;
        } catch (err: unknown) {
            if (!isTableNotFoundError(err)) {
                throw err;
            }
        }

        try {
            await session.createTable(tableName, desc);
            logger.info(`created code-indexer SaaS table ${tableName}`);
        } catch (err: unknown) {
            if (!isAlreadyExistsError(err)) {
                throw err;
            }
        }
    });
}

async function ensureUsersTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_USERS_TABLE,
        new TableDescription()
            .withColumns(
                new Column("github_user_id", Types.UTF8),
                new Column("login", Types.UTF8),
                new Column("access_token_ciphertext", Types.UTF8),
                new Column("refresh_token_ciphertext", Types.optional(Types.UTF8)),
                new Column("updated_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("github_user_id")
    );
}

async function ensureSessionsTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_SESSIONS_TABLE,
        new TableDescription()
            .withColumns(
                new Column("session_id", Types.UTF8),
                new Column("github_user_id", Types.UTF8),
                new Column("created_at", Types.TIMESTAMP),
                new Column("expires_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("session_id")
    );
}

async function ensureInstallationsTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_INSTALLATIONS_TABLE,
        new TableDescription()
            .withColumns(
                new Column("installation_id", Types.UTF8),
                new Column("account_login", Types.UTF8),
                new Column("account_type", Types.UTF8),
                new Column("created_by_github_user_id", Types.optional(Types.UTF8)),
                new Column("status", Types.UTF8),
                new Column("updated_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("installation_id")
    );
}

async function ensureRepositoriesTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_REPOSITORIES_TABLE,
        new TableDescription()
            .withColumns(
                new Column("repo_id", Types.UTF8),
                new Column("installation_id", Types.UTF8),
                new Column("owner", Types.UTF8),
                new Column("repo", Types.UTF8),
                new Column("default_branch", Types.UTF8),
                new Column("status", Types.UTF8),
                new Column("last_indexed_sha", Types.optional(Types.UTF8)),
                new Column("chunk_count", Types.optional(Types.UINT32)),
                new Column("last_error", Types.optional(Types.UTF8)),
                new Column("updated_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("repo_id")
    );
}

async function ensureApiTokensTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_API_TOKENS_TABLE,
        new TableDescription()
            .withColumns(
                new Column("token_id", Types.UTF8),
                new Column("github_user_id", Types.UTF8),
                new Column("token_hash", Types.UTF8),
                new Column("name", Types.UTF8),
                new Column("created_at", Types.TIMESTAMP),
                new Column("revoked_at", Types.optional(Types.TIMESTAMP))
            )
            .withPrimaryKeys("token_id")
    );
}

async function ensureUsageDailyTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_USAGE_DAILY_TABLE,
        new TableDescription()
            .withColumns(
                new Column("usage_key", Types.UTF8),
                new Column("usage_date", Types.UTF8),
                new Column("github_user_id", Types.UTF8),
                new Column("metric", Types.UTF8),
                new Column("count", Types.UINT32),
                new Column("updated_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("usage_key")
    );
}

async function ensureAuditLogTable(): Promise<void> {
    await ensureTable(
        CODE_INDEXER_AUDIT_LOG_TABLE,
        new TableDescription()
            .withColumns(
                new Column("audit_id", Types.UTF8),
                new Column("github_user_id", Types.optional(Types.UTF8)),
                new Column("action", Types.UTF8),
                new Column("target", Types.optional(Types.UTF8)),
                new Column("metadata", Types.optional(Types.JSON_DOCUMENT)),
                new Column("created_at", Types.TIMESTAMP)
            )
            .withPrimaryKeys("audit_id")
    );
}

export async function ensureCodeIndexerSaasTables(): Promise<void> {
    if (saasTablesReady) {
        return;
    }
    if (saasTablesReadyInFlight) {
        await saasTablesReadyInFlight;
        return;
    }

    saasTablesReadyInFlight = Promise.all([
        ensureUsersTable(),
        ensureSessionsTable(),
        ensureInstallationsTable(),
        ensureRepositoriesTable(),
        ensureApiTokensTable(),
        ensureUsageDailyTable(),
        ensureAuditLogTable(),
    ]).then(() => undefined);
    try {
        await saasTablesReadyInFlight;
        saasTablesReady = true;
    } finally {
        saasTablesReadyInFlight = null;
    }
}

export class YdbCodeIndexerSaasStore {
    private readonly encryptionSecret: string;
    private readonly now: () => Date;
    private readonly tokenPepper: string;

    constructor(options: YdbCodeIndexerSaasStoreOptions) {
        this.encryptionSecret = options.encryptionSecret;
        this.now = options.now ?? (() => new Date());
        this.tokenPepper = options.tokenPepper;
    }

    async upsertGitHubUser(params: {
        accessToken: string;
        githubUserId: number | string;
        login: string;
        refreshToken?: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $github_user_id AS Utf8;
            DECLARE $login AS Utf8;
            DECLARE $access_token_ciphertext AS Utf8;
            DECLARE $refresh_token_ciphertext AS Utf8?;

            UPSERT INTO ${CODE_INDEXER_USERS_TABLE}
                (
                    github_user_id,
                    login,
                    access_token_ciphertext,
                    refresh_token_ciphertext,
                    updated_at
                )
            VALUES (
                $github_user_id,
                $login,
                $access_token_ciphertext,
                $refresh_token_ciphertext,
                CurrentUtcTimestamp()
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $access_token_ciphertext: TypedValues.utf8(
                        encryptSecret(params.accessToken, this.encryptionSecret)
                    ),
                    $github_user_id: TypedValues.utf8(
                        normalizeId(params.githubUserId)
                    ),
                    $login: TypedValues.utf8(params.login),
                    $refresh_token_ciphertext: optionalUtf8(
                        params.refreshToken === undefined
                            ? undefined
                            : encryptSecret(
                                  params.refreshToken,
                                  this.encryptionSecret
                              )
                    ),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async getGitHubUser(
        githubUserId: number | string
    ): Promise<StoredGitHubUser | null> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $github_user_id AS Utf8;

            SELECT
                github_user_id,
                login,
                access_token_ciphertext,
                refresh_token_ciphertext
            FROM ${CODE_INDEXER_USERS_TABLE}
            WHERE github_user_id = $github_user_id
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $github_user_id: TypedValues.utf8(normalizeId(githubUserId)) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        const row = readFirstRow(result);
        if (!row) {
            return null;
        }
        const id = readText(row, 0);
        const login = readText(row, 1);
        const accessTokenCiphertext = readText(row, 2);
        if (!id || !login || !accessTokenCiphertext) {
            throw new Error("stored code-indexer user row is invalid");
        }
        const refreshTokenCiphertext = readText(row, 3);
        return {
            accessToken: decryptSecret(accessTokenCiphertext, this.encryptionSecret),
            githubUserId: id,
            login,
            ...(refreshTokenCiphertext
                ? {
                      refreshToken: decryptSecret(
                          refreshTokenCiphertext,
                          this.encryptionSecret
                      ),
                  }
                : {}),
        };
    }

    async createSession(params: {
        expiresAt: Date;
        githubUserId: number | string;
        sessionId: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $session_id AS Utf8;
            DECLARE $github_user_id AS Utf8;
            DECLARE $expires_at AS Timestamp;

            UPSERT INTO ${CODE_INDEXER_SESSIONS_TABLE}
                (session_id, github_user_id, created_at, expires_at)
            VALUES (
                $session_id,
                $github_user_id,
                CurrentUtcTimestamp(),
                $expires_at
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $expires_at: TypedValues.timestamp(params.expiresAt),
                    $github_user_id: TypedValues.utf8(
                        normalizeId(params.githubUserId)
                    ),
                    $session_id: TypedValues.utf8(params.sessionId),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async getSession(sessionId: string): Promise<CodeIndexerSession | null> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $session_id AS Utf8;

            SELECT session_id, github_user_id
            FROM ${CODE_INDEXER_SESSIONS_TABLE}
            WHERE session_id = $session_id
                AND expires_at > CurrentUtcTimestamp()
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $session_id: TypedValues.utf8(sessionId) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        const row = readFirstRow(result);
        if (!row) {
            return null;
        }
        const returnedSessionId = readText(row, 0);
        const githubUserId = readText(row, 1);
        if (!returnedSessionId || !githubUserId) {
            throw new Error("stored code-indexer session row is invalid");
        }
        return { githubUserId, sessionId: returnedSessionId };
    }

    async deleteSession(sessionId: string): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $session_id AS Utf8;

            DELETE FROM ${CODE_INDEXER_SESSIONS_TABLE}
            WHERE session_id = $session_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                { $session_id: TypedValues.utf8(sessionId) },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async deleteSessionsForUser(githubUserId: number | string): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $github_user_id AS Utf8;

            DELETE FROM ${CODE_INDEXER_SESSIONS_TABLE}
            WHERE github_user_id = $github_user_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                { $github_user_id: TypedValues.utf8(normalizeId(githubUserId)) },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async upsertInstallation(params: {
        accountLogin: string;
        accountType: string;
        createdByGithubUserId?: number | string;
        installationId: number | string;
        status: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $installation_id AS Utf8;
            DECLARE $account_login AS Utf8;
            DECLARE $account_type AS Utf8;
            DECLARE $created_by_github_user_id AS Utf8?;
            DECLARE $status AS Utf8;

            UPSERT INTO ${CODE_INDEXER_INSTALLATIONS_TABLE}
                (
                    installation_id,
                    account_login,
                    account_type,
                    created_by_github_user_id,
                    status,
                    updated_at
                )
            VALUES (
                $installation_id,
                $account_login,
                $account_type,
                $created_by_github_user_id,
                $status,
                CurrentUtcTimestamp()
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $account_login: TypedValues.utf8(params.accountLogin),
                    $account_type: TypedValues.utf8(params.accountType),
                    $created_by_github_user_id: optionalUtf8(
                        params.createdByGithubUserId === undefined
                            ? undefined
                            : normalizeId(params.createdByGithubUserId)
                    ),
                    $installation_id: TypedValues.utf8(
                        normalizeId(params.installationId)
                    ),
                    $status: TypedValues.utf8(params.status),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async upsertRepository(params: CodeIndexerRepositoryRecord): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $repo_id AS Utf8;
            DECLARE $installation_id AS Utf8;
            DECLARE $owner AS Utf8;
            DECLARE $repo AS Utf8;
            DECLARE $default_branch AS Utf8;
            DECLARE $status AS Utf8;
            DECLARE $last_indexed_sha AS Utf8?;
            DECLARE $chunk_count AS Uint32?;
            DECLARE $last_error AS Utf8?;

            UPSERT INTO ${CODE_INDEXER_REPOSITORIES_TABLE}
                (
                    repo_id,
                    installation_id,
                    owner,
                    repo,
                    default_branch,
                    status,
                    last_indexed_sha,
                    chunk_count,
                    last_error,
                    updated_at
                )
            VALUES (
                $repo_id,
                $installation_id,
                $owner,
                $repo,
                $default_branch,
                $status,
                $last_indexed_sha,
                $chunk_count,
                $last_error,
                CurrentUtcTimestamp()
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                this.repositoryParams(params),
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async markRepositoryStatus(params: {
        chunkCount?: number;
        lastError?: string;
        lastIndexedSha?: string;
        repoId: number | string;
        status: CodeIndexerRepositoryStatus;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $repo_id AS Utf8;
            DECLARE $status AS Utf8;
            DECLARE $last_indexed_sha AS Utf8?;
            DECLARE $chunk_count AS Uint32?;
            DECLARE $last_error AS Utf8?;

            UPDATE ${CODE_INDEXER_REPOSITORIES_TABLE}
            SET status = $status,
                last_indexed_sha = $last_indexed_sha,
                chunk_count = $chunk_count,
                last_error = $last_error,
                updated_at = CurrentUtcTimestamp()
            WHERE repo_id = $repo_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $chunk_count:
                        optionalUint32(params.chunkCount),
                    $last_error:
                        optionalUtf8(params.lastError?.slice(0, 4000)),
                    $last_indexed_sha:
                        optionalUtf8(params.lastIndexedSha),
                    $repo_id: TypedValues.utf8(normalizeId(params.repoId)),
                    $status: TypedValues.utf8(params.status),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async listRepositoriesForInstallation(
        installationId: number | string
    ): Promise<CodeIndexerRepositoryRecord[]> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $installation_id AS Utf8;

            SELECT
                repo_id,
                installation_id,
                owner,
                repo,
                default_branch,
                status,
                last_indexed_sha,
                chunk_count,
                last_error
            FROM ${CODE_INDEXER_REPOSITORIES_TABLE}
            WHERE installation_id = $installation_id
            ORDER BY owner, repo;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                {
                    $installation_id: TypedValues.utf8(
                        normalizeId(installationId)
                    ),
                },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        return (result.resultSets?.[0]?.rows ?? []).map(parseRepositoryRow);
    }

    async createApiToken(params: {
        githubUserId: number | string;
        name: string;
        plaintextToken: string;
        tokenId: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $token_id AS Utf8;
            DECLARE $github_user_id AS Utf8;
            DECLARE $token_hash AS Utf8;
            DECLARE $name AS Utf8;

            UPSERT INTO ${CODE_INDEXER_API_TOKENS_TABLE}
                (
                    token_id,
                    github_user_id,
                    token_hash,
                    name,
                    created_at,
                    revoked_at
                )
            VALUES (
                $token_id,
                $github_user_id,
                $token_hash,
                $name,
                CurrentUtcTimestamp(),
                CAST(NULL AS Timestamp?)
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $github_user_id: TypedValues.utf8(
                        normalizeId(params.githubUserId)
                    ),
                    $name: TypedValues.utf8(params.name),
                    $token_hash: TypedValues.utf8(
                        hashApiToken(params.plaintextToken, this.tokenPepper)
                    ),
                    $token_id: TypedValues.utf8(params.tokenId),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async listApiTokens(
        githubUserId: number | string
    ): Promise<CodeIndexerApiTokenRecord[]> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $github_user_id AS Utf8;

            SELECT
                token_id,
                github_user_id,
                name,
                revoked_at IS NOT NULL AS revoked
            FROM ${CODE_INDEXER_API_TOKENS_TABLE}
            WHERE github_user_id = $github_user_id
            ORDER BY created_at DESC;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                { $github_user_id: TypedValues.utf8(normalizeId(githubUserId)) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        return (result.resultSets?.[0]?.rows ?? []).map((row) => {
            const tokenId = readText(row, 0);
            const rowGithubUserId = readText(row, 1);
            const name = readText(row, 2);
            if (!tokenId || !rowGithubUserId || !name) {
                throw new Error("stored code-indexer API token row is invalid");
            }
            return {
                githubUserId: rowGithubUserId,
                name,
                revoked: readBool(row, 3) ?? false,
                tokenId,
            };
        });
    }

    async findApiTokenByPlaintextToken(
        plaintextToken: string
    ): Promise<CodeIndexerApiTokenRecord | null> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $token_hash AS Utf8;

            SELECT
                token_id,
                github_user_id,
                name,
                revoked_at IS NOT NULL AS revoked
            FROM ${CODE_INDEXER_API_TOKENS_TABLE}
            WHERE token_hash = $token_hash
            LIMIT 1;
        `;
        const result = await withSession(async (session) => {
            return (await session.executeQuery(
                yql,
                {
                    $token_hash: TypedValues.utf8(
                        hashApiToken(plaintextToken, this.tokenPepper)
                    ),
                },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
        });
        const row = readFirstRow(result);
        if (!row) {
            return null;
        }
        const tokenId = readText(row, 0);
        const githubUserId = readText(row, 1);
        const name = readText(row, 2);
        if (!tokenId || !githubUserId || !name) {
            throw new Error("stored code-indexer API token row is invalid");
        }
        const revoked = readBool(row, 3) ?? false;
        return revoked ? null : { githubUserId, name, revoked, tokenId };
    }

    async revokeApiToken(params: {
        githubUserId: number | string;
        tokenId: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $token_id AS Utf8;
            DECLARE $github_user_id AS Utf8;

            UPDATE ${CODE_INDEXER_API_TOKENS_TABLE}
            SET revoked_at = CurrentUtcTimestamp()
            WHERE token_id = $token_id AND github_user_id = $github_user_id;
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $github_user_id: TypedValues.utf8(
                        normalizeId(params.githubUserId)
                    ),
                    $token_id: TypedValues.utf8(params.tokenId),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    async incrementDailyUsage(params: {
        amount?: number;
        date?: Date;
        githubUserId: number | string;
        metric: string;
    }): Promise<number> {
        await ensureCodeIndexerSaasTables();
        const usageDate = formatUsageDate(params.date ?? this.now());
        const githubUserId = normalizeId(params.githubUserId);
        const usageKey = `${usageDate}/${githubUserId}/${params.metric}`;
        const amount = Math.max(1, Math.floor(params.amount ?? 1));
        const selectYql = `
            DECLARE $usage_key AS Utf8;

            SELECT count
            FROM ${CODE_INDEXER_USAGE_DAILY_TABLE}
            WHERE usage_key = $usage_key
            LIMIT 1;
        `;
        const upsertYql = `
            DECLARE $usage_key AS Utf8;
            DECLARE $usage_date AS Utf8;
            DECLARE $github_user_id AS Utf8;
            DECLARE $metric AS Utf8;
            DECLARE $count AS Uint32;

            UPSERT INTO ${CODE_INDEXER_USAGE_DAILY_TABLE}
                (
                    usage_key,
                    usage_date,
                    github_user_id,
                    metric,
                    count,
                    updated_at
                )
            VALUES (
                $usage_key,
                $usage_date,
                $github_user_id,
                $metric,
                $count,
                CurrentUtcTimestamp()
            );
        `;
        return await withSession(async (session) => {
            const result = (await session.executeQuery(
                selectYql,
                { $usage_key: TypedValues.utf8(usageKey) },
                undefined,
                createExecuteQuerySettings()
            )) as ExecuteQueryResultLike;
            const currentCount = readFirstRow(result)
                ? readUint(readFirstRow(result) as QueryRow, 0) ?? 0
                : 0;
            const nextCount = currentCount + amount;
            await session.executeQuery(
                upsertYql,
                {
                    $count: TypedValues.uint32(nextCount),
                    $github_user_id: TypedValues.utf8(githubUserId),
                    $metric: TypedValues.utf8(params.metric),
                    $usage_date: TypedValues.utf8(usageDate),
                    $usage_key: TypedValues.utf8(usageKey),
                },
                undefined,
                createExecuteQuerySettings()
            );
            return nextCount;
        });
    }

    async appendAuditLog(params: {
        action: string;
        auditId: string;
        githubUserId?: number | string;
        metadata?: unknown;
        target?: string;
    }): Promise<void> {
        await ensureCodeIndexerSaasTables();
        const yql = `
            DECLARE $audit_id AS Utf8;
            DECLARE $github_user_id AS Utf8?;
            DECLARE $action AS Utf8;
            DECLARE $target AS Utf8?;
            DECLARE $metadata AS JsonDocument?;

            UPSERT INTO ${CODE_INDEXER_AUDIT_LOG_TABLE}
                (
                    audit_id,
                    github_user_id,
                    action,
                    target,
                    metadata,
                    created_at
                )
            VALUES (
                $audit_id,
                $github_user_id,
                $action,
                $target,
                $metadata,
                CurrentUtcTimestamp()
            );
        `;
        await withSession(async (session) => {
            await session.executeQuery(
                yql,
                {
                    $action: TypedValues.utf8(params.action),
                    $audit_id: TypedValues.utf8(params.auditId),
                    $github_user_id:
                        optionalUtf8(
                            params.githubUserId === undefined
                                ? undefined
                                : normalizeId(params.githubUserId)
                        ),
                    $metadata:
                        optionalJsonDocument(
                            params.metadata === undefined
                                ? undefined
                                : JSON.stringify(params.metadata)
                        ),
                    $target:
                        optionalUtf8(params.target),
                },
                undefined,
                createExecuteQuerySettings()
            );
        });
    }

    private repositoryParams(params: CodeIndexerRepositoryRecord): QueryParams {
        return {
            $chunk_count:
                optionalUint32(params.chunkCount),
            $default_branch: TypedValues.utf8(params.defaultBranch),
            $installation_id: TypedValues.utf8(
                normalizeId(params.installationId)
            ),
            $last_error:
                optionalUtf8(params.lastError?.slice(0, 4000)),
            $last_indexed_sha:
                optionalUtf8(params.lastIndexedSha),
            $owner: TypedValues.utf8(params.owner),
            $repo: TypedValues.utf8(params.repo),
            $repo_id: TypedValues.utf8(normalizeId(params.repoId)),
            $status: TypedValues.utf8(params.status),
        };
    }
}

function parseRepositoryRow(row: QueryRow): CodeIndexerRepositoryRecord {
    const repoId = readText(row, 0);
    const installationId = readText(row, 1);
    const owner = readText(row, 2);
    const repo = readText(row, 3);
    const defaultBranch = readText(row, 4);
    const status = readText(row, 5);
    if (
        !repoId ||
        !installationId ||
        !owner ||
        !repo ||
        !defaultBranch ||
        !isRepositoryStatus(status)
    ) {
        throw new Error("stored code-indexer repository row is invalid");
    }
    return {
        defaultBranch,
        installationId,
        owner,
        repo,
        repoId,
        status,
        ...(readText(row, 6) ? { lastIndexedSha: readText(row, 6) } : {}),
        ...(readUint(row, 7) !== undefined ? { chunkCount: readUint(row, 7) } : {}),
        ...(readText(row, 8) ? { lastError: readText(row, 8) } : {}),
    };
}

function isRepositoryStatus(value: unknown): value is CodeIndexerRepositoryStatus {
    return (
        value === "queued" ||
        value === "indexing" ||
        value === "ready" ||
        value === "failed" ||
        value === "deleted"
    );
}

function formatUsageDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}
