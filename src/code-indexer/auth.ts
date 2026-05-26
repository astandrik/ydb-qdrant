import {
    createHmac,
    randomBytes,
    timingSafeEqual,
} from "node:crypto";

export const CODE_INDEXER_SESSION_COOKIE = "__Host-ydbqci_session";
export const CODE_INDEXER_OAUTH_STATE_COOKIE = "__Host-ydbqci_oauth_state";

const DEFAULT_RETURN_PATH = "/code-indexer/dashboard/";
const DEFAULT_GITHUB_API_BASE_URL = "https://api.github.com";
const DEFAULT_GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_GITHUB_BASE_URL = "https://github.com";

type FetchLike = typeof fetch;

export type OAuthStatePayload = {
    createdAtMs: number;
    installationId?: string;
    nonce: string;
    returnPath: string;
};

export type GitHubOAuthToken = {
    accessToken: string;
    expiresIn?: number;
    refreshToken?: string;
    refreshTokenExpiresIn?: number;
    tokenType?: string;
};

export type GitHubOAuthUser = {
    id: string;
    login: string;
};

export type GitHubUserInstallation = {
    accountLogin: string;
    accountType: string;
    id: string;
    status: "active" | "suspended";
};

export type GitHubOAuthClientOptions = {
    apiBaseUrl?: string;
    apiVersion?: string;
    clientId: string;
    clientSecret: string;
    fetchImpl?: FetchLike;
    githubBaseUrl?: string;
    redirectUri: string;
};

export type CodeIndexerAuthStore = {
    createSession(params: {
        expiresAt: Date;
        githubUserId: number | string;
        sessionId: string;
    }): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    upsertGitHubUser(params: {
        accessToken: string;
        githubUserId: number | string;
        login: string;
        refreshToken?: string;
    }): Promise<void>;
    upsertInstallation(params: {
        accountLogin: string;
        accountType: string;
        createdByGithubUserId?: number | string;
        installationId: number | string;
        status: string;
    }): Promise<void>;
};

export type CodeIndexerAuthDeps = {
    client: GitHubOAuthClient;
    createSessionId?: () => string;
    now?: () => Date;
    oauthStateTtlSeconds: number;
    sessionSecret: string;
    sessionTtlSeconds: number;
    store: CodeIndexerAuthStore;
    uiOrigin: string;
};

type OAuthTokenResponse = {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    token_type?: string;
};

type GitHubInstallationsResponse = {
    installations: unknown[];
    total_count?: number;
};

export class CodeIndexerAuthError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(params: { code: string; message: string; statusCode: number }) {
        super(params.message);
        this.name = "CodeIndexerAuthError";
        this.code = params.code;
        this.statusCode = params.statusCode;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
}

function signPayload(payload: string, secret: string): Buffer {
    return createHmac("sha256", secret).update(payload).digest();
}

function signatureMatches(params: {
    actualSignature: string;
    payload: string;
    secret: string;
}): boolean {
    let actual: Buffer;
    try {
        actual = Buffer.from(params.actualSignature, "base64url");
    } catch {
        return false;
    }
    const expected = signPayload(params.payload, params.secret);
    return (
        actual.length === expected.length &&
        timingSafeEqual(actual, expected)
    );
}

function authError(
    code: string,
    message: string,
    statusCode: number
): CodeIndexerAuthError {
    return new CodeIndexerAuthError({ code, message, statusCode });
}

function readGitHubId(value: unknown): string | undefined {
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return String(value);
    }
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return undefined;
}

function readOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : undefined;
}

function readOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeReturnPath(value: string | undefined): string {
    const raw = value?.trim();
    if (
        !raw ||
        !raw.startsWith("/") ||
        raw.startsWith("//") ||
        raw.includes("\\")
    ) {
        return DEFAULT_RETURN_PATH;
    }
    try {
        const url = new URL(raw, "https://code-indexer.local");
        if (url.origin !== "https://code-indexer.local") {
            return DEFAULT_RETURN_PATH;
        }
        return `${url.pathname}${url.search}${url.hash}` || DEFAULT_RETURN_PATH;
    } catch {
        return DEFAULT_RETURN_PATH;
    }
}

function parseStatePayload(value: unknown): OAuthStatePayload {
    if (!isRecord(value)) {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }
    const createdAtMs = value.createdAtMs;
    const nonce = value.nonce;
    const returnPath = value.returnPath;
    const installationId = value.installationId;
    if (
        typeof createdAtMs !== "number" ||
        !Number.isFinite(createdAtMs) ||
        typeof nonce !== "string" ||
        nonce.length === 0 ||
        typeof returnPath !== "string"
    ) {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }
    if (
        installationId !== undefined &&
        (typeof installationId !== "string" || installationId.length === 0)
    ) {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }
    return {
        createdAtMs,
        ...(installationId ? { installationId } : {}),
        nonce,
        returnPath: normalizeReturnPath(returnPath),
    };
}

function isOAuthTokenResponse(value: unknown): value is OAuthTokenResponse {
    return (
        isRecord(value) &&
        typeof value.access_token === "string" &&
        value.access_token.length > 0
    );
}

function isGitHubInstallationsResponse(
    value: unknown
): value is GitHubInstallationsResponse {
    return (
        isRecord(value) &&
        Array.isArray(value.installations) &&
        (value.total_count === undefined ||
            typeof value.total_count === "number")
    );
}

function parseGitHubInstallation(
    value: unknown
): GitHubUserInstallation | null {
    if (!isRecord(value)) {
        return null;
    }
    const id = readGitHubId(value.id);
    const account = value.account;
    if (!id || !isRecord(account)) {
        return null;
    }
    const accountLogin = readOptionalString(account.login);
    const accountType = readOptionalString(account.type);
    if (!accountLogin || !accountType) {
        return null;
    }
    return {
        accountLogin,
        accountType,
        id,
        status: value.suspended_at ? "suspended" : "active",
    };
}

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) {
        return null;
    }
    return JSON.parse(text) as unknown;
}

function githubOAuthErrorMessage(
    body: unknown,
    fallback: string
): string {
    if (!isRecord(body) || typeof body.error !== "string") {
        return fallback;
    }
    if (typeof body.error_description === "string") {
        return `GitHub OAuth token exchange failed: ${body.error_description}`;
    }
    return `GitHub OAuth token exchange failed: ${body.error}`;
}

function joinBaseUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/+$/gu, "")}${path}`;
}

export function createOAuthState(params: {
    installationId?: number | string;
    nowMs?: number;
    returnPath?: string;
    secret: string;
}): string {
    const installationId =
        params.installationId === undefined
            ? undefined
            : String(params.installationId).trim();
    const payload = base64Url(
        JSON.stringify({
            createdAtMs: params.nowMs ?? Date.now(),
            ...(installationId ? { installationId } : {}),
            nonce: randomBytes(16).toString("base64url"),
            returnPath: normalizeReturnPath(params.returnPath),
        } satisfies OAuthStatePayload)
    );
    const signature = base64Url(signPayload(payload, params.secret));
    return `v1.${payload}.${signature}`;
}

export function verifyOAuthState(params: {
    nowMs?: number;
    secret: string;
    state: string;
    ttlSeconds: number;
}): OAuthStatePayload {
    const [version, payload, signature, extra] = params.state.split(".");
    if (
        version !== "v1" ||
        !payload ||
        !signature ||
        extra !== undefined ||
        !signatureMatches({
            actualSignature: signature,
            payload,
            secret: params.secret,
        })
    ) {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }
    const state = parseStatePayload(parsed);
    const nowMs = params.nowMs ?? Date.now();
    if (state.createdAtMs > nowMs + 60_000) {
        throw authError("invalid_oauth_state", "invalid OAuth state", 400);
    }
    if (nowMs - state.createdAtMs > params.ttlSeconds * 1_000) {
        throw authError("expired_oauth_state", "OAuth state expired", 400);
    }
    return state;
}

export function createRandomSessionId(): string {
    return randomBytes(32).toString("base64url");
}

export function createSessionCookie(
    sessionId: string,
    maxAgeSeconds: number
): string {
    return [
        `${CODE_INDEXER_SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
        `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

export function createOAuthStateCookie(
    nonce: string,
    maxAgeSeconds: number
): string {
    return [
        `${CODE_INDEXER_OAUTH_STATE_COOKIE}=${encodeURIComponent(nonce)}`,
        `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

export function clearSessionCookie(): string {
    return [
        `${CODE_INDEXER_SESSION_COOKIE}=`,
        "Max-Age=0",
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

export function clearOAuthStateCookie(): string {
    return [
        `${CODE_INDEXER_OAUTH_STATE_COOKIE}=`,
        "Max-Age=0",
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
    ].join("; ");
}

function readCookieValue(
    cookieHeader: string | undefined,
    cookieName: string
): string | null {
    if (!cookieHeader) {
        return null;
    }
    for (const part of cookieHeader.split(";")) {
        const [name, ...rest] = part.trim().split("=");
        if (name === cookieName) {
            try {
                return decodeURIComponent(rest.join("="));
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function readSessionCookie(cookieHeader: string | undefined): string | null {
    return readCookieValue(cookieHeader, CODE_INDEXER_SESSION_COOKIE);
}

export function readOAuthStateCookie(
    cookieHeader: string | undefined
): string | null {
    return readCookieValue(cookieHeader, CODE_INDEXER_OAUTH_STATE_COOKIE);
}

export function buildUiRedirectUrl(uiOrigin: string, returnPath: string): string {
    return new URL(normalizeReturnPath(returnPath), new URL(uiOrigin).origin)
        .toString();
}

export class GitHubOAuthClient {
    private readonly apiBaseUrl: string;
    private readonly apiVersion: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly fetchImpl: FetchLike;
    private readonly githubBaseUrl: string;
    private readonly redirectUri: string;

    constructor(options: GitHubOAuthClientOptions) {
        if (!options.clientId.trim()) {
            throw new Error("GitHub OAuth client id is required");
        }
        if (!options.clientSecret.trim()) {
            throw new Error("GitHub OAuth client secret is required");
        }
        if (!options.redirectUri.trim()) {
            throw new Error("GitHub OAuth redirect URI is required");
        }
        this.apiBaseUrl = options.apiBaseUrl ?? DEFAULT_GITHUB_API_BASE_URL;
        this.apiVersion = options.apiVersion ?? DEFAULT_GITHUB_API_VERSION;
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.githubBaseUrl = options.githubBaseUrl ?? DEFAULT_GITHUB_BASE_URL;
        this.redirectUri = options.redirectUri;
    }

    authorizationUrl(params: { state: string }): string {
        const url = new URL(
            "/login/oauth/authorize",
            this.githubBaseUrl
        );
        url.searchParams.set("client_id", this.clientId);
        url.searchParams.set("redirect_uri", this.redirectUri);
        url.searchParams.set("state", params.state);
        return url.toString();
    }

    async exchangeCode(code: string): Promise<GitHubOAuthToken> {
        return await this.exchangeToken({
            code,
            grant_type: "authorization_code",
        });
    }

    async refreshUserToken(refreshToken: string): Promise<GitHubOAuthToken> {
        return await this.exchangeToken({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        });
    }

    async fetchUser(accessToken: string): Promise<GitHubOAuthUser> {
        const json = await this.githubJson("/user", accessToken);
        if (!isRecord(json)) {
            throw authError(
                "github_user_response_invalid",
                "GitHub user response is invalid",
                502
            );
        }
        const id = readGitHubId(json.id);
        const login = readOptionalString(json.login);
        if (!id || !login) {
            throw authError(
                "github_user_response_invalid",
                "GitHub user response is invalid",
                502
            );
        }
        return { id, login };
    }

    async findUserInstallation(
        accessToken: string,
        installationId: number | string
    ): Promise<GitHubUserInstallation | null> {
        const targetInstallationId = String(installationId);
        const installations = await this.listUserInstallations(accessToken);
        return (
            installations.find(
                (installation) => installation.id === targetInstallationId
            ) ?? null
        );
    }

    async listUserInstallations(
        accessToken: string
    ): Promise<GitHubUserInstallation[]> {
        const installations: GitHubUserInstallation[] = [];
        const perPage = 100;
        let page = 1;
        for (;;) {
            const json = await this.githubJson(
                `/user/installations?per_page=${perPage}&page=${page}`,
                accessToken
            );
            if (!isGitHubInstallationsResponse(json)) {
                throw authError(
                    "github_installations_response_invalid",
                    "GitHub installations response is invalid",
                    502
                );
            }
            for (const rawInstallation of json.installations) {
                const installation = parseGitHubInstallation(rawInstallation);
                if (!installation) {
                    throw authError(
                        "github_installations_response_invalid",
                        "GitHub installations response is invalid",
                        502
                    );
                }
                installations.push(installation);
            }
            const totalCount = json.total_count ?? json.installations.length;
            if (page * perPage >= totalCount || json.installations.length === 0) {
                return installations;
            }
            page += 1;
        }
    }

    private async exchangeToken(
        params: Record<string, string>
    ): Promise<GitHubOAuthToken> {
        const body = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            ...params,
        });
        const response = await this.fetchImpl(
            new URL("/login/oauth/access_token", this.githubBaseUrl),
            {
                body,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
            }
        );
        const json = await readJson(response);
        if (!response.ok || (isRecord(json) && typeof json.error === "string")) {
            throw authError(
                "github_oauth_token_exchange_failed",
                githubOAuthErrorMessage(
                    json,
                    `GitHub OAuth token exchange failed: ${response.status} ${response.statusText}`
                ),
                502
            );
        }
        if (!isOAuthTokenResponse(json)) {
            throw authError(
                "github_oauth_token_response_invalid",
                "GitHub OAuth token response is invalid",
                502
            );
        }
        return {
            accessToken: json.access_token,
            expiresIn: readOptionalNumber(json.expires_in),
            refreshToken: readOptionalString(json.refresh_token),
            refreshTokenExpiresIn: readOptionalNumber(
                json.refresh_token_expires_in
            ),
            tokenType: readOptionalString(json.token_type),
        };
    }

    private async githubJson(
        path: string,
        accessToken: string
    ): Promise<unknown> {
        const response = await this.fetchImpl(joinBaseUrl(this.apiBaseUrl, path), {
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${accessToken}`,
                "X-GitHub-Api-Version": this.apiVersion,
            },
        });
        if (!response.ok) {
            throw authError(
                "github_request_failed",
                `GitHub request failed: ${response.status} ${response.statusText}`,
                502
            );
        }
        return await readJson(response);
    }
}
