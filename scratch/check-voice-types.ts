
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

const skillCheckVoices = new Set<string>();
const innerVoiceHintVoices = new Set<string>();

snapshot.nodes.forEach((node: any) => {
    node.choices.forEach((c: any) => {
        if (c.skillCheck) skillCheckVoices.add(c.skillCheck.voiceId);
        if (c.innerVoiceHints) {
            c.innerVoiceHints.forEach((h: any) => innerVoiceHintVoices.add(h.voiceId));
        }
    });
});

console.log("Skill Check Voice IDs:", Array.from(skillCheckVoices));
console.log("Inner Voice Hint Voice IDs:", Array.from(innerVoiceHintVoices));
