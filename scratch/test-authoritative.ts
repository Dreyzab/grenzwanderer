
import { readFileSync } from "node:fs";
// @ts-ignore
import { parseSnapshotPayload } from "../spacetimedb/src/reducers/helpers/all";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const payloadJson = readFileSync(SNAPSHOT_PATH, "utf8");

try {
    parseSnapshotPayload(payloadJson);
    console.log("Validation passed unexpectedly!");
} catch (e: any) {
    console.log("VALIDATION FAILED:");
    console.error(e.message);
}
