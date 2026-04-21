
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

function findTitles(obj: any, path: string = "") {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
        obj.forEach((item, i) => findTitles(item, `${path}[${i}]`));
    } else {
        if (obj.title !== undefined) {
            console.log(`Title at ${path}: ${obj.title}`);
        }
        for (const key in obj) {
            findTitles(obj[key], `${path}.${key}`);
        }
    }
}

findTitles(snapshot);
