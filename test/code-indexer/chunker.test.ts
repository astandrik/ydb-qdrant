import { describe, expect, it } from "vitest";

import {
    chunkFile,
    createCodeChunker,
    isProbablyBinaryContent,
    languageForPath,
    LineWindowChunker,
    matchesPathPattern,
    shouldIndexFile,
} from "../../src/code-indexer/chunker.js";

describe("code-indexer chunker", () => {
    it("filters vendor, lock, binary, and oversized files", () => {
        expect(shouldIndexFile({ path: "src/server.ts", size: 200 })).toBe(true);
        expect(shouldIndexFile({ path: "node_modules/pkg/index.js" })).toBe(
            false
        );
        expect(shouldIndexFile({ path: "package-lock.json" })).toBe(false);
        expect(shouldIndexFile({ path: "docs/image.png" })).toBe(false);
        expect(
            shouldIndexFile({
                path: "src/huge.ts",
                size: 10,
            }, {
                maxFileBytes: 5,
            })
        ).toBe(false);
        expect(
            shouldIndexFile(
                { path: "package-lock.json" },
                { includePatterns: ["package-lock.json"] }
            )
        ).toBe(true);
        expect(
            shouldIndexFile(
                { path: "src/generated/client.ts" },
                { excludePatterns: ["**/generated/**"] }
            )
        ).toBe(false);
        expect(
            shouldIndexFile(
                { path: "docs/readme.md" },
                { includePatterns: ["src/**"] }
            )
        ).toBe(false);
    });

    it("matches repository config path patterns", () => {
        expect(matchesPathPattern("src/server.ts", "src/**")).toBe(true);
        expect(matchesPathPattern("src/server.ts", "**/*.ts")).toBe(true);
        expect(matchesPathPattern("README.md", "*.md")).toBe(true);
        expect(matchesPathPattern("docs/README.md", "*.md")).toBe(true);
        expect(matchesPathPattern("docs/README.md", "src/**")).toBe(false);
    });

    it("chunks files with stable line ranges and path segments", () => {
        const chunks = chunkFile({
            content: ["one", "two", "three", "four", "five"].join("\n"),
            options: { chunkLines: 3, overlapLines: 1 },
            path: "src/server.ts",
        });

        expect(chunks).toEqual([
            {
                chunker: "line-window",
                chunkIndex: 0,
                endLine: 3,
                language: "TypeScript",
                path: "src/server.ts",
                pathSegments: ["src", "server.ts"],
                startLine: 1,
                text: "one\ntwo\nthree",
            },
            {
                chunker: "line-window",
                chunkIndex: 1,
                endLine: 5,
                language: "TypeScript",
                path: "src/server.ts",
                pathSegments: ["src", "server.ts"],
                startLine: 3,
                text: "three\nfour\nfive",
            },
        ]);
    });

    it("exposes the line-window chunker through the chunker interface", () => {
        const chunker = new LineWindowChunker();

        expect(
            chunker.chunkFile({
                content: "one\ntwo\nthree",
                options: { chunkLines: 2, overlapLines: 0 },
                path: "src/server.ts",
            })
        ).toMatchObject([
            { chunkIndex: 0, endLine: 2, startLine: 1, text: "one\ntwo" },
            { chunkIndex: 1, endLine: 3, startLine: 3, text: "three" },
        ]);
    });

    it("keeps line-window chunks within the configured character limit", () => {
        const chunker = new LineWindowChunker();
        const chunks = chunker.chunkFile({
            content: [
                `first ${"a".repeat(45)}`,
                `second ${"b".repeat(45)}`,
                `third ${"c".repeat(120)}`,
            ].join("\n"),
            options: { chunkLines: 3, maxChunkChars: 64, overlapLines: 0 },
            path: "src/long.ts",
        });

        expect(chunks.length).toBeGreaterThan(3);
        expect(chunks.every((chunk) => chunk.text.length <= 64)).toBe(true);
        expect(chunks.map((chunk) => [chunk.startLine, chunk.endLine])).toEqual([
            [1, 1],
            [2, 2],
            [3, 3],
            [3, 3],
        ]);
    });

    it("detects languages and binary-looking content", () => {
        expect(languageForPath("Dockerfile")).toBe("Dockerfile");
        expect(languageForPath(".github/workflows/ci.yml")).toBe("YAML");
        expect(isProbablyBinaryContent("hello\0world")).toBe(true);
        expect(chunkFile({ content: "hello\0world", path: "a.txt" })).toEqual(
            []
        );
    });

    it("chunks core languages with Tree-sitter semantic boundaries", () => {
        const chunker = createCodeChunker({ mode: "tree-sitter" });

        expect(
            chunker
                .chunkFile({
                    content: [
                        "export interface User { id: string }",
                        "export function loadUser() { return 1; }",
                    ].join("\n"),
                    path: "src/users.ts",
                })
                .map((chunk) => ({
                    chunkKind: chunk.chunkKind,
                    chunker: chunk.chunker,
                    symbolName: chunk.symbolName,
                    text: chunk.text,
                }))
        ).toEqual([
            {
                chunkKind: "interface",
                chunker: "tree-sitter",
                symbolName: "User",
                text: "export interface User { id: string }",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                symbolName: "loadUser",
                text: "export function loadUser() { return 1; }",
            },
        ]);

        expect(
            chunker
                .chunkFile({
                    content: ["class Service:", "    pass", "", "def run():", "    pass"].join(
                        "\n"
                    ),
                    path: "service.py",
                })
                .map((chunk) => [chunk.chunkKind, chunk.symbolName])
        ).toEqual([
            ["class", "Service"],
            ["function", "run"],
        ]);

        expect(
            chunker
                .chunkFile({
                    content: [
                        "package main",
                        "type Server struct{}",
                        "func (s Server) Serve() {}",
                        "func Run() {}",
                    ].join("\n"),
                    path: "main.go",
                })
                .map((chunk) => [chunk.chunkKind, chunk.symbolName])
        ).toEqual([
            ["type", "Server"],
            ["method", "Serve"],
            ["function", "Run"],
        ]);

        expect(
            chunker
                .chunkFile({
                    content: [
                        "struct Server {}",
                        "trait Runnable {}",
                        "impl Server { fn serve(&self) {} }",
                        "fn run() {}",
                    ].join("\n"),
                    path: "lib.rs",
                })
                .map((chunk) => [chunk.chunkKind, chunk.symbolName])
        ).toEqual([
            ["struct", "Server"],
            ["trait", "Runnable"],
            ["impl", "Server"],
            ["function", "run"],
        ]);
    });

    it("chunks markdown by headings and plain text by paragraphs", () => {
        const chunker = createCodeChunker({ mode: "line-window" });
        const smartChunker = createCodeChunker({ mode: "auto" });

        expect(
            smartChunker
                .chunkFile({
                    content: [
                        "# Intro",
                        "Text",
                        "```ts",
                        "# not a heading",
                        "```",
                        "## Usage",
                        "More",
                    ].join("\n"),
                    path: "README.md",
                })
                .map((chunk) => ({
                    endLine: chunk.endLine,
                    name: chunk.symbolName,
                    startLine: chunk.startLine,
                    text: chunk.text,
                }))
        ).toEqual([
            {
                endLine: 5,
                name: "Intro",
                startLine: 1,
                text: "# Intro\nText\n```ts\n# not a heading\n```",
            },
            {
                endLine: 7,
                name: "Usage",
                startLine: 6,
                text: "## Usage\nMore",
            },
        ]);

        expect(
            smartChunker
                .chunkFile({
                    content: "first paragraph\n\nsecond paragraph",
                    path: "notes.txt",
                })
                .map((chunk) => chunk.text)
        ).toEqual(["first paragraph", "second paragraph"]);
        expect(
            chunker.chunkFile({
                content: "# Intro\nText",
                options: { chunkLines: 1, overlapLines: 0 },
                path: "README.md",
            })
        ).toMatchObject([
            { chunker: "line-window", text: "# Intro" },
            { chunker: "line-window", text: "Text" },
        ]);
    });

    it("falls back to line windows for malformed or oversized semantic chunks", () => {
        const chunker = createCodeChunker({ mode: "tree-sitter" });

        expect(
            chunker
                .chunkFile({
                    content: "export function broken(",
                    options: { chunkLines: 1, overlapLines: 0 },
                    path: "broken.ts",
                })
                .map((chunk) => chunk.chunker)
        ).toEqual(["line-window"]);

        const oversizedChunks = chunker.chunkFile({
            content: [
                "export function large() {",
                "  const a = 1;",
                "  const b = 2;",
                "  return a + b;",
                "}",
            ].join("\n"),
            options: { chunkLines: 2, maxChunkChars: 20, overlapLines: 0 },
            path: "large.ts",
        });

        expect(oversizedChunks.every((chunk) => chunk.text.length <= 20)).toBe(
            true
        );
        expect(
            oversizedChunks.map((chunk) => ({
                chunkKind: chunk.chunkKind,
                chunker: chunk.chunker,
                endLine: chunk.endLine,
                startLine: chunk.startLine,
                symbolName: chunk.symbolName,
            }))
        ).toEqual([
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 1,
                startLine: 1,
                symbolName: "large",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 1,
                startLine: 1,
                symbolName: "large",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 2,
                startLine: 2,
                symbolName: "large",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 3,
                startLine: 3,
                symbolName: "large",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 4,
                startLine: 4,
                symbolName: "large",
            },
            {
                chunkKind: "function",
                chunker: "tree-sitter",
                endLine: 5,
                startLine: 5,
                symbolName: "large",
            },
        ]);
    });
});
