import readline from "node:readline";
import type { Readable, Writable } from "node:stream";

import { YdbQdrantMcpServer } from "./mcp.js";
import type { YdbQdrantMcpDeps } from "./types.js";

export function startYdbQdrantMcpStdioServer(params: {
    deps: YdbQdrantMcpDeps;
    input?: Readable;
    output?: Writable;
}): void {
    const server = new YdbQdrantMcpServer(params.deps);
    const input = params.input ?? process.stdin;
    const output = params.output ?? process.stdout;
    const rl = readline.createInterface({ input });

    rl.on("line", (line) => {
        void (async () => {
            const trimmed = line.trim();
            if (!trimmed) {
                return;
            }
            const result = await server.handleJsonRpcMessage(trimmed);
            if (result) {
                output.write(`${JSON.stringify(result)}\n`);
            }
        })();
    });
}
