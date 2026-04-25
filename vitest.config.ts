import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadAppBuildMetadata } from "./scripts/app-build-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildMetadata = loadAppBuildMetadata(__dirname);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildMetadata.appVersion),
    __APP_COMMIT_SHA__: JSON.stringify(buildMetadata.commitSha),
    __APP_BUILD_TIMESTAMP__: JSON.stringify(buildMetadata.buildTimestamp),
  },
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom", // or "node" if you're not testing DOM
    setupFiles: "./src/setupTests.ts",
    testTimeout: 15_000, // give extra time for real connections
    hookTimeout: 15_000,
    coverage: {
      provider: "v8",
      include: [
        "src/**/*.{ts,tsx}",
        "scripts/**/*.ts",
        "spacetimedb/src/**/*.ts",
        "data/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/__tests__/**",
        "cloud_run/**",
        "coverage/**",
        "data/viking/**",
        "dist/**",
        "**/generated_row_schemas/**",
        "**/module_bindings/**",
        "node_modules/**",
        "public/**",
        "spacetimedb/src/generated/**",
        "src/generated/**",
        "src/generated_row_schemas/**",
        "src/module_bindings/**",
        "tmp/**",
        "tmp_*",
      ],
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 40,
        branches: 65,
        functions: 65,
        lines: 40,
      },
    },
  },
});
