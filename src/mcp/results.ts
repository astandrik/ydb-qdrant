import type { YdbQdrantMcpCollectionSummary } from "./types.js";

export function toolResult(
    text: string,
    structuredContent: Record<string, unknown>
) {
    return {
        content: [
            {
                text,
                type: "text",
            },
        ],
        structuredContent,
    };
}

export function toolErrorResult(message: string) {
    return {
        content: [
            {
                text: message,
                type: "text",
            },
        ],
        isError: true,
    };
}

export function pointsText(collection: string, points: unknown[]): string {
    return `${collection}: ${points.length} point${points.length === 1 ? "" : "s"}`;
}

export function collectionSummaryText(
    collections: YdbQdrantMcpCollectionSummary[]
): string {
    if (collections.length === 0) {
        return "No collections found in the configured MCP namespace.";
    }
    const lines = ["Collections:"];
    collections.forEach((collection, index) => {
        const details = [
            `vectorSize=${collection.vectorSize}`,
            `distance=${collection.distance}`,
            `vectorType=${collection.vectorType}`,
            collection.pointsCount === undefined
                ? undefined
                : `points=${collection.pointsCount}`,
        ].filter((item): item is string => Boolean(item));
        lines.push(`${index + 1}. ${collection.name} ${details.join(" ")}`);
    });
    return lines.join("\n");
}
