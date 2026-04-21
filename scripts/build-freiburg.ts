import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  CONTENT_RELEASE_PROFILE: "freiburg_detective",
  RELEASE_PROFILE: "freiburg_detective",
  VITE_RELEASE_PROFILE: "freiburg_detective",
  VITE_SPACETIMEDB_HOST:
    process.env.VITE_SPACETIMEDB_HOST ?? "https://maincloud.spacetimedb.com",
  VITE_SPACETIMEDB_DB_NAME:
    process.env.VITE_SPACETIMEDB_DB_NAME ?? "grezwandererdata",
  VITE_SCENE_GEN_BASE_URL: process.env.VITE_SCENE_GEN_BASE_URL ?? "/api",
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

run(["bun", "run", "content:extract"]);
run(["bun", "run", "release:config:prepare"]);
run(["bun", "run", "spacetime:generate"]);
run(["bun", "x", "tsc", "-b"]);
run(["bun", "x", "vite", "build", "--mode", "production"]);

console.log("[build:freiburg] Freiburg detective build completed.");
