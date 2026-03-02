import { spawn } from "node:child_process";

const pipeline = [
  { label: "VN authority", script: "smoke:vn-authority" },
  { label: "Origin entry", script: "smoke:origin-entry" },
  { label: "Origin handoff", script: "smoke:origin-handoff" },
  { label: "MindPalace", script: "smoke:mindpalace" },
];

const runScript = (script: string): Promise<void> =>
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

const main = async () => {
  const startedAt = Date.now();
  for (const step of pipeline) {
    const stepStartedAt = Date.now();
    console.log(`\n[smoke:all] Running ${step.label} (${step.script})...`);
    await runScript(step.script);
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
