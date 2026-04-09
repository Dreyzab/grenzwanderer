
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

const SKILL_PREFIX = "attr_";
const INNER_PREFIX = "inner_";

snapshot.nodes.forEach((node: any) => {
    if (node.activeSpeakers) {
        let hasSkill = false;
        let hasInner = false;
        node.activeSpeakers.forEach((s: string) => {
            if (s.startsWith(SKILL_PREFIX)) hasSkill = true;
            if (s.startsWith(INNER_PREFIX)) hasInner = true;
        });
        if (hasSkill && hasInner) {
            console.log(`Node ${node.id} has mixed speakers:`, node.activeSpeakers);
        }
    }
});
