import { readFileSync } from "node:fs";

const snapshot = JSON.parse(readFileSync("content/vn/pilot.snapshot.json", "utf-8"));
const speakers = new Set();

for (const node of snapshot.nodes) {
  if (node.activeSpeakers) {
    for (const s of node.activeSpeakers) {
      speakers.add(s);
    }
  }
}

console.log("Speakers found in snapshot:", Array.from(speakers));
