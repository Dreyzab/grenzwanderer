import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadAppBuildMetadata } from "./scripts/app-build-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildMetadata = loadAppBuildMetadata(__dirname);

const normalizeChunkPath = (id: string): string => id.replace(/\\/g, "/");

const manualChunks = (id: string): string | undefined => {
  const normalizedId = normalizeChunkPath(id);
  if (
    normalizedId.includes("/node_modules/mapbox-gl/") ||
    normalizedId.includes("/node_modules/react-map-gl/")
  ) {
    return "mapbox";
  }
  if (
    normalizedId.includes("/node_modules/three/") ||
    normalizedId.includes("/node_modules/@react-three/fiber/")
  ) {
    return "three-vendor";
  }
  if (normalizedId.includes("/src/features/vn/ui/VnSkillCheckDiceScene.tsx")) {
    return "vn-dice-scene";
  }
  return undefined;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");

  return {
    base: env.VITE_BASE_PATH || "/",
    // Default Node/Vite on Windows often binds ::1 only; browsers hitting 127.0.0.1 then fail.

    define: {
      __APP_VERSION__: JSON.stringify(buildMetadata.appVersion),
      __APP_COMMIT_SHA__: JSON.stringify(buildMetadata.commitSha),
      __APP_BUILD_TIMESTAMP__: JSON.stringify(buildMetadata.buildTimestamp),
    },
    plugins: [react(), tailwindcss()],
    build: {
      manifest: true,
      rollupOptions: {
        // Two independent entries: the public game (index.html) and the
        // operator-only Feedback Center (index.operator.html). The operator
        // bundle is built separately so it never ships in the public game shell.
        input: {
          main: path.resolve(__dirname, "index.html"),
          operator: path.resolve(__dirname, "index.operator.html"),
        },
        output: {
          manualChunks,
        },
      },
    },
  };
});
