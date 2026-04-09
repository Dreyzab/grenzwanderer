
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

snapshot.nodes.forEach((node: any) => {
    node.choices.forEach((choice: any, i: number) => {
        if (typeof choice.nextNodeId !== "string") {
            console.log(`Node ${node.id}, choice ${i} (${choice.id}) is missing nextNodeId!`);
        }
    });
});
console.log("Check complete.");
