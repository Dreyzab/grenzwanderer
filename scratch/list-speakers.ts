
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

const activeSpeakers = new Set<string>();
const voiceIds = new Set<string>();

snapshot.nodes.forEach((node: any) => {
    if (node.activeSpeakers) {
        node.activeSpeakers.forEach((s: string) => activeSpeakers.add(s));
    }
    node.choices.forEach((c: any) => {
        if (c.skillCheck) voiceIds.add(c.skillCheck.voiceId);
        if (c.innerVoiceHints) {
            c.innerVoiceHints.forEach((h: any) => voiceIds.add(h.voiceId));
        }
    });
});

console.log("Unique Active Speakers:", Array.from(activeSpeakers));
console.log("Unique Voice IDs:", Array.from(voiceIds));
