import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadAppBuildMetadata } from "./scripts/app-build-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildMetadata = loadAppBuildMetadata(__dirname);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");

  return {
    base: env.VITE_BASE_PATH || "/",
    define: {
      __APP_VERSION__: JSON.stringify(buildMetadata.appVersion),
      __APP_COMMIT_SHA__: JSON.stringify(buildMetadata.commitSha),
      __APP_BUILD_TIMESTAMP__: JSON.stringify(buildMetadata.buildTimestamp),
    },
    plugins: [react(), tailwindcss()],
  };
});
