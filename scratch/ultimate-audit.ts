
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

const SKILL_VOICE_IDS = [
  "attr_agility", "attr_authority", "attr_charisma", "attr_composure", "attr_deception",
  "attr_empathy", "attr_encyclopedia", "attr_endurance", "attr_forensics", "attr_imagination",
  "attr_intellect", "attr_intrusion", "attr_intuition", "attr_logic", "attr_occultism",
  "attr_perception", "attr_physical", "attr_poetics", "attr_psyche", "attr_shadow",
  "attr_social", "attr_spirit", "attr_stealth", "attr_tradition",
];
const INNER_VOICE_IDS = [
  "inner_leader", "inner_guide", "inner_manipulator", "inner_adapter",
  "inner_analyst", "inner_cynic", "inner_exile", "inner_hermit",
];
const SPEAKER_ID_SET = new Set([...SKILL_VOICE_IDS, ...INNER_VOICE_IDS]);
const SKILL_VOICE_ID_SET = new Set(SKILL_VOICE_IDS);
const INNER_VOICE_ID_SET = new Set(INNER_VOICE_IDS);

const isSpeakerId = (v: any) => typeof v === "string" && SPEAKER_ID_SET.has(v);
const isSkillVoiceId = (v: any) => typeof v === "string" && SKILL_VOICE_ID_SET.has(v);
const isInnerVoiceId = (v: any) => typeof v === "string" && INNER_VOICE_ID_SET.has(v);

const hasMixedSpeakerPool = (ids: any) => {
    if (!Array.isArray(ids)) return false;
    let hasSkill = false;
    let hasInner = false;
    for (const id of ids) {
        if (isSkillVoiceId(id)) hasSkill = true;
        if (isInnerVoiceId(id)) hasInner = true;
    }
    return hasSkill && hasInner;
};

const isVnEffect = (eff: any) => {
    if (!eff || typeof eff !== "object") return false;
    // Simplified for now, most common types only
    if (eff.type === "set_flag") return typeof eff.key === "string" && typeof eff.value === "boolean";
    if (eff.type === "add_var") return typeof eff.key === "string" && typeof eff.value === "number";
    return true; // Assume unknown types pass for this diagnostic
};

const isOutcomeBranch = (branch: any) => {
    if (branch === undefined) return true;
    if (!branch || typeof branch !== "object") return false;
    return true;
};

const isSkillCheck = (check: any) => {
    if (!check || typeof check !== "object") return false;
    if (typeof check.id !== "string") return false;
    if (!isSkillVoiceId(check.voiceId)) return false;
    if (typeof check.difficulty !== "number") return false;
    if (!isOutcomeBranch(check.onSuccess)) return false;
    // Missing Fail/Critical is allowed by the real validator if they are undefined
    return true;
};

const isChoice = (choice: any) => {
    if (!choice || typeof choice !== "object") return false;
    if (typeof choice.id !== "string") return false;
    if (typeof choice.text !== "string") return false;
    if (typeof choice.nextNodeId !== "string") return false;
    return true;
};

snapshot.nodes.forEach((node: any) => {
    let failed = false;
    let reason = "";

    if (typeof node.id !== "string") { failed = true; reason = "id is not a string"; }
    else if (typeof node.scenarioId !== "string") { failed = true; reason = "scenarioId is not a string"; }
    else if (typeof node.title !== "string") { failed = true; reason = "title is not a string"; }
    else if (typeof node.body !== "string") { failed = true; reason = "body is not a string"; }
    else if (!Array.isArray(node.choices)) { failed = true; reason = "choices is not an array"; }
    else if (!node.choices.every((c: any) => isChoice(c))) { failed = true; reason = "one or more choices are invalid"; }
    else if (node.activeSpeakers !== undefined) {
        if (!Array.isArray(node.activeSpeakers)) { failed = true; reason = "activeSpeakers is not an array"; }
        else if (!node.activeSpeakers.every((s: any) => isSpeakerId(s))) { failed = true; reason = "invalid speaker ID in activeSpeakers"; }
        else if (hasMixedSpeakerPool(node.activeSpeakers)) { failed = true; reason = "mixed speaker pool"; }
    }
    
    if (node.passiveChecks !== undefined) {
        if (!Array.isArray(node.passiveChecks)) { failed = true; reason = "passiveChecks is not an array"; }
        else if (!node.passiveChecks.every((c: any) => isSkillCheck(c))) { 
            failed = true; 
            reason = "one or more passiveChecks are invalid"; 
            const failingCheck = node.passiveChecks.find((c: any) => !isSkillCheck(c));
            reason += `: ${JSON.stringify(failingCheck)}`;
        }
    }

    if (failed) {
        console.log(`FAIL: [${node.id}] ${reason}`);
    }
});

console.log("Audit complete.");
