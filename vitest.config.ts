import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing (React components)
    environment: "jsdom",

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Setup files run before each test file
    setupFiles: ["./tests/setup/vitest.setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/env.d.ts",
        "src/db/database.types.ts", // Generated types
      ],
      // Coverage thresholds for critical paths
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },

    // Test file patterns
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "e2e"],

    // Timeout for tests
    testTimeout: 10000,

    // UI mode configuration
    ui: true,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
