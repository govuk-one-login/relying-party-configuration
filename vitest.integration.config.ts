import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["integration-tests/*.ts"],
    expect: {
      requireAssertions: true,
    },
    coverage: {
      include: ["integration-tests/*.ts"],
      reporter: ["lcov", "text"],
    },
    globals: true,
  },
});
