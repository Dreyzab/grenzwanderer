
import { readFileSync } from "node:fs";
import { parseSnapshotPayload } from "../spacetimedb/src/reducers/helpers/all";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
// READ AS STRING
const payloadJson = readFileSync(SNAPSHOT_PATH, "utf8");

try {
    parseSnapshotPayload(payloadJson);
    console.log("Validation passed unexpectedly!");
} catch (e: any) {
    console.log("VALIDATION FAILED AS EXPECTED:");
    console.error(e.message);
}
