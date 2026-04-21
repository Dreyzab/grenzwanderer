import { spawnSync } from "node:child_process";

const runStep = (scriptName: string) => {
  const proc = spawnSync("bun", ["run", scriptName], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (proc.status !== 0) {
    throw new Error(`${scriptName} failed with exit code ${proc.status}`);
  }
};

runStep("smoke:karlsruhe:entry");
runStep("smoke:karlsruhe:resume");
runStep("smoke:karlsruhe:map");
runStep("smoke:karlsruhe:scene-gen");

console.log("[smoke:karlsruhe:all] All Karlsruhe smoke checks passed.");
