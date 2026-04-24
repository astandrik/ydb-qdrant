import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { Metadata } from "@grpc/grpc-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IAuthService } from "ydb-sdk";

type ClientModule = typeof import("../../src/ydb/client.js");

type CapturedDriverConfig = {
    authService?: unknown;
    sslCredentials?: {
        rootCertificates?: Buffer;
    };
};

type StaticCredentialsAuthServiceRuntime = {
    user: string;
    password: string;
    endpoint: string;
    sslCredentials?: {
        rootCertificates?: Buffer;
    };
};

const originalEnv = { ...process.env };
let tempDirs: string[] = [];

function createTempFile(filename: string, contents: string): string {
    const dir = mkdtempSync(join(tmpdir(), "ydb-qdrant-static-"));
    tempDirs.push(dir);
    const filePath = join(dir, filename);
    writeFileSync(filePath, contents, { mode: 0o600 });
    return filePath;
}

function createMockDriver() {
    return {
        ready: vi.fn().mockResolvedValue(true),
        destroy: vi.fn().mockResolvedValue(undefined),
    };
}

async function captureDriverConfig(
    beforeReady?: (client: ClientModule) => void
): Promise<CapturedDriverConfig> {
    const client = await import("../../src/ydb/client.js");
    let capturedConfig: unknown;

    client.__setDriverFactoryForTests((config: unknown) => {
        capturedConfig = config;
        return createMockDriver();
    });
    beforeReady?.(client);

    await client.readyOrThrow();
    await client.destroyDriver();

    expect(capturedConfig).toBeDefined();
    return capturedConfig as CapturedDriverConfig;
}

function getStaticAuthService(
    config: CapturedDriverConfig
): StaticCredentialsAuthServiceRuntime {
    expect(config.authService).toBeDefined();
    expect((config.authService as object).constructor.name).toBe(
        "StaticCredentialsAuthService"
    );
    return config.authService as StaticCredentialsAuthServiceRuntime;
}

describe("ydb/client static credentials auth", () => {
    beforeEach(() => {
        vi.resetModules();
        tempDirs = [];
        process.env = { ...originalEnv };
        process.env.YDB_QDRANT_ENDPOINT = "grpc://localhost:2136";
        process.env.YDB_QDRANT_DATABASE = "/local";
        delete process.env.YDB_ENDPOINT;
        delete process.env.YDB_DATABASE;
        delete process.env.YDB_STATIC_CREDENTIALS_USER;
        delete process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE;
        delete process.env.YDB_STATIC_CREDENTIALS_PASSWORD;
        delete process.env.YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT;
        delete process.env.YDB_SSL_ROOT_CERTIFICATES_FILE;
    });

    afterEach(() => {
        for (const dir of tempDirs) {
            rmSync(dir, { recursive: true, force: true });
        }
        process.env = { ...originalEnv };
        vi.resetModules();
    });

    it("uses static credentials from password file", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE = createTempFile(
            "password",
            "file-secret\n"
        );

        const config = await captureDriverConfig();
        const authService = getStaticAuthService(config);

        expect(authService.user).toBe("qdrantapp");
        expect(authService.password).toBe("file-secret");
        expect(authService.endpoint).toBe("grpc://localhost:2136");
    });

    it("falls back to static credentials password env", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";

        const config = await captureDriverConfig();
        const authService = getStaticAuthService(config);

        expect(authService.password).toBe("env-secret");
    });

    it("prefers static credentials password file over password env", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE = createTempFile(
            "password",
            "file-secret\n"
        );

        const config = await captureDriverConfig();
        const authService = getStaticAuthService(config);

        expect(authService.password).toBe("file-secret");
    });

    it("fails clearly when static credentials user is set without password", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";

        const client = await import("../../src/ydb/client.js");

        await expect(client.readyOrThrow()).rejects.toThrow(
            /YDB_STATIC_CREDENTIALS_PASSWORD_FILE/
        );
    });

    it("fails clearly when static credentials password file cannot be read", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        const dir = mkdtempSync(join(tmpdir(), "ydb-qdrant-static-"));
        tempDirs.push(dir);
        const missingPath = join(dir, "missing-password");
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE = missingPath;

        const client = await import("../../src/ydb/client.js");

        await expect(client.readyOrThrow()).rejects.toThrow(
            /YDB_STATIC_CREDENTIALS_PASSWORD_FILE/
        );
        await expect(client.readyOrThrow()).rejects.toThrow(missingPath);
    });

    it("fails clearly when private CA file cannot be read", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";
        const dir = mkdtempSync(join(tmpdir(), "ydb-qdrant-static-"));
        tempDirs.push(dir);
        const missingPath = join(dir, "missing-ca.pem");
        process.env.YDB_SSL_ROOT_CERTIFICATES_FILE = missingPath;

        const client = await import("../../src/ydb/client.js");
        client.configureDriver({
            connectionString: "grpcs://ydb-local:2137/local/qdrant",
        });

        await expect(client.readyOrThrow()).rejects.toThrow(
            `Failed to read YDB_SSL_ROOT_CERTIFICATES_FILE at ${missingPath}.`
        );
    });

    it("keeps explicit programmatic authService ahead of env static credentials", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";
        const explicitAuthService: IAuthService = {
            getAuthMetadata: vi.fn().mockResolvedValue(new Metadata()),
        };

        const config = await captureDriverConfig((client) => {
            client.configureDriver({
                endpoint: "grpc://explicit:2136",
                database: "/explicit",
                authService: explicitAuthService,
            });
        });

        expect(config.authService).toBe(explicitAuthService);
    });

    it("does not inject driver SSL credentials for explicit secure auth without private CA", async () => {
        const explicitAuthService: IAuthService = {
            getAuthMetadata: vi.fn().mockResolvedValue(new Metadata()),
        };

        const config = await captureDriverConfig((client) => {
            client.configureDriver({
                connectionString: "grpcs://explicit:2137/local",
                authService: explicitAuthService,
            });
        });

        expect(config.authService).toBe(explicitAuthService);
        expect(config.sslCredentials).toBeUndefined();
    });

    it("derives auth endpoint from connection string and applies private CA", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";
        process.env.YDB_SSL_ROOT_CERTIFICATES_FILE = createTempFile(
            "ca.pem",
            "test-ca"
        );

        const config = await captureDriverConfig((client) => {
            client.configureDriver({
                connectionString: "grpcs://ydb-local:2137/local/qdrant",
            });
        });
        const authService = getStaticAuthService(config);

        expect(authService.endpoint).toBe("grpcs://ydb-local:2137");
        expect(authService.sslCredentials?.rootCertificates?.toString()).toBe(
            "test-ca"
        );
        expect(config.sslCredentials?.rootCertificates?.toString()).toBe(
            "test-ca"
        );
    });

    it("uses SDK default TLS roots for secure static auth without private CA", async () => {
        process.env.YDB_STATIC_CREDENTIALS_USER = "qdrantapp";
        process.env.YDB_STATIC_CREDENTIALS_PASSWORD = "env-secret";

        const config = await captureDriverConfig((client) => {
            client.configureDriver({
                connectionString: "grpcs://ydb-local:2137/local/qdrant",
            });
        });
        const authService = getStaticAuthService(config);

        expect(authService.sslCredentials?.rootCertificates).toBeInstanceOf(
            Buffer
        );
        expect(
            authService.sslCredentials?.rootCertificates?.length
        ).toBeGreaterThan(0);
        expect(config.sslCredentials).toBeUndefined();
    });
});
