#!/usr/bin/env node

process.env.YDB_QDRANT_LOG_TARGET = "stderr";

import { run } from "./cli.js";

void run(process.argv.slice(2)).catch((err: unknown) => {
    const message = err instanceof Error ? err.stack ?? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
});
