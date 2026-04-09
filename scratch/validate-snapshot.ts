
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";

const SKILL_VOICE_IDS = [
  "attr_agility", "attr_authority", "attr_charisma", "attr_composure", "attr_deception",
  "attr_empathy", "attr_encyclopedia", "attr_endurance", "attr_forensics", "attr_imagination",
  "attr_intellect", "attr_intrusion", "attr_intuition", "attr_logic", "attr_occultism",
  "attr_perception", "attr_physical", "attr_poetics", "attr_psyche", "attr_shadow",
  "attr_social", "attr_spirit", "attr_stealth", "attr_tradition"
];

const INNER_VOICE_IDS = [
  "inner_leader", "inner_guide", "inner_manipulator", "inner_adapter",
  "inner_analyst", "inner_cynic", "inner_exile", "inner_hermit"
];

const SPEAKER_ID_SET = new Set([...SKILL_VOICE_IDS, ...INNER_VOICE_IDS]);
const INNER_VOICE_ID_SET = new Set(INNER_VOICE_IDS);
const SKILL_VOICE_ID_SET = new Set(SKILL_VOICE_IDS);

function isSpeakerId(id: string) { return SPEAKER_ID_SET.has(id); }
function isInnerVoiceId(id: string) { return INNER_VOICE_ID_SET.has(id); }
function isSkillVoiceId(id: string) { return SKILL_VOICE_ID_SET.has(id); }

function hasMixedSpeakerPool(ids: string[]) {
    let hasSkill = false;
    let hasInner = false;
    for (const id of ids) {
        if (isSkillVoiceId(id)) hasSkill = true;
        if (isInnerVoiceId(id)) hasInner = true;
    }
    return hasSkill && hasInner;
}

function isVnEffect(e: any) { 
    if (!e || typeof e !== 'object') return false;
    // Simplified but enough for typical cases
    return typeof e.type === 'string';
}

function isVnCondition(c: any) { 
    if (!c || typeof c !== 'object') return false;
    return typeof c.type === 'string';
}

function isSkillCheck(s: any) { 
    if (!s || typeof s !== 'object') return false;
    if (typeof s.id !== 'string') return false;
    if (typeof s.voiceId !== 'string' || !isSpeakerId(s.voiceId)) return false;
    if (typeof s.difficulty !== 'number') return false;
    return true;
}

function isChoice(choice: any) {
    if (!choice || typeof choice !== 'object') return false;
    if (typeof choice.id !== 'string') return false;
    if (typeof choice.text !== 'string') return false;
    if (typeof choice.nextNodeId !== 'string') return false;
    
    if (choice.skillCheck !== undefined && !isSkillCheck(choice.skillCheck)) return false;
    
    if (choice.effects !== undefined && (!Array.isArray(choice.effects) || !choice.effects.every(isVnEffect))) return false;
    if (choice.conditions !== undefined && (!Array.isArray(choice.conditions) || !choice.conditions.every(isVnCondition))) return false;
    
    return true;
}

function isNode(node: any) {
  if (!node || typeof node !== "object") return false;

  const valid = (
    typeof node.id === "string" &&
    typeof node.scenarioId === "string" &&
    typeof node.title === "string" &&
    typeof node.body === "string" &&
    (node.backgroundUrl === undefined || typeof node.backgroundUrl === "string") &&
    (node.characterId === undefined || typeof node.characterId === "string") &&
    (node.voicePresenceMode === undefined || ["text_variability", "parliament", "mechanical_voice"].includes(node.voicePresenceMode)) &&
    (node.activeSpeakers === undefined || (
        Array.isArray(node.activeSpeakers) && 
        node.activeSpeakers.every((id: any) => typeof id === "string" && isSpeakerId(id)) &&
        !hasMixedSpeakerPool(node.activeSpeakers)
    )) &&
    Array.isArray(node.choices) && node.choices.every(isChoice)
  );
  
  return valid;
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
let valid = true;
snapshot.nodes.forEach((node: any) => {
    if (!isNode(node)) {
        console.log("INVALID NODE:", node.id);
        valid = false;
        
        // Detailed log
        if (node.activeSpeakers) {
            node.activeSpeakers.forEach((id: any) => {
                if (!isSpeakerId(id)) console.log(`  - Invalid speaker: ${id}`);
            });
            if (hasMixedSpeakerPool(node.activeSpeakers)) console.log("  - Mixed speaker pool");
        }
        
        node.choices.forEach((choice: any, i: number) => {
            if (!isChoice(choice)) {
                console.log(`  - Invalid choice index ${i}: ${choice.id}`);
                if (choice.skillCheck && !isSkillCheck(choice.skillCheck)) {
                    console.log(`    - Invalid skillCheck voiceId: ${choice.skillCheck.voiceId}`);
                }
            }
        });
    }
});

if (valid) console.log("All nodes pass validation script.");
