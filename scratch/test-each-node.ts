
import { readFileSync } from "node:fs";
// @ts-ignore
import { parseSnapshotPayload } from "../spacetimedb/src/reducers/helpers/all";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

// We need to bypass the parseSnapshotPayload which checks everything at once
// and just test the nodes one by one.

import { 
    // @ts-ignore
    isNode 
} from "../spacetimedb/src/reducers/helpers/all";

snapshot.nodes.forEach((node: any) => {
    if (!isNode(node)) {
        console.log("FAILING NODE DETECTED:");
        console.log(JSON.stringify(node, null, 2));
    }
});

console.log("Individual node testing complete.");
