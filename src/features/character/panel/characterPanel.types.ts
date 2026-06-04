import type {
  InnerVoiceDefinition,
  InnerVoiceId,
  SkillVoiceId,
} from "../../../../data/innerVoiceContract";
import type {
  SkillDefinition,
  SkillProgressionRole,
} from "../../../../data/skillDefinitions";
import type { SkillRankPerkDefinition } from "../../../shared/game/skillPerks";
import type { SkillRankState } from "../../../shared/game/skillProgression";
import type {
  CharacterIndicatorId,
  CharacterSynergyState,
  CoreCharacteristicState,
} from "../../../shared/game/characterProgression";
import type { VoiceOrDeptId } from "../../../shared/ui/icons/game-icons";

export interface BaseQuestJournalEntry {
  id: string;
  title: string;
  currentStage: number;
  status: "Completed" | "In progress" | "Not started";
}

export interface CanonQuestJournalEntry extends BaseQuestJournalEntry {
  kind: "canon";
  activeStage?: {
    title: string;
    objectiveHint: string;
    objectivePointIds?: string[];
  };
}

export interface ProceduralQuestJournalEntry extends BaseQuestJournalEntry {
  kind: "procedural";
  archetypeId: string;
  stateNamespace: string;
  steps: Array<{
    id: string;
    nodeId?: string;
    title: string;
    status: "pending" | "active" | "completed" | "failed" | "tombstoned";
  }>;
  eligibilitySnapshot?: {
    triggerRuleId: string;
    eventName: string;
    caseId?: string;
    scenarioId?: string;
    nodeId?: string;
    payload?: Record<string, unknown>;
  };
  createdAt: number;
}

export type CharacterQuestJournalEntry =
  | CanonQuestJournalEntry
  | ProceduralQuestJournalEntry;

export interface CharacterObservationEntry {
  id: string;
  kind: string;
  title: string;
  text: string;
  rationalInterpretation?: string;
  entityArchetypeId?: string;
}

export interface CharacterContactEntry {
  id: string;
  displayName: string;
  publicRole: string;
  relationshipStatus: string;
  relationshipTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  favorState: string;
  favorTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  services: string[];
}

export interface AgencyCareerSummary {
  rankLabel: string;
  standingLabel: string;
  standingTone: "danger" | "warning" | "neutral" | "success" | "highlight";
  trendLabel: string;
  criteriaSummary: string;
}

export interface MethodVoiceCard {
  id: SkillVoiceId;
  label: string;
  labelRu: string;
  rankState: SkillRankState;
  progressionRole: SkillProgressionRole;
  descriptionRu: string;
  iconName: VoiceOrDeptId;
  definition: SkillDefinition;
  unlockedPerks: readonly SkillRankPerkDefinition[];
  nextPerk: SkillRankPerkDefinition | null;
}

export interface PatronVoiceCard {
  voiceId: InnerVoiceId;
  label: string;
  influence: number;
  voiceRank: number;
  dominanceRank: number;
  worldview: string;
  toneDescriptor: string;
  palette: InnerVoiceDefinition["palette"];
  iconName: VoiceOrDeptId;
  methods: MethodVoiceCard[];
}

export interface CharacterIndicatorCard {
  id: CharacterIndicatorId;
  label: string;
  rank: number;
  description: string;
}

export type CharacterCoreCard = CoreCharacteristicState;

export type CharacterSynergyCard = CharacterSynergyState;
