
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

console.log("Scenarios count:", snapshot.scenarios?.length);
console.log("Nodes count:", snapshot.nodes?.length);

let nodesMissingTitle = 0;
let nodesMissingBody = 0;
let nodesMissingChoices = 0;

snapshot.nodes.forEach((node: any) => {
    if (node.title === undefined) nodesMissingTitle++;
    if (node.body === undefined) nodesMissingBody++;
    if (node.choices === undefined) nodesMissingChoices++;
});

console.log("Nodes missing title:", nodesMissingTitle);
console.log("Nodes missing body:", nodesMissingBody);
console.log("Nodes missing choices:", nodesMissingChoices);
