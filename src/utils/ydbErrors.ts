export function isOutOfBufferMemoryYdbError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    if (/Out of buffer memory/i.test(msg)) {
        return true;
    }

    if (typeof error === "object" && error !== null && "issues" in error) {
        const issues = error.issues;
        if (issues !== undefined) {
            const issuesText =
                typeof issues === "string" ? issues : JSON.stringify(issues);
            return /Out of buffer memory/i.test(issuesText);
        }
    }

    return false;
}
