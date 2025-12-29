import { vi, type Mock } from "vitest";

export type PlannedRun<T> = { result?: T; error?: Error };

export type QueryMock<T> = (() => Promise<T>) & {
  /**
   * Captured parameters set via `.parameter(name, value)`.
   * Note: some code uses `$name` style while others use `name`.
   */
  params: Record<string, unknown>;
  parameter: Mock;
  idempotent: Mock;
  timeout: Mock;
  signal: Mock;
  then: PromiseLike<T>["then"];
};

export type SqlTagMock = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => QueryMock<unknown>) & {
  unsafe: (value: string) => string;
  identifier: (value: string) => string;
};

function createQueryMock<T>(
  plannedRuns: Array<PlannedRun<T>>,
  defaultResult: T
): QueryMock<T> {
  const params: Record<string, unknown> = {};

  const q = (() => {
    const next = plannedRuns.shift() ?? { result: defaultResult };
    if (next.error) return Promise.reject(next.error);
    return Promise.resolve(next.result ?? defaultResult);
  }) as QueryMock<T>;

  q.params = params;
  q.parameter = vi.fn((key: string, value: unknown) => {
    params[key] = value;
    return q;
  });
  q.idempotent = vi.fn(() => q);
  q.timeout = vi.fn(() => q);
  q.signal = vi.fn(() => q);
  q.then = (onFulfilled, onRejected) => q().then(onFulfilled, onRejected);
  return q;
}

export function createSqlHarness(): {
  sql: SqlTagMock;
  calls: Array<{ yql: string; query: QueryMock<unknown> }>;
  plan: (runs: Array<PlannedRun<unknown>>) => void;
} {
  const calls: Array<{ yql: string; query: QueryMock<unknown> }> = [];
  const plannedQueries: Array<Array<PlannedRun<unknown>>> = [];
  const defaultResult: unknown = [[]];

  function renderYql(strings: TemplateStringsArray, values: unknown[]): string {
    // Normal tagged templates provide SQL in `strings`, with interpolations in `values`.
    // Some code uses: sql`${sql.unsafe(yql)}` which becomes strings=["", ""] and values=[yql].
    let out = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) {
      out += String(values[i]);
      out += strings[i + 1] ?? "";
    }
    return out;
  }

  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    const yql = renderYql(strings, values);

    const runs = plannedQueries.shift() ?? [{ result: [[]] }];
    const query = createQueryMock(runs, defaultResult);
    calls.push({ yql, query });
    return query;
  }) as SqlTagMock;

  sql.unsafe = (value: string) => value;
  sql.identifier = (value: string) => value;

  return {
    sql,
    calls,
    plan: (runs: Array<PlannedRun<unknown>>) => plannedQueries.push(runs),
  };
}

export function getQueryParam(
  query: QueryMock<unknown>,
  ...names: Array<string | RegExp>
): unknown {
  // direct map (preferred)
  for (const name of names) {
    if (typeof name === "string") {
      if (Object.prototype.hasOwnProperty.call(query.params, name)) {
        return query.params[name];
      }
    } else {
      for (const [k, v] of Object.entries(query.params)) {
        if (name.test(k)) return v;
      }
    }
  }

  // fallback: parameter() call history
  const calls = query.parameter.mock.calls as Array<[string, unknown]>;
  for (const name of names) {
    if (typeof name === "string") {
      const hit = calls.find(([k]) => k === name);
      if (hit) return hit[1];
    } else {
      const hit = calls.find(([k]) => name.test(k));
      if (hit) return hit[1];
    }
  }

  return undefined;
}

function maybeEncode(value: unknown): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  // Only call encode() for values that structurally look like real @ydbjs/value
  // instances (encode() + type.encode()). If encode() throws, that's unexpected
  // and should fail the test instead of being silently swallowed.
  const v = value as { encode?: unknown; type?: unknown };
  if (typeof v.encode !== "function") {
    return value;
  }
  const t = v.type as { encode?: unknown } | undefined;
  if (!t || typeof t !== "object" || typeof t.encode !== "function") {
    return value;
  }

  return (v.encode as () => unknown).call(value);
}

/**
 * Extract a protobuf "text-like" leaf value (Utf8/Bytes) from various `@ydbjs/value`
 * / `@bufbuild/protobuf` initialization shapes used in our mocks.
 *
 * @param depth - Internal recursion depth guard; limits nesting to avoid infinite
 * loops on unexpected/cyclic structures. The limit (4) matches the deepest
 * nesting we see in practice: `{ value: { value: { case, value } } }`.
 */
function extractTextValue(value: unknown, depth = 0): string | undefined {
  if (depth > 4) return undefined;
  if (typeof value !== "object" || value === null) return undefined;

  const v = value as { case?: unknown; value?: unknown };
  if (v.case === "textValue" && typeof v.value === "string") return v.value;
  if (v.case === "bytesValue" && typeof v.value === "string") return v.value;

  // protobuf init shapes often nest as { value: { case, value } }
  if (v.value && typeof v.value === "object") {
    return extractTextValue(v.value, depth + 1);
  }

  return undefined;
}

export function decodeUtf8(value: unknown): string | undefined {
  const encoded = maybeEncode(value);
  const direct = extractTextValue(encoded);
  if (direct !== undefined) return direct;

  // handle Primitive wrapper instance structurally
  if (typeof value === "object" && value !== null && "value" in value) {
    return extractTextValue((value as { value?: unknown }).value);
  }

  return undefined;
}

export function decodeUtf8List(value: unknown): string[] {
  const v = maybeEncode(value);

  const items =
    (v as { items?: unknown[]; value?: { items?: unknown[] } } | null)?.items ??
    (v as { value?: { items?: unknown[] } } | null)?.value?.items;

  if (!Array.isArray(items)) return [];

  return items
    .map((it) => decodeUtf8(it))
    .filter((s): s is string => typeof s === "string");
}
