import { spawn } from "node:child_process";
import { getSmokeAllPipeline } from "./acceptance-matrix";

const pipeline = getSmokeAllPipeline();
const smokeHost = process.env.SMOKE_STDB_HOST ?? "ws://127.0.0.1:3000";
const isLocalResettableSmokeHost = (host: string): boolean => {
  try {
    const url = new URL(host);
    return (
      (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      (url.port === "3000" || url.port === "3001")
    );
  } catch {
    return false;
  }
};
const shouldResetLocalDb =
  process.env.SMOKE_ALL_RESET_LOCAL_DB !== "0" &&
  isLocalResettableSmokeHost(smokeHost);

const runBunScript = (script: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", script], {
      stdio: "inherit",
      shell: true,
    });

    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`Script '${script}' exited with code ${code ?? "null"}`),
      );
    });
  });

const resetLocalDbIfNeeded = async (): Promise<void> => {
  if (!shouldResetLocalDb) {
    return;
  }

  console.log("[smoke:all] Resetting local SpacetimeDB before next step...");
  await runBunScript("spacetime:publish:local:clear");
};

const main = async () => {
  const startedAt = Date.now();
  for (const step of pipeline) {
    await resetLocalDbIfNeeded();
    const stepStartedAt = Date.now();
    console.log(`\n[smoke:all] Running ${step.label} (${step.script})...`);
    await runBunScript(step.script);
    const durationMs = Date.now() - stepStartedAt;
    console.log(`[smoke:all] ${step.label} passed in ${durationMs}ms.`);
  }

  const totalDurationMs = Date.now() - startedAt;
  console.log(
    `\n[smoke:all] All smoke scripts passed in ${totalDurationMs}ms.`,
  );
};

main().catch((error) => {
  console.error("[smoke:all] Pipeline failed:", error);
  process.exitCode = 1;
});
