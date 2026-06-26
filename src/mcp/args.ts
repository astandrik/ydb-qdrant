import { isRecord } from "./protocol.js";

export function argumentsObject(args: unknown): Record<string, unknown> {
    if (!isRecord(args)) {
        throw new Error("arguments must be an object");
    }
    return args;
}

export function readString(
    args: Record<string, unknown>,
    name: string
): string {
    const value = args[name];
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${name} is required`);
    }
    return value.trim();
}

export function readOptionalBoolean(
    args: Record<string, unknown>,
    name: string
): boolean | undefined {
    const value = args[name];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`${name} must be a boolean`);
    }
    return value;
}

export function readTop(args: Record<string, unknown>): number {
    const value = args.top;
    if (value === undefined) {
        return 10;
    }
    if (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value <= 0 ||
        value > 1000
    ) {
        throw new Error("top must be a positive integer no greater than 1000");
    }
    return value;
}

export function readNumberArray(
    args: Record<string, unknown>,
    name: string
): number[] {
    const value = args[name];
    if (
        !Array.isArray(value) ||
        value.length === 0 ||
        !value.every((item) => typeof item === "number")
    ) {
        throw new Error(`${name} must be a non-empty number array`);
    }
    return value;
}

export function readIdArray(
    args: Record<string, unknown>,
    name: string
): Array<string | number> {
    const value = args[name];
    if (
        !Array.isArray(value) ||
        value.length === 0 ||
        !value.every(
            (item) => typeof item === "string" || typeof item === "number"
        )
    ) {
        throw new Error(`${name} must be a non-empty id array`);
    }
    return value;
}
