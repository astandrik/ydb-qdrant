import "dotenv/config";

process.env.YDB_QDRANT_ENDPOINT ??= "grpc://localhost:2136";
process.env.YDB_QDRANT_DATABASE ??= "/local";

process.env.YDB_ENDPOINT = "";
process.env.YDB_DATABASE = "";
