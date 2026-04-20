import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"],
        exclude: ["test/e2e/**", "test/perf/**"],
        setupFiles: ["test/VitestSetup.ts"],
        reporters: ["verbose", "junit"],
        outputFile: { junit: "test-results/junit.xml" },
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            reportsDirectory: "./coverage",
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.d.ts"],
        },
    },
});
