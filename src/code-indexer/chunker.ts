import { createRequire } from "node:module";

import { pathSegmentsForPath } from "./naming.js";
import type { CodeChunk, GitHubFileEntry } from "./types.js";
import { logger } from "../logging/logger.js";

const DEFAULT_MAX_FILE_BYTES = 512 * 1024;
const DEFAULT_CHUNK_LINES = 80;
const DEFAULT_OVERLAP_LINES = 10;
const DEFAULT_MAX_CHUNK_CHARS = 8000;
const TREE_SITTER_REGISTRY_VERSION = "js-ts-python-go-rust:v1";

const EXCLUDED_DIRECTORIES = new Set([
    ".git",
    ".next",
    ".turbo",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "vendor",
]);

const EXCLUDED_FILENAMES = new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "composer.lock",
    "poetry.lock",
    "cargo.lock",
]);

const BINARY_EXTENSIONS = new Set([
    ".7z",
    ".avi",
    ".bmp",
    ".class",
    ".dll",
    ".dylib",
    ".exe",
    ".gif",
    ".gz",
    ".ico",
    ".jar",
    ".jpeg",
    ".jpg",
    ".mov",
    ".mp3",
    ".mp4",
    ".pdf",
    ".png",
    ".so",
    ".tar",
    ".wasm",
    ".webp",
    ".zip",
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
    ".c": "C",
    ".cc": "C++",
    ".cpp": "C++",
    ".cs": "C#",
    ".css": "CSS",
    ".go": "Go",
    ".graphql": "GraphQL",
    ".h": "C/C++",
    ".hpp": "C++",
    ".html": "HTML",
    ".java": "Java",
    ".js": "JavaScript",
    ".json": "JSON",
    ".jsx": "JavaScript",
    ".kt": "Kotlin",
    ".md": "Markdown",
    ".mdx": "MDX",
    ".mjs": "JavaScript",
    ".mts": "TypeScript",
    ".py": "Python",
    ".rb": "Ruby",
    ".rs": "Rust",
    ".rst": "reStructuredText",
    ".sh": "Shell",
    ".sql": "SQL",
    ".swift": "Swift",
    ".toml": "TOML",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".txt": "Text",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".adoc": "AsciiDoc",
    ".asciidoc": "AsciiDoc",
};

export type ChunkingOptions = {
    chunkLines?: number;
    excludePatterns?: string[];
    includePatterns?: string[];
    maxChunkChars?: number;
    maxFileBytes?: number;
    overlapLines?: number;
};

export type ChunkFileParams = {
    content: string;
    options?: ChunkingOptions;
    path: string;
};

export interface CodeChunker {
    chunkFile(params: ChunkFileParams): CodeChunk[];
    fingerprint?(options?: ChunkingOptions): string;
}

export type CodeIndexerChunkerMode = "auto" | "line-window" | "tree-sitter";

function escapeRegExp(value: string): string {
    return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function extensionOf(path: string): string {
    const basename = path.split("/").at(-1) ?? path;
    const dotIdx = basename.lastIndexOf(".");
    return dotIdx >= 0 ? basename.slice(dotIdx).toLowerCase() : "";
}

function filenameOf(path: string): string {
    return path.split("/").at(-1)?.toLowerCase() ?? path.toLowerCase();
}

function containsExcludedDirectory(path: string): boolean {
    return path
        .split("/")
        .some((segment) => EXCLUDED_DIRECTORIES.has(segment.toLowerCase()));
}

function normalizePathPattern(value: string): string {
    return value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function patternToRegExp(pattern: string): RegExp {
    let source = "^";
    for (let i = 0; i < pattern.length; i += 1) {
        const char = pattern[i];
        const next = pattern[i + 1];
        if (char === "*" && next === "*") {
            if (pattern[i + 2] === "/") {
                source += "(?:.*/)?";
                i += 2;
            } else {
                source += ".*";
                i += 1;
            }
            continue;
        }
        if (char === "*") {
            source += "[^/]*";
            continue;
        }
        if (char === "?") {
            source += "[^/]";
            continue;
        }
        source += escapeRegExp(char);
    }
    source += "$";
    return new RegExp(source);
}

export function matchesPathPattern(path: string, pattern: string): boolean {
    const normalizedPattern = normalizePathPattern(pattern);
    if (!normalizedPattern) {
        return false;
    }
    const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (normalizedPattern.endsWith("/")) {
        return normalizedPath.startsWith(normalizedPattern);
    }
    const candidates = normalizedPattern.includes("/")
        ? [normalizedPath]
        : [filenameOf(normalizedPath), normalizedPath];
    const regex = patternToRegExp(normalizedPattern);
    return candidates.some((candidate) => regex.test(candidate));
}

function matchesAnyPathPattern(path: string, patterns: string[] | undefined): boolean {
    return patterns?.some((pattern) => matchesPathPattern(path, pattern)) ?? false;
}

export function languageForPath(path: string): string | null {
    const filename = filenameOf(path);
    if (filename === "dockerfile") {
        return "Dockerfile";
    }
    if (filename.startsWith("dockerfile.")) {
        return "Dockerfile";
    }
    return LANGUAGE_BY_EXTENSION[extensionOf(path)] ?? null;
}

function normalizedChunkLines(options: ChunkingOptions | undefined): number {
    return Math.max(1, options?.chunkLines ?? DEFAULT_CHUNK_LINES);
}

function normalizedOverlapLines(options: ChunkingOptions | undefined): number {
    const chunkLines = normalizedChunkLines(options);
    return Math.min(
        Math.max(0, options?.overlapLines ?? DEFAULT_OVERLAP_LINES),
        Math.max(0, chunkLines - 1)
    );
}

function normalizedMaxChunkChars(options: ChunkingOptions | undefined): number {
    return Math.max(1, options?.maxChunkChars ?? DEFAULT_MAX_CHUNK_CHARS);
}

function chunkingOptionsFingerprint(options: ChunkingOptions | undefined): string {
    return JSON.stringify({
        chunkLines: normalizedChunkLines(options),
        maxChunkChars: normalizedMaxChunkChars(options),
        maxFileBytes: options?.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
        overlapLines: normalizedOverlapLines(options),
    });
}

export function isProbablyBinaryContent(content: string): boolean {
    if (content.includes("\0")) {
        return true;
    }

    const sample = content.slice(0, 4096);
    if (sample.length === 0) {
        return false;
    }

    let suspicious = 0;
    for (const char of sample) {
        const code = char.charCodeAt(0);
        if (code < 9 || (code > 13 && code < 32)) {
            suspicious += 1;
        }
    }

    return suspicious / sample.length > 0.1;
}

export function shouldIndexFile(
    file: Pick<GitHubFileEntry, "path" | "size">,
    options: ChunkingOptions = {}
): boolean {
    if (matchesAnyPathPattern(file.path, options.excludePatterns)) {
        return false;
    }
    const matchesExplicitInclude = matchesAnyPathPattern(
        file.path,
        options.includePatterns
    );
    if (
        (containsExcludedDirectory(file.path) ||
            EXCLUDED_FILENAMES.has(filenameOf(file.path))) &&
        !matchesExplicitInclude
    ) {
        return false;
    }
    if (BINARY_EXTENSIONS.has(extensionOf(file.path))) {
        return false;
    }
    if (options.includePatterns && !matchesExplicitInclude) {
        return false;
    }
    const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
    if (file.size !== undefined && file.size > maxFileBytes) {
        return false;
    }
    return true;
}

export class LineWindowChunker implements CodeChunker {
    chunkFile(params: ChunkFileParams): CodeChunk[] {
        return chunkFileWithLineWindows(params).map((chunk) => ({
            ...chunk,
            chunker: "line-window",
        }));
    }

    fingerprint(options?: ChunkingOptions): string {
        return `line-window:v1:${chunkingOptionsFingerprint(options)}`;
    }
}

type CodeChunkerFactoryOptions = {
    mode?: CodeIndexerChunkerMode;
};

export function createCodeChunker(
    options: CodeChunkerFactoryOptions = {}
): CodeChunker {
    const mode = options.mode ?? "auto";
    if (mode === "line-window") {
        return new LineWindowChunker();
    }
    return new SmartChunker({
        mode,
        requireTreeSitter: mode === "tree-sitter",
    });
}

export function chunkFile(params: ChunkFileParams): CodeChunk[] {
    return defaultCodeChunker.chunkFile(params);
}

export function indexingFingerprintForChunker(
    chunker: CodeChunker,
    options?: ChunkingOptions
): string {
    return chunker.fingerprint?.(options) ?? `custom:v1:${chunkingOptionsFingerprint(options)}`;
}

function chunkFileWithLineWindows(params: ChunkFileParams & {
    baseStartLine?: number;
    chunkKind?: string;
    chunker?: string;
    symbolName?: string;
    symbolPath?: string;
}): CodeChunk[] {
    if (isProbablyBinaryContent(params.content)) {
        return [];
    }

    const chunkLines = normalizedChunkLines(params.options);
    const overlapLines = normalizedOverlapLines(params.options);
    const step = chunkLines - overlapLines;
    const lines = params.content.split(/\r?\n/);
    const chunks: CodeChunk[] = [];
    const baseStartLine = params.baseStartLine ?? 1;

    for (let start = 0; start < lines.length; start += step) {
        const endExclusive = Math.min(start + chunkLines, lines.length);
        const text = lines.slice(start, endExclusive).join("\n").trim();
        if (text.length > 0) {
            chunks.push({
                chunker: params.chunker,
                chunkIndex: chunks.length,
                chunkKind: params.chunkKind,
                endLine: baseStartLine + endExclusive - 1,
                language: languageForPath(params.path),
                path: params.path,
                pathSegments: pathSegmentsForPath(params.path),
                startLine: baseStartLine + start,
                symbolName: params.symbolName,
                symbolPath: params.symbolPath,
                text,
            });
        }
        if (endExclusive >= lines.length) {
            break;
        }
    }

    return chunks;
}

class SmartChunker implements CodeChunker {
    private readonly lineWindowChunker = new LineWindowChunker();
    private readonly mode: CodeIndexerChunkerMode;
    private readonly treeSitterChunker: TreeSitterChunker | null;

    constructor(params: {
        mode: Exclude<CodeIndexerChunkerMode, "line-window">;
        requireTreeSitter: boolean;
    }) {
        this.mode = params.mode;
        this.treeSitterChunker = loadTreeSitterChunker(params.requireTreeSitter);
    }

    chunkFile(params: ChunkFileParams): CodeChunk[] {
        const textChunks = chunkTextFile(params);
        if (textChunks) {
            return reindexChunks(textChunks);
        }

        if (this.treeSitterChunker?.supportsPath(params.path)) {
            const chunks = this.treeSitterChunker.chunkFile(params);
            if (chunks.length > 0) {
                return reindexChunks(chunks);
            }
        }

        return this.lineWindowChunker.chunkFile(params);
    }

    fingerprint(options?: ChunkingOptions): string {
        const registry = this.treeSitterChunker
            ? TREE_SITTER_REGISTRY_VERSION
            : "none";
        return `smart:v1:${this.mode}:${registry}:${chunkingOptionsFingerprint(options)}`;
    }
}

type TreeSitterParserConstructor = typeof import("tree-sitter");
type TreeSitterSyntaxNode = import("tree-sitter").SyntaxNode;

type TreeSitterLanguage = {
    language?: unknown;
    name?: string;
};

type LanguageRegistration = {
    extensions: string[];
    language: unknown;
    languageName: string;
    topLevelTypes: Set<string>;
};

type SemanticNode = {
    chunkKind: string;
    node: TreeSitterSyntaxNode;
    symbolName?: string;
};

const requireTreeSitterModule = createRequire(import.meta.url);
let warnedTreeSitterLoadFailure = false;

function loadTreeSitterChunker(requireTreeSitter: boolean): TreeSitterChunker | null {
    try {
        const Parser = requireTreeSitterModule(
            "tree-sitter"
        ) as TreeSitterParserConstructor;
        const js = requireTreeSitterModule(
            "tree-sitter-javascript"
        ) as TreeSitterLanguage;
        const ts = requireTreeSitterModule("tree-sitter-typescript") as {
            tsx: TreeSitterLanguage;
            typescript: TreeSitterLanguage;
        };
        const py = requireTreeSitterModule(
            "tree-sitter-python"
        ) as TreeSitterLanguage;
        const go = requireTreeSitterModule(
            "tree-sitter-go"
        ) as TreeSitterLanguage;
        const rust = requireTreeSitterModule(
            "tree-sitter-rust"
        ) as TreeSitterLanguage;

        return new TreeSitterChunker(Parser, [
            {
                extensions: [".js", ".jsx", ".mjs"],
                language: js,
                languageName: "JavaScript",
                topLevelTypes: new Set([
                    "class_declaration",
                    "export_statement",
                    "function_declaration",
                    "generator_function_declaration",
                    "import_statement",
                    "lexical_declaration",
                    "variable_declaration",
                ]),
            },
            {
                extensions: [".ts", ".mts"],
                language: ts.typescript,
                languageName: "TypeScript",
                topLevelTypes: new Set([
                    "abstract_class_declaration",
                    "class_declaration",
                    "enum_declaration",
                    "export_statement",
                    "function_declaration",
                    "generator_function_declaration",
                    "import_statement",
                    "interface_declaration",
                    "lexical_declaration",
                    "type_alias_declaration",
                    "variable_declaration",
                ]),
            },
            {
                extensions: [".tsx"],
                language: ts.tsx,
                languageName: "TypeScript",
                topLevelTypes: new Set([
                    "abstract_class_declaration",
                    "class_declaration",
                    "enum_declaration",
                    "export_statement",
                    "function_declaration",
                    "generator_function_declaration",
                    "import_statement",
                    "interface_declaration",
                    "lexical_declaration",
                    "type_alias_declaration",
                    "variable_declaration",
                ]),
            },
            {
                extensions: [".py"],
                language: py,
                languageName: "Python",
                topLevelTypes: new Set([
                    "class_definition",
                    "function_definition",
                    "future_import_statement",
                    "import_from_statement",
                    "import_statement",
                ]),
            },
            {
                extensions: [".go"],
                language: go,
                languageName: "Go",
                topLevelTypes: new Set([
                    "const_declaration",
                    "function_declaration",
                    "import_declaration",
                    "method_declaration",
                    "type_declaration",
                    "var_declaration",
                ]),
            },
            {
                extensions: [".rs"],
                language: rust,
                languageName: "Rust",
                topLevelTypes: new Set([
                    "const_item",
                    "enum_item",
                    "function_item",
                    "impl_item",
                    "mod_item",
                    "static_item",
                    "struct_item",
                    "trait_item",
                    "type_item",
                    "use_declaration",
                ]),
            },
        ]);
    } catch (err: unknown) {
        if (requireTreeSitter) {
            throw err;
        }
        if (!warnedTreeSitterLoadFailure) {
            warnedTreeSitterLoadFailure = true;
            logger.warn(
                { err },
                "Tree-sitter chunker unavailable, falling back to line-window chunking"
            );
        }
        return null;
    }
}

class TreeSitterChunker implements CodeChunker {
    private readonly languagesByExtension = new Map<string, LanguageRegistration>();
    private readonly Parser: TreeSitterParserConstructor;

    constructor(
        Parser: TreeSitterParserConstructor,
        registrations: LanguageRegistration[]
    ) {
        this.Parser = Parser;
        for (const registration of registrations) {
            for (const extension of registration.extensions) {
                this.languagesByExtension.set(extension, registration);
            }
        }
    }

    supportsPath(path: string): boolean {
        return this.languagesByExtension.has(extensionOf(path));
    }

    chunkFile(params: ChunkFileParams): CodeChunk[] {
        const registration = this.languagesByExtension.get(extensionOf(params.path));
        if (!registration || isProbablyBinaryContent(params.content)) {
            return [];
        }

        try {
            const parser = new this.Parser();
            parser.setLanguage(registration.language);
            const tree = parser.parse(params.content);
            if (tree.rootNode.hasError) {
                logger.warn(
                    { path: params.path },
                    "Tree-sitter parser reported errors, falling back to line-window chunking"
                );
                return new LineWindowChunker().chunkFile(params);
            }
            const semanticNodes = collectSemanticNodes(
                tree.rootNode,
                registration.topLevelTypes
            );
            if (semanticNodes.length === 0) {
                return new LineWindowChunker().chunkFile(params);
            }

            const chunks = semanticNodes.flatMap((semanticNode) =>
                chunkSemanticNode(params, registration.languageName, semanticNode)
            );
            return chunks.length > 0
                ? reindexChunks(chunks)
                : new LineWindowChunker().chunkFile(params);
        } catch (err: unknown) {
            logger.warn(
                { err, path: params.path },
                "Tree-sitter chunking failed, falling back to line-window chunking"
            );
            return new LineWindowChunker().chunkFile(params);
        }
    }

    fingerprint(options?: ChunkingOptions): string {
        return `tree-sitter:${TREE_SITTER_REGISTRY_VERSION}:${chunkingOptionsFingerprint(options)}`;
    }
}

function collectSemanticNodes(
    root: TreeSitterSyntaxNode,
    topLevelTypes: Set<string>
): SemanticNode[] {
    const nodes: SemanticNode[] = [];
    for (const child of root.namedChildren) {
        const node = semanticNodeForTopLevelChild(child, topLevelTypes);
        if (node) {
            nodes.push(node);
        }
    }
    return nodes;
}

function semanticNodeForTopLevelChild(
    child: TreeSitterSyntaxNode,
    topLevelTypes: Set<string>
): SemanticNode | null {
    if (!topLevelTypes.has(child.type)) {
        return null;
    }
    const wrapped = child.type === "export_statement" ? firstSemanticChild(child) : null;
    const symbolNode = wrapped ?? child;
    return {
        chunkKind: chunkKindForNode(symbolNode),
        node: child,
        symbolName: symbolNameForNode(symbolNode),
    };
}

function firstSemanticChild(node: TreeSitterSyntaxNode): TreeSitterSyntaxNode | null {
    return (
        node.namedChildren.find(
            (child) =>
                ![
                    "decorator",
                    "export_clause",
                    "namespace_export",
                    "string",
                ].includes(child.type)
        ) ?? null
    );
}

function chunkKindForNode(node: TreeSitterSyntaxNode): string {
    if (
        [
            "import_declaration",
            "import_from_statement",
            "import_statement",
            "future_import_statement",
            "use_declaration",
        ].includes(node.type)
    ) {
        return "import";
    }
    if (
        [
            "class_declaration",
            "abstract_class_declaration",
            "class_definition",
        ].includes(node.type)
    ) {
        return "class";
    }
    if (
        [
            "function_declaration",
            "function_definition",
            "function_item",
            "generator_function_declaration",
        ].includes(node.type)
    ) {
        return "function";
    }
    if (node.type === "method_declaration") {
        return "method";
    }
    if (node.type.includes("interface")) {
        return "interface";
    }
    if (node.type.includes("trait")) {
        return "trait";
    }
    if (node.type.includes("enum")) {
        return "enum";
    }
    if (node.type.includes("struct")) {
        return "struct";
    }
    if (node.type.includes("impl")) {
        return "impl";
    }
    if (node.type.includes("type")) {
        return "type";
    }
    if (
        [
            "const_declaration",
            "const_item",
            "lexical_declaration",
            "static_item",
            "var_declaration",
            "variable_declaration",
        ].includes(node.type)
    ) {
        return "declaration";
    }
    return "code";
}

function symbolNameForNode(node: TreeSitterSyntaxNode): string | undefined {
    const nameNode =
        node.childForFieldName("name") ??
        node.childForFieldName("type") ??
        node.namedChildren
            .flatMap((child) => [
                child.childForFieldName("name"),
                child.childForFieldName("type"),
            ])
            .find((child): child is TreeSitterSyntaxNode => child !== null) ??
        node.namedChildren.find((child) =>
            [
                "field_identifier",
                "identifier",
                "package_identifier",
                "property_identifier",
                "type_identifier",
            ].includes(child.type)
        );
    return nameNode?.text;
}

function chunkSemanticNode(
    params: ChunkFileParams,
    language: string,
    semanticNode: SemanticNode
): CodeChunk[] {
    const text = sliceByUtf8Bytes(
        params.content,
        semanticNode.node.startIndex,
        semanticNode.node.endIndex
    ).trim();
    if (!text) {
        return [];
    }
    const maxChunkChars = normalizedMaxChunkChars(params.options);
    if (text.length > maxChunkChars) {
        return chunkFileWithLineWindows({
            content: text,
            options: params.options,
            path: params.path,
            baseStartLine: semanticNode.node.startPosition.row + 1,
            chunkKind: semanticNode.chunkKind,
            chunker: "tree-sitter",
            symbolName: semanticNode.symbolName,
            symbolPath: semanticNode.symbolName,
        });
    }
    return [
        {
            chunker: "tree-sitter",
            chunkIndex: 0,
            chunkKind: semanticNode.chunkKind,
            endLine: semanticNode.node.endPosition.row + 1,
            language,
            path: params.path,
            pathSegments: pathSegmentsForPath(params.path),
            startLine: semanticNode.node.startPosition.row + 1,
            symbolName: semanticNode.symbolName,
            symbolPath: semanticNode.symbolName,
            text,
        },
    ];
}

function sliceByUtf8Bytes(content: string, startByte: number, endByte: number): string {
    return Buffer.from(content, "utf8")
        .subarray(startByte, endByte)
        .toString("utf8");
}

function chunkTextFile(params: ChunkFileParams): CodeChunk[] | null {
    const extension = extensionOf(params.path);
    if (extension === ".md" || extension === ".mdx") {
        return chunkMarkdownFile(params);
    }
    if (
        extension === ".txt" ||
        extension === ".rst" ||
        extension === ".adoc" ||
        extension === ".asciidoc"
    ) {
        return chunkParagraphTextFile(params, "text-section");
    }
    return null;
}

function chunkMarkdownFile(params: ChunkFileParams): CodeChunk[] {
    if (isProbablyBinaryContent(params.content)) {
        return [];
    }
    const lines = params.content.split(/\r?\n/);
    const sections: Array<{ heading?: string; lines: string[]; startLine: number }> =
        [];
    let current: { heading?: string; lines: string[]; startLine: number } | null =
        null;
    let inFence = false;

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
        }
        const headingMatch = inFence ? null : /^(#{1,6})\s+(.+)$/.exec(line);
        if (headingMatch) {
            if (current) {
                sections.push(current);
            }
            current = {
                heading: headingMatch[2].trim(),
                lines: [line],
                startLine: index + 1,
            };
            continue;
        }
        if (!current) {
            current = { lines: [], startLine: index + 1 };
        }
        current.lines.push(line);
    }
    if (current) {
        sections.push(current);
    }

    return chunksFromTextSections(
        params,
        sections.map((section) => ({
            chunkKind: "markdown-section",
            lines: section.lines,
            startLine: section.startLine,
            symbolName: section.heading,
        })),
        "markdown"
    );
}

function chunkParagraphTextFile(
    params: ChunkFileParams,
    chunkKind: string
): CodeChunk[] {
    if (isProbablyBinaryContent(params.content)) {
        return [];
    }
    const lines = params.content.split(/\r?\n/);
    const sections: Array<{ lines: string[]; startLine: number }> = [];
    let current: { lines: string[]; startLine: number } | null = null;

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.trim().length === 0) {
            if (current) {
                sections.push(current);
                current = null;
            }
            continue;
        }
        if (!current) {
            current = { lines: [], startLine: index + 1 };
        }
        current.lines.push(line);
    }
    if (current) {
        sections.push(current);
    }

    return chunksFromTextSections(
        params,
        sections.map((section) => ({
            chunkKind,
            lines: section.lines,
            startLine: section.startLine,
        })),
        "text"
    );
}

function chunksFromTextSections(
    params: ChunkFileParams,
    sections: Array<{
        chunkKind: string;
        lines: string[];
        startLine: number;
        symbolName?: string;
    }>,
    chunker: string
): CodeChunk[] {
    const maxChunkChars = normalizedMaxChunkChars(params.options);
    const chunks: CodeChunk[] = [];
    for (const section of sections) {
        const text = section.lines.join("\n").trim();
        if (!text) {
            continue;
        }
        if (text.length > maxChunkChars) {
            chunks.push(
                ...chunkFileWithLineWindows({
                    content: text,
                    options: params.options,
                    path: params.path,
                    baseStartLine: section.startLine,
                    chunkKind: section.chunkKind,
                    chunker,
                    symbolName: section.symbolName,
                    symbolPath: section.symbolName,
                })
            );
            continue;
        }
        chunks.push({
            chunker,
            chunkIndex: chunks.length,
            chunkKind: section.chunkKind,
            endLine: section.startLine + section.lines.length - 1,
            language: languageForPath(params.path),
            path: params.path,
            pathSegments: pathSegmentsForPath(params.path),
            startLine: section.startLine,
            symbolName: section.symbolName,
            symbolPath: section.symbolName,
            text,
        });
    }
    return reindexChunks(chunks);
}

function reindexChunks(chunks: CodeChunk[]): CodeChunk[] {
    return chunks
        .filter((chunk) => chunk.text.trim().length > 0)
        .map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

export const defaultCodeChunker = createCodeChunker();
