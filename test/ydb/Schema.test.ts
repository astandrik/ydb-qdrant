import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

vi.mock("../../src/logging/logger.js", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/ydb/client.js", () => {
    class FakeTableDescription {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        withColumns(..._cols: unknown[]) {
            return this;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        withPrimaryKey(..._keys: string[]) {
            return this;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        withPrimaryKeys(..._keys: string[]) {
            return this;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        withPartitioningSettings(..._settings: unknown[]) {
            return this;
        }
    }

    class FakeColumn {
        name: string;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        constructor(name: string, _type: unknown) {
            this.name = name;
        }
    }

    return {
        TableDescription: FakeTableDescription,
        Column: FakeColumn,
        Types: {
            UTF8: "UTF8",
            BYTES: "BYTES",
            JSON_DOCUMENT: "JSON_DOCUMENT",
            UINT32: "UINT32",
            TIMESTAMP: "TIMESTAMP",
            optional: (inner: unknown) => ({ optional: inner }),
        },
        Ydb: {
            FeatureFlag: {
                Status: {
                    ENABLED: 1,
                },
            },
            Table: {
                TableIndexDescription: {
                    Status: {
                        STATUS_READY: 1,
                        STATUS_BUILDING: 2,
                    },
                },
            },
        },
        withSession: vi.fn(),
    };
});

import { withSession } from "../../src/ydb/client.js";
import { logger } from "../../src/logging/logger.js";

const withSessionMock = withSession as unknown as Mock;
const loggerInfoMock = logger.info as unknown as Mock;

// Reset module state between tests
async function resetSchemaModule(
    envOverrides?: Record<string, string>
): Promise<{
    ensureMetaTable: typeof import("../../src/ydb/schema.js")["ensureMetaTable"];
    ensureGlobalPointsTable: typeof import("../../src/ydb/schema.js")["ensureGlobalPointsTable"];
    ensurePointsByFileTable: typeof import("../../src/ydb/schema.js")["ensurePointsByFileTable"];
    GLOBAL_POINTS_TABLE: typeof import("../../src/ydb/schema.js")["GLOBAL_POINTS_TABLE"];
    POINTS_BY_FILE_LOOKUP_TABLE: typeof import("../../src/ydb/schema.js")["POINTS_BY_FILE_LOOKUP_TABLE"];
}> {
    vi.resetModules();
    // env.ts requires explicit connection settings. Also ensure legacy vars stay
    // empty so dotenv/config doesn't reintroduce them from a local .env file.
    process.env.YDB_QDRANT_ENDPOINT ||= "grpc://localhost:2136";
    process.env.YDB_QDRANT_DATABASE ||= "/local";
    process.env.YDB_ENDPOINT = "";
    process.env.YDB_DATABASE = "";
    const originalEnvSnapshot = { ...process.env };
    Object.entries(envOverrides ?? {}).forEach(([key, value]) => {
        process.env[key] = value;
    });

    const schema = await import("../../src/ydb/schema.js");

    Object.keys(process.env).forEach((key) => {
        if (!(key in originalEnvSnapshot)) {
            delete process.env[key];
        }
    });
    Object.assign(process.env, originalEnvSnapshot);

    return schema;
}

describe("ydb/schema.ensureMetaTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("throws when metadata table does not exist", async () => {
        const { ensureMetaTable } = await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi
                .fn()
                .mockRejectedValue(new Error("Table not found")),
            createTable: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureMetaTable()).rejects.toThrow(
            "Metadata table qdr__collections does not exist; please create it before starting the service"
        );

        expect(session.describeTable).toHaveBeenCalledWith("qdr__collections");
        expect(session.createTable).not.toHaveBeenCalled();
        expect(loggerInfoMock).not.toHaveBeenCalledWith(
            "created metadata table qdr__collections"
        );
    });

    it("throws when describeTable fails with SchemeError (code 400070): []", async () => {
        const { ensureMetaTable } = await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi
                .fn()
                .mockRejectedValue(new Error("SchemeError (code 400070): []")),
            createTable: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureMetaTable()).rejects.toThrow(
            "Metadata table qdr__collections does not exist; please create it before starting the service"
        );

        expect(session.describeTable).toHaveBeenCalledWith("qdr__collections");
        expect(session.createTable).not.toHaveBeenCalled();
        expect(loggerInfoMock).not.toHaveBeenCalledWith(
            "created metadata table qdr__collections"
        );
    });

    it("throws when last_accessed_at column is missing (migration required)", async () => {
        const { ensureMetaTable } = await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "table_name" },
                    { name: "vector_dimension" },
                    { name: "distance" },
                    { name: "vector_type" },
                    { name: "created_at" },
                    // intentionally missing last_accessed_at
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureMetaTable()).rejects.toThrow(
            "Metadata table qdr__collections is missing required column last_accessed_at; please recreate the table or apply a manual schema migration before starting the service"
        );

        expect(session.describeTable).toHaveBeenCalledWith("qdr__collections");
        expect(session.createTable).not.toHaveBeenCalled();
        expect(loggerInfoMock).not.toHaveBeenCalledWith(
            "created metadata table qdr__collections"
        );
    });

    it("throws for non-not-found describeTable errors", async () => {
        const { ensureMetaTable } = await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi
                .fn()
                .mockRejectedValue(
                    new Error("transport unavailable (ECONNRESET)")
                ),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureMetaTable()).rejects.toThrow(
            "transport unavailable (ECONNRESET)"
        );

        expect(session.describeTable).toHaveBeenCalledWith("qdr__collections");
        expect(session.createTable).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it("throws when user_uid column is missing (migration required)", async () => {
        const { ensureMetaTable } = await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "table_name" },
                    { name: "vector_dimension" },
                    { name: "distance" },
                    { name: "vector_type" },
                    { name: "created_at" },
                    { name: "last_accessed_at" },
                    // intentionally missing user_uid
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureMetaTable()).rejects.toThrow(
            "Metadata table qdr__collections is missing required column user_uid; please recreate the table or apply a manual schema migration before starting the service"
        );

        expect(session.describeTable).toHaveBeenCalledWith("qdr__collections");
        expect(session.createTable).not.toHaveBeenCalled();
    });
});

describe("ydb/schema.ensureGlobalPointsTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is idempotent after first successful describeTable with all columns", async () => {
        const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "point_id" },
                    { name: "embedding" },
                    { name: "embedding_quantized" },
                    { name: "payload" },
                    { name: "payload_sign" },
                    { name: "path_prefix" },
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await ensureGlobalPointsTable();
        await ensureGlobalPointsTable();

        expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
        expect(session.describeTable).toHaveBeenCalledTimes(1);
        expect(session.createTable).not.toHaveBeenCalled();
    });

    it("creates table when it does not exist", async () => {
        const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi
                .fn()
                .mockRejectedValue(new Error("Table not found")),
            createTable: vi.fn().mockResolvedValue(undefined),
            executeQuery: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await ensureGlobalPointsTable();

        expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
        expect(session.createTable).toHaveBeenCalledTimes(1);
        expect(session.executeQuery).not.toHaveBeenCalled();
        expect(loggerInfoMock).toHaveBeenCalledWith(
            `created global points table ${GLOBAL_POINTS_TABLE}`
        );
    });

    it("throws when embedding_quantized column is missing", async () => {
        const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "point_id" },
                    { name: "embedding" },
                    { name: "payload" },
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureGlobalPointsTable()).rejects.toThrow(
            `Global points table ${GLOBAL_POINTS_TABLE} is missing required column embedding_quantized; please recreate the table or apply a manual schema migration before starting the service`
        );

        expect(session.describeTable).toHaveBeenCalledWith(GLOBAL_POINTS_TABLE);
        expect(session.createTable).not.toHaveBeenCalled();
    });

    it("throws when path_prefix column is missing", async () => {
        const { ensureGlobalPointsTable, GLOBAL_POINTS_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "point_id" },
                    { name: "embedding" },
                    { name: "embedding_quantized" },
                    { name: "payload" },
                    { name: "payload_sign" },
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensureGlobalPointsTable()).rejects.toThrow(
            `Global points table ${GLOBAL_POINTS_TABLE} is missing required column path_prefix; please apply a manual schema migration before starting the service (example: ALTER TABLE ${GLOBAL_POINTS_TABLE} ADD COLUMN path_prefix Optional<Utf8>)`
        );
    });
});

describe("ydb/schema.ensurePointsByFileTable", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("is idempotent after first successful describeTable with all columns", async () => {
        const { ensurePointsByFileTable, POINTS_BY_FILE_LOOKUP_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "file_path" },
                    { name: "point_id" },
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await ensurePointsByFileTable();
        await ensurePointsByFileTable();

        expect(session.describeTable).toHaveBeenCalledWith(
            POINTS_BY_FILE_LOOKUP_TABLE
        );
        expect(session.describeTable).toHaveBeenCalledTimes(1);
        expect(session.createTable).not.toHaveBeenCalled();
    });

    it("creates table when it does not exist", async () => {
        const { ensurePointsByFileTable, POINTS_BY_FILE_LOOKUP_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi
                .fn()
                .mockRejectedValueOnce(new Error("Table not found")),
            createTable: vi.fn().mockResolvedValue(undefined),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await ensurePointsByFileTable();

        expect(session.describeTable).toHaveBeenCalledWith(
            POINTS_BY_FILE_LOOKUP_TABLE
        );
        expect(session.createTable).toHaveBeenCalledTimes(1);
        expect(loggerInfoMock).toHaveBeenCalledWith(
            `created points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE}`
        );
    });

    it("throws when file_path column is missing", async () => {
        const { ensurePointsByFileTable, POINTS_BY_FILE_LOOKUP_TABLE } =
            await resetSchemaModule();

        const session = {
            sessionId: "test-session",
            describeTable: vi.fn().mockResolvedValue({
                columns: [
                    { name: "collection" },
                    { name: "point_id" },
                ],
            }),
            createTable: vi.fn(),
        };

        withSessionMock.mockImplementation(
            async (fn: (s: unknown) => unknown) => {
                return await fn(session);
            }
        );

        await expect(ensurePointsByFileTable()).rejects.toThrow(
            `Points-by-file lookup table ${POINTS_BY_FILE_LOOKUP_TABLE} is missing required column file_path; please recreate the table before starting the service`
        );
    });
});
