import type { QuestArchetype, TriggerRule } from "../types";
import { CASE01_QUEST_ARCHETYPES, CASE01_TRIGGER_RULES } from "./case01";

export interface CaseCatalog {
  triggerRules: TriggerRule[];
  questArchetypes: QuestArchetype[];
}

export const CASE_CATALOG: CaseCatalog = {
  triggerRules: [...CASE01_TRIGGER_RULES],
  questArchetypes: [...CASE01_QUEST_ARCHETYPES],
};

export { CASE01_TRIGGER_RULES, CASE01_QUEST_ARCHETYPES };
