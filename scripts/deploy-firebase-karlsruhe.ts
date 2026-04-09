import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  CONTENT_RELEASE_PROFILE: "karlsruhe_event",
  RELEASE_PROFILE: "karlsruhe_event",
  VITE_RELEASE_PROFILE: "karlsruhe_event",
  VITE_SPACETIMEDB_DB_NAME:
    process.env.VITE_SPACETIMEDB_DB_NAME ?? "grezwandererdata-karlsruhe",
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

run(["bun", "run", "build:karlsruhe"]);
run([
  "bun",
  "x",
  "firebase-tools",
  "deploy",
  "--only",
  "hosting:karlsruhe-event",
]);

console.log("[deploy:firebase:karlsruhe] Karlsruhe Hosting deploy completed.");
