export function parseBooleanEnv(
    value: string | undefined,
    defaultValue: boolean
): boolean {
    if (value === undefined) {
        return defaultValue;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
        return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
        return false;
    }
    return defaultValue;
}

export function parseIntegerEnv(
    value: string | undefined,
    defaultValue: number,
    opts?: { min?: number; max?: number }
): number {
    if (value === undefined) {
        return defaultValue;
    }
    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(parsed)) {
        return defaultValue;
    }
    let result = parsed;
    if (opts?.min !== undefined && result < opts.min) {
        result = opts.min;
    }
    if (opts?.max !== undefined && result > opts.max) {
        result = opts.max;
    }
    return result;
}
