import type { CanonicalVoicePromptProfile } from "../../../../data/voiceBridge";
import type { CharacterAttributeDefinition } from "../characterScreenModel";

export interface CharacterQuestJournalEntry {
  id: string;
  title: string;
  currentStage: number;
  activeStage?: {
    title: string;
    objectiveHint: string;
    objectivePointIds?: string[];
  };
  status: "Completed" | "In progress" | "Not started";
}

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

export interface AttributeVoiceBridgeSummary {
  legacyVoiceId: string;
  canonicalVoiceId: string;
  canonicalLabel: string;
  iconName: string;
  promptProfile: CanonicalVoicePromptProfile | null;
}

export interface CharacterSpecializedAttributeCard extends CharacterAttributeDefinition {
  value: number;
  voiceBridge: AttributeVoiceBridgeSummary | null;
}

export interface CharacterAttributeCard extends CharacterAttributeDefinition {
  value: number;
  voiceBridge: AttributeVoiceBridgeSummary | null;
  specialized: CharacterSpecializedAttributeCard[];
}

export interface CharacterVoiceBridgeRegistryEntry {
  sourceLabel: string;
  currentValue: number;
  accent: string;
  bridge: AttributeVoiceBridgeSummary & {
    promptProfile: CanonicalVoicePromptProfile;
  };
}
