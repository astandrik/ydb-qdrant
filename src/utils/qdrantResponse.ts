/**
 * Qdrant-compatible response envelope.
 *
 * Every Qdrant REST response includes `{ status, result, time, usage }`.
 * This helper produces that shape, measuring elapsed wall-clock time
 * from a previously captured `process.hrtime()` start mark.
 */
export function qdrantResponse(
    result: unknown,
    startHrTime: [number, number]
): { status: "ok"; result: unknown; time: number; usage: null } {
    const diff = process.hrtime(startHrTime);
    const time = diff[0] + diff[1] / 1e9;
    return { status: "ok", result, time, usage: null };
}
