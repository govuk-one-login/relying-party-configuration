import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import playwrightEslint from "eslint-plugin-playwright";

export default defineConfig(
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns"
  ),
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
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
  }
);
