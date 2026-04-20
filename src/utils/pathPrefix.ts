function isNumericPathSegmentKey(key: string): boolean {
    return /^(0|[1-9]\d*)$/.test(key);
}

export function normalizePathSegments(value: unknown): string[] | null {
    if (Array.isArray(value)) {
        if (value.length === 0) return null;
        const normalized: string[] = [];
        for (const segment of value) {
            if (typeof segment !== "string") return null;
            normalized.push(segment);
        }
        return normalized;
    }

    if (typeof value !== "object" || value === null) {
        return null;
    }

    const entries = Object.entries(value);
    if (entries.length === 0) {
        return null;
    }

    const indexedSegments: Array<{ index: number; value: string }> = [];
    for (const [key, segment] of entries) {
        if (!isNumericPathSegmentKey(key) || typeof segment !== "string") {
            return null;
        }
        indexedSegments.push({ index: Number(key), value: segment });
    }

    indexedSegments.sort((left, right) => left.index - right.index);
    for (let index = 0; index < indexedSegments.length; index += 1) {
        if (indexedSegments[index]?.index !== index) {
            return null;
        }
    }

    return indexedSegments.map((segment) => segment.value);
}

export function extractPathPrefix(
    payload: Record<string, unknown> | undefined
): string | null {
    const pathSegments = normalizePathSegments(payload?.pathSegments);
    if (!pathSegments) {
        return null;
    }
    return pathSegmentsToPrefix(pathSegments);
}

export function pathSegmentsToPrefix(segments: string[]): string {
    return segments.map(encodeURIComponent).join("/");
}
