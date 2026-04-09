
import { readFileSync } from "node:fs";

const SNAPSHOT_PATH = "f:/proje/grenzwanderer/Grenzwanderer/content/vn/pilot.snapshot.json";

// ACTUAL CONSTANTS FROM INNERVOICECONTRACT
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

const isSpeakerId = (id: any) => SPEAKER_ID_SET.has(id);
const isInnerVoiceId = (id: any) => INNER_VOICE_ID_SET.has(id);
const isSkillVoiceId = (id: any) => SKILL_VOICE_ID_SET.has(id);

const hasMixedSpeakerPool = (speakerIds: string[] | undefined): boolean => {
  if (!speakerIds || speakerIds.length === 0) return false;
  let hasSkill = false;
  let hasInner = false;
  for (const speakerId of speakerIds) {
    if (isSkillVoiceId(speakerId)) hasSkill = true;
    if (isInnerVoiceId(speakerId)) hasInner = true;
  }
  return hasSkill && hasInner;
};

const isVoicePresenceMode = (v: any) => ["text_variability", "parliament", "mechanical_voice"].includes(v);

// VN CONDITION VALIDATOR FROM ALL.TS
const isVnCondition = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const condition = value;
  if (condition.type === "logic_and" || condition.type === "logic_or") {
    return Array.isArray(condition.conditions) && condition.conditions.length > 0 && condition.conditions.every(isVnCondition);
  }
  if (condition.type === "logic_not") return isVnCondition(condition.condition);
  if (condition.type === "flag_equals") return typeof condition.key === "string" && typeof condition.value === "boolean";
  if (condition.type === "var_gte" || condition.type === "var_lte") return typeof condition.key === "string" && typeof condition.value === "number";
  if (condition.type === "has_evidence") return typeof condition.evidenceId === "string";
  if (condition.type === "quest_stage_gte") return typeof condition.questId === "string" && typeof condition.stage === "number";
  if (condition.type === "relationship_gte") return typeof condition.characterId === "string" && typeof condition.value === "number";
  if (condition.type === "has_item") return typeof condition.itemId === "string";
  if (condition.type === "favor_balance_gte") return typeof condition.npcId === "string" && typeof condition.value === "number";
  if (condition.type === "agency_standing_gte") return typeof condition.value === "number";
  if (condition.type === "rumor_state_is") return typeof condition.rumorId === "string" && (condition.status === "registered" || condition.status === "verified");
  if (condition.type === "career_rank_gte") return typeof condition.rankId === "string";
  if (condition.type === "voice_level_gte") return typeof condition.voiceId === "string" && isSkillVoiceId(condition.voiceId) && typeof condition.value === "number";
  if (condition.type === "spirit_state_is") return typeof condition.spiritId === "string" && ["hostile", "imprisoned", "controlled", "destroyed"].includes(condition.state);
  if (condition.type === "has_controlled_spirit") return typeof condition.entityArchetypeId === "string";
  return false;
};

// VN EFFECT VALIDATOR FROM ALL.TS
const isVnEffect = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const effect = value;
  if (effect.type === "set_flag") return typeof effect.key === "string" && typeof effect.value === "boolean";
  if (effect.type === "set_var" || effect.type === "add_var") return typeof effect.key === "string" && typeof effect.value === "number";
  if (effect.type === "travel_to") return typeof effect.locationId === "string";
  if (effect.type === "open_command_mode" || effect.type === "open_battle_mode") return typeof effect.scenarioId === "string";
  if (effect.type === "spawn_map_event") return typeof effect.templateId === "string";
  if (effect.type === "track_event") return typeof effect.eventName === "string";
  if (effect.type === "discover_fact") return typeof effect.caseId === "string" && typeof effect.factId === "string";
  if (effect.type === "grant_xp") return typeof effect.amount === "number";
  if (effect.type === "unlock_group") return typeof effect.groupId === "string";
  if (effect.type === "set_quest_stage") return typeof effect.questId === "string" && typeof effect.stage === "number";
  if (effect.type === "change_relationship") return typeof effect.characterId === "string" && typeof effect.delta === "number";
  if (effect.type === "change_favor_balance") return typeof effect.npcId === "string" && typeof effect.delta === "number";
  if (effect.type === "change_agency_standing") return typeof effect.delta === "number";
  if (effect.type === "change_faction_signal") return typeof effect.factionId === "string" && typeof effect.delta === "number";
  if (effect.type === "register_rumor") return typeof effect.rumorId === "string";
  if (effect.type === "verify_rumor") return typeof effect.rumorId === "string" && typeof effect.verificationKind === "string";
  if (effect.type === "record_service_criterion") return typeof effect.criterionId === "string";
  if (effect.type === "grant_evidence") return typeof effect.evidenceId === "string";
  if (effect.type === "grant_item") return typeof effect.itemId === "string" && typeof effect.quantity === "number";
  if (effect.type === "add_heat" || effect.type === "add_tension" || effect.type === "grant_influence") return typeof effect.amount === "number";
  if (effect.type === "shift_awakening") return typeof effect.amount === "number";
  if (effect.type === "record_entity_observation") return typeof effect.observationId === "string";
  if (effect.type === "unlock_distortion_point") return typeof effect.pointId === "string";
  if (effect.type === "set_sight_mode") return ["rational", "sensitive", "ether"].includes(effect.mode);
  if (effect.type === "apply_rationalist_buffer") return typeof effect.amount === "number";
  if (effect.type === "tag_entity_signature") return typeof effect.signatureId === "string";
  if (effect.type === "change_psyche_axis") return ["x", "y", "approach"].includes(effect.axis) && typeof effect.delta === "number";
  return false;
};

const isOutcomeBranch = (branch: any) => {
    if (branch === undefined) return true;
    if (!branch || typeof branch !== "object") return false;
    return (branch.nextNodeId === undefined || typeof branch.nextNodeId === "string") &&
           (branch.effects === undefined || (Array.isArray(branch.effects) && branch.effects.every(isVnEffect)));
};

const isCostBranch = (branch: any) => {
    if (branch === undefined) return true;
    return isOutcomeBranch(branch) && (branch.costEffects === undefined || (Array.isArray(branch.costEffects) && branch.costEffects.every(isVnEffect)));
}

const isSkillCheck = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const check = value;
  return typeof check.id === "string" && typeof check.voiceId === "string" && isSpeakerId(check.voiceId) && typeof check.difficulty === "number" && 
         isOutcomeBranch(check.onSuccess) && isOutcomeBranch(check.onFail) && isOutcomeBranch(check.onCritical) && isCostBranch(check.onSuccessWithCost);
};

const isChoice = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const choice = value;
  if (typeof choice.id !== "string" || typeof choice.text !== "string" || typeof choice.nextNodeId !== "string") return false;
  
  if (choice.conditions !== undefined && (!Array.isArray(choice.conditions) || !choice.conditions.every(isVnCondition))) return false;
  if (choice.visibleIfAll !== undefined && (!Array.isArray(choice.visibleIfAll) || !choice.visibleIfAll.every(isVnCondition))) return false;
  if (choice.effects !== undefined && (!Array.isArray(choice.effects) || !choice.effects.every(isVnEffect))) return false;
  if (choice.skillCheck !== undefined && !isSkillCheck(choice.skillCheck)) return false;
  
  if (choice.innerVoiceHints !== undefined && (!Array.isArray(choice.innerVoiceHints) || !choice.innerVoiceHints.every((entry: any) => 
    !!entry && typeof entry === "object" && typeof entry.voiceId === "string" && isInnerVoiceId(entry.voiceId) && (entry.stance === "supports" || entry.stance === "opposes") && typeof entry.text === "string"
  ))) return false;
  
  return true;
};

const isNode = (value: any): boolean => {
  if (!value || typeof value !== "object") return false;
  const node = value;
  const valid = (
    typeof node.id === "string" &&
    typeof node.scenarioId === "string" &&
    typeof node.title === "string" &&
    typeof node.body === "string" &&
    (node.backgroundUrl === undefined || typeof node.backgroundUrl === "string") &&
    (node.characterId === undefined || typeof node.characterId === "string") &&
    (node.voicePresenceMode === undefined || isVoicePresenceMode(node.voicePresenceMode)) &&
    (node.activeSpeakers === undefined || (
      Array.isArray(node.activeSpeakers) && 
      node.activeSpeakers.every((id: any) => typeof id === "string" && isSpeakerId(id)) &&
      !hasMixedSpeakerPool(node.activeSpeakers)
    )) &&
    (node.terminal === undefined || typeof node.terminal === "boolean") &&
    Array.isArray(node.choices) && node.choices.every(isChoice) &&
    (node.onEnter === undefined || (Array.isArray(node.onEnter) && node.onEnter.every(isVnEffect))) &&
    (node.preconditions === undefined || (Array.isArray(node.preconditions) && node.preconditions.every(isVnCondition))) &&
    (node.passiveChecks === undefined || (Array.isArray(node.passiveChecks) && node.passiveChecks.every(isSkillCheck)))
  );
  return valid;
};

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
snapshot.nodes.forEach((node: any) => {
    if (!isNode(node)) {
        console.log("INVALID NODE FOUND:", node.id);
        // Deeper check
        if (typeof node.id !== "string") console.log("- node.id is not string");
        if (typeof node.scenarioId !== "string") console.log("- node.scenarioId is not string");
        if (typeof node.title !== "string") console.log("- node.title is not string");
        if (typeof node.body !== "string") console.log("- node.body is not string");
        if (!Array.isArray(node.choices)) console.log("- node.choices is not array");
        else {
            node.choices.forEach((c: any, i: number) => {
                if (!isChoice(c)) console.log(`- choice ${i} (${c.id}) is invalid`);
                if (c.effects) {
                    c.effects.forEach((e: any, j: number) => {
                        if (!isVnEffect(e)) console.log(`  - choice ${i} effect ${j} (type: ${e.type}) is invalid`);
                    });
                }
            });
        }
        if (node.onEnter) {
            node.onEnter.forEach((e: any, i: number) => {
                if (!isVnEffect(e)) console.log(`- onEnter effect ${i} (type: ${e.type}) is invalid`);
            });
        }
    }
});
console.log("Check complete.");
