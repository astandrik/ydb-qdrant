// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

// Type-aware ESLint config based on the official typescript-eslint flat config quickstart:
// https://typescript-eslint.io/getting-started/typed-linting
export default defineConfig(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.eslint.json",
        // Resolve tsconfig relative to this config file so it works in CI as well
        tsconfigRootDir: new URL(".", import.meta.url).pathname,
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
);

