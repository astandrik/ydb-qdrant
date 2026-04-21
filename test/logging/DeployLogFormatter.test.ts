import { describe, expect, it } from "vitest";
import { createDeployLogFormatter } from "../../src/logging/DeployLogFormatter.js";

async function formatChunks(chunks: unknown[]): Promise<string> {
    const formatter = createDeployLogFormatter();
    const output: string[] = [];
    formatter.setEncoding("utf8");
    formatter.on("data", (chunk: string) => output.push(chunk));

    for (const chunk of chunks) {
        formatter.write(chunk);
    }
    formatter.end();

    await new Promise<void>((resolve, reject) => {
        formatter.on("end", resolve);
        formatter.on("error", reject);
    });

    return output.join("");
}

describe("DeployLogFormatter", () => {
    it("converts pino JSON lines to deploy log format", async () => {
        const output = await formatChunks([
            JSON.stringify({
                hostname: "host",
                pid: 123,
                level: 30,
                msg: "ready",
                requestId: "req-1",
            }) + "\n",
        ]);

        expect(JSON.parse(output)).toEqual({
            "@fields": {
                hostname: "host",
                pid: 123,
                requestId: "req-1",
            },
            message: "ready",
            level: 20000,
            levelStr: "INFO",
        });
    });

    it("handles Uint8Array chunks and preserves non-pino lines", async () => {
        const output = await formatChunks([
            Buffer.from("plain line\n"),
            new Uint8Array(Buffer.from("not-json\n")),
        ]);

        expect(output).toBe("plain line\nnot-json\n");
    });
});
