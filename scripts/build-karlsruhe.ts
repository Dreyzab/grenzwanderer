import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  CONTENT_RELEASE_PROFILE: "karlsruhe_event",
  RELEASE_PROFILE: "karlsruhe_event",
  VITE_RELEASE_PROFILE: "karlsruhe_event",
  VITE_SPACETIMEDB_HOST:
    process.env.VITE_SPACETIMEDB_HOST ?? "https://maincloud.spacetimedb.com",
  VITE_SPACETIMEDB_DB_NAME:
    process.env.VITE_SPACETIMEDB_DB_NAME ?? "grezwandererdata-karlsruhe",
  VITE_SCENE_GEN_BASE_URL: process.env.VITE_SCENE_GEN_BASE_URL ?? "/api",
  VITE_APP_CHECK_ENABLED: process.env.VITE_APP_CHECK_ENABLED ?? "false",
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY ?? "",
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID ?? "",
  VITE_FIREBASE_PROJECT_ID:
    process.env.VITE_FIREBASE_PROJECT_ID ?? "detective-prod-8f6f0",
  VITE_RECAPTCHA_ENTERPRISE_SITE_KEY:
    process.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY ?? "",
};

const run = (command: string[]) => {
  const proc = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (proc.status !== 0) {
    throw new Error(
      `${command.join(" ")} failed with exit code ${proc.status}`,
    );
  }
};

run(["bun", "run", "content:extract:karlsruhe"]);
run(["bun", "run", "release:config:prepare"]);
run(["bun", "run", "spacetime:generate"]);
run(["bun", "x", "tsc", "-b"]);
run(["bun", "x", "vite", "build", "--mode", "production"]);

console.log("[build:karlsruhe] Karlsruhe event build completed.");
