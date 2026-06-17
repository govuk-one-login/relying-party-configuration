import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import playwrightEslint from "eslint-plugin-playwright";

export default defineConfig(
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns",
  ),
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
    },
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: [
      "src/setup-unit-tests.ts",
      "src/**/*.test.ts",
      "src/**/*.test.js",
      "integration-tests/*.test.ts",
    ],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "@typescript-eslint/no-empty-function": "off",
    },
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    ...playwrightEslint.configs["flat/recommended"],
    files: ["acceptance-tests/tests/**"],
    rules: {
      ...playwrightEslint.configs["flat/recommended"].rules,
      "playwright/no-standalone-expect": "off",
    },
  },
  {
    ignores: [
      "eslint.config.ts",
      "vitest.config.ts",
      "acceptance-tests/playwright.config.ts",
    ],
  },
);
