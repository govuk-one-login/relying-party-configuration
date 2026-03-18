import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  includeIgnoreFile(
    fileURLToPath(new URL(".gitignore", import.meta.url)),
    "Imported .gitignore patterns"
  ),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    ignores: ["eslint.config.ts", "vitest.config.ts"],
  }
);
