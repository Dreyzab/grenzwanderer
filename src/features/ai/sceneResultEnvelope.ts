import type { VnOutcomeGrade, VoicePresenceMode } from "../vn/types";

/**
 * Scene Result Envelope — unified fact-pack for AI layer.
 *
 * Every game event (skill check, scene completion, QR discovery, NPC reaction)
 * produces an envelope that AI uses to render subjective experience.
 *
 * Invariant 3 (core/presentation separation):
 * - The envelope contains only computed facts — never raw player input.
 * - AI reads this; AI never writes back to game state.
 *
 * Invariant 4 (AI without agency):
 * - Envelope is read-only from AI's perspective.
 * - suggestedEffects in AI response are display-only, never auto-applied.
 */

export type SceneResultSource =
  | "skill_check"
  | "scene_result"
  | "npc_reaction"
  | "qr_discovery"
  | "evidence_found";

export interface SceneResultCheckFacts {
  checkId: string;
  voiceId: string;
  outcomeGrade: VnOutcomeGrade;
  margin: number;
  breakdown: { source: string; sourceId: string; delta: number }[];
}

export interface SceneResultCharacterContext {
  characterId: string;
  trust: number;
  visibleFacts: string[];
}

export interface SceneResultEnsemble {
  presenceMode: VoicePresenceMode;
  activeSpeakers: string[];
}

export interface SceneResultPlayerState {
  flags: string[];
  activeQuests: { questId: string; stage: number }[];
  voiceLevels: Record<string, number>;
}

export interface SceneResultEnvelope {
  source: SceneResultSource;
  scenarioId: string;
  nodeId?: string;
  locationName: string;
  timestamp: number;

  playerState: SceneResultPlayerState;

  checkResult?: SceneResultCheckFacts;
  characterContext?: SceneResultCharacterContext;
  ensemble?: SceneResultEnsemble;
}

// --- Validators ---

const VALID_SOURCES: ReadonlySet<string> = new Set<SceneResultSource>([
  "skill_check",
  "scene_result",
  "npc_reaction",
  "qr_discovery",
  "evidence_found",
]);

const VALID_OUTCOME_GRADES: ReadonlySet<string> = new Set<VnOutcomeGrade>([
  "fail",
  "success",
  "critical",
  "success_with_cost",
]);

const VALID_PRESENCE_MODES: ReadonlySet<string> = new Set([
  "text_variability",
  "parliament",
  "mechanical_voice",
]);

export const isValidSceneResultEnvelope = (
  value: unknown,
): value is SceneResultEnvelope => {
  if (!value || typeof value !== "object") return false;

  const env = value as Record<string, unknown>;

  if (typeof env.source !== "string" || !VALID_SOURCES.has(env.source))
    return false;
  if (typeof env.scenarioId !== "string") return false;
  if (typeof env.locationName !== "string") return false;
  if (typeof env.timestamp !== "number") return false;
  if (!env.playerState || typeof env.playerState !== "object") return false;

  if (env.checkResult) {
    const cr = env.checkResult as Record<string, unknown>;
    if (typeof cr.checkId !== "string") return false;
    if (typeof cr.voiceId !== "string") return false;
    if (
      typeof cr.outcomeGrade !== "string" ||
      !VALID_OUTCOME_GRADES.has(cr.outcomeGrade)
    )
      return false;
    if (typeof cr.margin !== "number") return false;
    if (!Array.isArray(cr.breakdown)) return false;
  }

  if (env.ensemble) {
    const ens = env.ensemble as Record<string, unknown>;
    if (
      typeof ens.presenceMode !== "string" ||
      !VALID_PRESENCE_MODES.has(ens.presenceMode)
    )
      return false;
    if (!Array.isArray(ens.activeSpeakers)) return false;
  }

  return true;
};
