import { describe, it, expect } from "vitest";
import {
    extractPathPrefix,
    normalizePathSegments,
    pathSegmentsToPrefix,
} from "../../src/utils/pathPrefix.js";

describe("normalizePathSegments", () => {
    it("returns array pathSegments as-is", () => {
        expect(normalizePathSegments(["src", "components", "Button.tsx"])).toEqual(
            ["src", "components", "Button.tsx"]
        );
    });

    it("normalizes object pathSegments with numeric keys", () => {
        expect(
            normalizePathSegments({
                2: "Button.tsx",
                0: "src",
                1: "components",
            })
        ).toEqual(["src", "components", "Button.tsx"]);
    });

    it("returns null for empty object", () => {
        expect(normalizePathSegments({})).toBeNull();
    });

    it("returns null for non-numeric keys", () => {
        expect(
            normalizePathSegments({
                foo: "src",
                0: "components",
            })
        ).toBeNull();
    });

    it("returns null for gaps in numeric keys", () => {
        expect(
            normalizePathSegments({
                0: "src",
                2: "Button.tsx",
            })
        ).toBeNull();
    });

    it("returns null for non-string values", () => {
        expect(
            normalizePathSegments({
                0: "src",
                1: 42,
            })
        ).toBeNull();
    });
});

describe("extractPathPrefix", () => {
    it("extracts path from array pathSegments", () => {
        const payload = {
            pathSegments: ["src", "components", "Button.tsx"],
        };
        expect(extractPathPrefix(payload)).toBe("src/components/Button.tsx");
    });

    it("extracts path from object pathSegments with numeric keys", () => {
        const payload = {
            pathSegments: {
                2: "Button.tsx",
                0: "src",
                1: "components",
            },
        };
        expect(extractPathPrefix(payload)).toBe("src/components/Button.tsx");
    });

    it("returns null for undefined payload", () => {
        expect(extractPathPrefix(undefined)).toBeNull();
    });

    it("returns null when pathSegments is missing", () => {
        expect(extractPathPrefix({ foo: "bar" })).toBeNull();
    });

    it("returns null when pathSegments is neither array nor object", () => {
        expect(extractPathPrefix({ pathSegments: "not-array" })).toBeNull();
        expect(extractPathPrefix({ pathSegments: 123 })).toBeNull();
        expect(extractPathPrefix({ pathSegments: null })).toBeNull();
    });

    it("returns null for empty array", () => {
        expect(extractPathPrefix({ pathSegments: [] })).toBeNull();
    });

    it("returns null when array contains non-string elements", () => {
        const payload = {
            pathSegments: ["src", "components", 42, "Button.tsx"],
        };
        expect(extractPathPrefix(payload)).toBeNull();
    });

    it("returns null when object pathSegments has gaps", () => {
        const payload = {
            pathSegments: {
                0: "src",
                2: "Button.tsx",
            },
        };
        expect(extractPathPrefix(payload)).toBeNull();
    });

    it("handles single-segment path", () => {
        expect(
            extractPathPrefix({ pathSegments: ["README.md"] })
        ).toBe("README.md");
    });

    it("handles deeply nested paths", () => {
        const segs = ["a", "b", "c", "d", "e", "f.ts"];
        expect(extractPathPrefix({ pathSegments: segs })).toBe(
            "a/b/c/d/e/f.ts"
        );
    });

    it("encodes slash-containing segments losslessly", () => {
        expect(
            extractPathPrefix({ pathSegments: ["src/hooks", "Button.tsx"] })
        ).toBe("src%2Fhooks/Button.tsx");
    });
});

describe("pathSegmentsToPrefix", () => {
    it("joins segments with /", () => {
        expect(pathSegmentsToPrefix(["src", "hooks", "use.ts"])).toBe(
            "src/hooks/use.ts"
        );
    });

    it("returns empty string for empty array", () => {
        expect(pathSegmentsToPrefix([])).toBe("");
    });

    it("handles single segment", () => {
        expect(pathSegmentsToPrefix(["file.ts"])).toBe("file.ts");
    });

    it("distinguishes embedded slash from path delimiter", () => {
        expect(pathSegmentsToPrefix(["src/hooks"])).toBe("src%2Fhooks");
        expect(pathSegmentsToPrefix(["src", "hooks"])).toBe("src/hooks");
        expect(pathSegmentsToPrefix(["src/hooks"])).not.toBe(
            pathSegmentsToPrefix(["src", "hooks"])
        );
    });

    it("supports descendant prefix matching with encoded segments", () => {
        const parent = pathSegmentsToPrefix(["src/hooks"]);
        const child = pathSegmentsToPrefix(["src/hooks", "use.ts"]);
        expect(child.startsWith(`${parent}/`)).toBe(true);
    });
});
