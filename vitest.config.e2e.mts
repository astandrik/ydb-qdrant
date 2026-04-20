import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/e2e/**/*.test.ts"],
        testTimeout: 60_000,
        reporters: ["verbose", "junit"],
        outputFile: { junit: "test-results/junit-e2e.xml" },
    },
});
