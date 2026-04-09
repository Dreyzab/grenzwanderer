
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

snapshot.nodes.forEach((node: any) => {
    if (typeof node.title !== "string" || !node.title) {
        console.log(`Node ${node.id} is missing title!`);
    }
    if (typeof node.body !== "string" || !node.body) {
        console.log(`Node ${node.id} is missing body!`);
    }
    if (!Array.isArray(node.choices)) {
        console.log(`Node ${node.id} is missing choices!`);
    }
});
console.log("Check complete.");
