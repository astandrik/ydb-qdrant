---
applyTo: "src/**/*.ts,test/**/*.ts"
---

## TypeScript implementation guidelines

**Layer structure** (follow this order for new functionality):
1. Routes (`src/routes/`) – thin HTTP handlers, delegate to services immediately.
2. Services (`src/services/`) – business logic, validation via Zod schemas from `types.ts`.
3. Repositories (`src/repositories/`) – YDB data access; use `withSession` and `withRetry`.
4. YDB helpers (`src/ydb/`) – low-level driver utilities and schema migrations.

**Adding a new endpoint**:
- Add route handler in `src/routes/collections.ts` or `src/routes/points.ts`.
- Implement logic in the appropriate service (`CollectionService` or `PointsService`).
- If new YDB queries are needed, add repository functions and use existing helpers.
- Add corresponding tests under `test/routes/`, `test/services/`, or `test/repositories/`.

**YDB access patterns**:
- Always use `withSession(async (session) => { ... })` for queries.
- Wrap transient-error-prone operations with `withRetry`.
- Declare YQL parameters with `DECLARE` and pass via `TypedValues`.
- Vector serialization uses `Knn::ToBinaryStringFloat` / `Knn::ToBinaryStringBit`; see existing upsert/search code.

**Testing conventions**:
- Mock YDB and services in unit tests; see existing mocks in `test/` for patterns.
- Integration tests (`test/integration/`) run against real YDB; they require env credentials.
- Prefer extending existing test files over creating new ones for closely related behavior.

**Code style**:
- Explicit types; avoid `any`.
- Small, focused functions; no nested ternaries.
- Use existing utilities (`src/utils/`) before adding new helpers.
- Keep imports direct (no barrel `index.ts` re-exports).
