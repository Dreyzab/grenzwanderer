import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  CONTENT_RELEASE_PROFILE: "freiburg_detective",
  RELEASE_PROFILE: "freiburg_detective",
  VITE_RELEASE_PROFILE: "freiburg_detective",
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

run(["bun", "run", "build:freiburg"]);
run([
  "bun",
  "x",
  "firebase-tools",
  "deploy",
  "--only",
  "hosting:freiburg-event",
  "--non-interactive",
]);

console.log("[deploy:firebase:freiburg] Freiburg Hosting deploy completed.");
