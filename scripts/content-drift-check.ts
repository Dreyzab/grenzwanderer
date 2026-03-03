import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const files = [
  "content/vn/pilot.snapshot.json",
  "public/content/vn/pilot.snapshot.json",
];

let hasDrift = false;

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`- ${file} (file missing locally)`);
    hasDrift = true;
    continue;
  }

  const localContent = readFileSync(file, "utf8");
  const result = spawnSync("git", ["show", `HEAD:${file}`], {
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    if (result.stderr && result.stderr.includes("exists on disk, but not in")) {
      console.error(`- ${file} (new file, not in git)`);
      hasDrift = true;
    } else {
      console.error(
        `Failed to read git HEAD for ${file}:`,
        result.stderr || result.error,
      );
    }
    continue;
  }

  const headContent = result.stdout;

  if (localContent === headContent) {
    continue;
  }

  try {
    const localJson = JSON.parse(localContent);
    const headJson = JSON.parse(headContent);

    // Ignore timestamp and generated checksum for drift check
    delete localJson.generatedAt;
    delete headJson.generatedAt;
    delete localJson.checksum;
    delete headJson.checksum;

    if (JSON.stringify(localJson) !== JSON.stringify(headJson)) {
      console.error(`- ${file}`);
      hasDrift = true;
    }
  } catch (e) {
    console.error(`- ${file} (JSON parsing error)`);
    hasDrift = true;
  }
}

if (hasDrift) {
  console.error(
    "\nContent drift detected. Regenerate and review snapshot changes.",
  );
  process.exitCode = 1;
} else {
  console.log("No content drift detected for snapshot artifacts.");
}
