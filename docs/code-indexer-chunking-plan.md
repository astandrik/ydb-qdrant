# Code Indexer Chunking Plan

## Summary

Current code indexing uses `LineWindowChunker`: it filters files, detects language from path, and splits content into deterministic overlapping line windows. This is stable and easy to reason about, but it can split functions, classes, or documentation sections in the middle.

The next version should add a `SmartChunker` that routes files to specialized chunkers:

- Tree-sitter-based AST chunking for core programming languages.
- Text-aware chunking for Markdown and plain text.
- Existing line-window chunking as the universal fallback.

This keeps the current `CodeChunker` boundary and avoids changing the Qdrant-compatible API.

## Research Notes

- Tree-sitter is the best base layer for code chunking because it builds concrete syntax trees and has parsers for common languages.
- LangChain JS has code splitters through `RecursiveCharacterTextSplitter.fromLanguage()`, but this is separator-based rather than AST-aware and `@langchain/textsplitters@1.0.1` currently requires Node.js `>=20`.
- LlamaIndex TS has a `CodeSplitter` abstraction over parser usage, but it brings the LlamaIndex runtime and peer dependency surface.
- Ready-made multi-language wrappers exist, but most bring broad grammar/runtime dependencies and their own metadata model. A small local registry is more predictable for this service.

References:

- Tree-sitter docs: https://tree-sitter.github.io/tree-sitter/
- LangChain JS code splitter docs: https://docs.langchain.com/oss/javascript/integrations/splitters/code_splitter
- LlamaIndex TS `CodeSplitterParam`: https://next.ts.llamaindex.ai/docs/api/type-aliases/CodeSplitterParam

## Key Changes

Add `SmartChunker` as the default code-indexer chunker:

- Route supported code files to `TreeSitterChunker`.
- Route Markdown and plain text files to text-aware chunkers.
- Route unsupported files and parser failures to `LineWindowChunker`.

Supported AST languages in v1:

- JavaScript: `.js`, `.jsx`, `.mjs`
- TypeScript: `.ts`, `.tsx`, `.mts`
- Python: `.py`
- Go: `.go`
- Rust: `.rs`

Add compatible Tree-sitter dependencies through npm:

- `tree-sitter@0.21.1`
- `tree-sitter-javascript@0.23.1`
- `tree-sitter-typescript@0.23.2`
- `tree-sitter-python@0.23.4`
- `tree-sitter-go@0.23.4`
- `tree-sitter-rust@0.23.1`

This pinned set avoids the current peer dependency split where some latest grammar packages expect `tree-sitter@0.25.x` while Rust still expects `0.22.x`.

Add config:

- `CODE_INDEXER_CHUNKER=auto|line-window|tree-sitter`
- `CODE_INDEXER_MAX_CHUNK_CHARS`, default `8000`

Recommended defaults:

- `auto` in runtime config.
- `LineWindowChunker` remains the exported low-risk fallback.
- Repository config may override chunk sizing, but not force parser dependencies to load.

## Chunking Behavior

Code files:

- Emit chunks around top-level symbols where possible: functions, classes, methods, interfaces, type aliases, enums, structs, traits, impl blocks, and module-level declarations.
- Keep chunks deterministic by source order.
- Preserve existing required fields: `path`, `pathSegments`, `language`, `startLine`, `endLine`, `chunkIndex`, `text`.
- Add optional payload metadata as additive fields: `chunkKind`, `symbolName`, `symbolPath`, `chunker`.
- If a semantic node is too large, split that node with the existing line-window algorithm.

Markdown and text:

- Markdown/MDX: split by headings first, preserve fenced code blocks, then split oversized sections by paragraphs/line windows.
- Plain text/RST/AsciiDoc: split by paragraph groups, then line-window fallback for oversized sections.
- JSON/YAML/TOML stay on line-window in v1 to keep scope controlled.

Fallback rules:

- Unsupported extension: line-window.
- Parser load failure in `auto`: log warning once and use line-window.
- Parser load failure in `tree-sitter`: fail fast at startup.
- Parser errors in one file: log file-level warning and use line-window for that file.

## Index Consistency

Changing chunking strategy changes point ids because point ids include `chunkIndex`. Avoid mixed indexes by adding an indexing fingerprint to the repo manifest.

Fingerprint should include:

- chunker mode;
- enabled language registry version;
- `chunkLines`;
- `overlapLines`;
- `maxChunkChars`;
- `maxFileBytes`.

Behavior:

- Full index saves the fingerprint.
- Incremental push compares current fingerprint with manifest fingerprint.
- Missing legacy fingerprint or mismatch triggers full reindex with reason `indexing-fingerprint-changed`.
- No YDB table migration is required because manifests are stored as JSON payloads.

## Implementation Plan

1. Extend types and config.
   - Add `maxChunkChars` to `ChunkingOptions`.
   - Add chunker mode parsing to code-indexer config.
   - Keep validation strict and fail with clear env error messages.

2. Add chunker registry.
   - Introduce `SmartChunker`.
   - Introduce `TreeSitterChunker`.
   - Register JS/TS/Python/Go/Rust grammars by extension.
   - Load native parser modules lazily with `createRequire()`.

3. Add text chunkers.
   - Add Markdown section splitter.
   - Add plain-text paragraph splitter.
   - Reuse line-window fallback for oversized sections.

4. Add manifest fingerprinting.
   - Extend `RepoIndexManifest` with optional `indexingFingerprint`.
   - Save fingerprint on full and PR indexes.
   - Trigger full reindex when incremental manifest is missing or stale.

5. Wire runtime.
   - Create chunker from config in `src/code-indexer/index.ts`.
   - Pass the selected chunker into `RepoIndexer`.
   - Keep tests able to inject custom `CodeChunker`.

6. Update docs.
   - Document modes, defaults, supported languages, fallback behavior, and full reindex semantics.

## Test Plan

Unit tests:

- Existing line-window tests still pass.
- JS/TS files split by function/class/interface/type-level boundaries.
- Python files split by function/class boundaries.
- Go files split by function/type/method boundaries.
- Rust files split by function/struct/enum/trait/impl boundaries.
- Markdown splits by headings and preserves fenced code blocks.
- Plain text splits by paragraph groups.
- Malformed code falls back safely.
- Oversized semantic node falls back to line-window with correct line ranges.

Indexer tests:

- `RepoIndexer` saves indexing fingerprint on full index.
- Incremental push with matching fingerprint stays incremental.
- Incremental push with legacy or mismatched fingerprint triggers full index.
- Parser fallback does not skip otherwise indexable files.

Verification commands:

```bash
npm run typecheck
npm run lint
npm test
npx vitest run test/code-indexer
```

## Assumptions

- Scope is limited to GitHub App code indexing.
- Main Qdrant-compatible HTTP API and YDB point schema remain unchanged.
- Native parser dependencies are acceptable for the code-indexer service image.
- Additional languages should be added through the registry with extractor tests, not by replacing the chunking architecture.
