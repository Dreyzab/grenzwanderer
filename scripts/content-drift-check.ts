import { spawnSync } from "node:child_process";

const files = [
  "content/vn/pilot.snapshot.json",
  "public/content/vn/pilot.snapshot.json",
];

const result = spawnSync("git", ["diff", "--name-only", "--", ...files], {
  encoding: "utf8",
  shell: true,
});

if (result.error) {
  console.error("Failed to run git diff:", result.error);
  process.exitCode = 1;
} else {
  const changed = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (changed.length > 0) {
    console.error(
      "Content drift detected. Regenerate and review snapshot changes:",
    );
    for (const file of changed) {
      console.error(`- ${file}`);
    }
    process.exitCode = 1;
  } else {
    console.log("No content drift detected for snapshot artifacts.");
  }
}
