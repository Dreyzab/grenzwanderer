import {
  matchesSkillCheckThought,
  parseCharacterReactionProposal,
  parseGenerateCharacterReactionPayload,
  parseGenerateDialogueEnvelope,
  parseGenerateDialoguePayload,
  parseGenerateDialogueResponse,
} from "../ai/contracts";
import type { SceneResultEnvelope } from "../ai/sceneResultEnvelope";
import { canonicalVoiceIdFor } from "../ai/voiceCanonicalization";
import { collectCaseIdsFromVnConditions } from "../mindpalace/focusLens";
import { getNpcDisplayName } from "../../shared/game/socialPresentation";
import type { VnSession } from "../../shared/spacetime/bindings";
import { formatSkillCheckVoiceLabel } from "./skillCheckPalette";
import type { VnChoice, VnSnapshot } from "./types";
import type {
  ActiveAiThoughtContext,
  ActiveReactionContext,
  SkillCheckResultLike,
} from "./vnScreenTypes";

export const AUTO_CONTINUE_PREFIX = "AUTO_CONTINUE_";
export const TAP_CONTINUE_COOLDOWN_MS = 220;
export const ACTIVE_SKILL_ARMING_MS = 300;
export const ACTIVE_SKILL_ROLLING_MS = 1200;
export const ACTIVE_SKILL_IMPACT_MS = 500;
export const AI_FOCUS_INTERLUDE_NODE_ID = "scene_case01_occult_bank_interlude";

const isOutcomeGrade = (
  value: unknown,
): value is NonNullable<SceneResultEnvelope["checkResult"]>["outcomeGrade"] =>
  value === "fail" ||
  value === "success" ||
  value === "critical" ||
  value === "success_with_cost";

const isBreakdownEntry = (
  value: unknown,
): value is NonNullable<
  SceneResultEnvelope["checkResult"]
>["breakdown"][number] => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.source === "string" &&
    typeof entry.sourceId === "string" &&
    typeof entry.delta === "number" &&
    Number.isFinite(entry.delta)
  );
};

export const createRequestId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const normalizeBody = (body: string): string =>
  body.replace(/\s+/g, " ").replace(/\|/g, " ").trim();

export const formatSpeaker = (
  characterId?: string,
  snapshot?: VnSnapshot | null,
): string => {
  if (!characterId) {
    return "Narrator";
  }

  return getNpcDisplayName(snapshot?.socialCatalog, characterId);
};

export const formatVoiceLabel = (voiceId: string): string =>
  formatSkillCheckVoiceLabel(voiceId);

export const collectChoiceLensCaseIds = (choice: VnChoice): string[] => [
  ...collectCaseIdsFromVnConditions(choice.visibleIfAll),
  ...collectCaseIdsFromVnConditions(choice.visibleIfAny),
  ...collectCaseIdsFromVnConditions(choice.requireAll),
  ...collectCaseIdsFromVnConditions(choice.requireAny),
  ...collectCaseIdsFromVnConditions(choice.conditions),
];

export const buildCheckKey = (
  scenarioId: string,
  nodeId: string,
  checkId: string,
): string => `${scenarioId}::${nodeId}::${checkId}`;

export const buildChoiceKey = (
  scenarioId: string,
  nodeId: string,
  choiceId: string,
): string => `${scenarioId}::${nodeId}::${choiceId}`;

export const buildAiThoughtKey = (
  scenarioId: string,
  nodeId: string,
  checkId: string,
  choiceId: string,
  resultCreatedAtMicros: bigint,
): string =>
  `${scenarioId}::${nodeId}::${checkId}::${choiceId}::${resultCreatedAtMicros.toString()}`;

export const buildReactionKey = (
  scenarioId: string,
  nodeId: string,
  characterId: string,
  sessionPointerValue: string,
): string => `${scenarioId}::${nodeId}::${characterId}::${sessionPointerValue}`;

export const unwrapOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string; value?: unknown };
    if (tagged.tag === "some" && typeof tagged.value === "string") {
      return tagged.value;
    }
  }
  return null;
};

export const hasOptionalValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "object" && value !== null && "tag" in value) {
    const tagged = value as { tag?: string };
    return tagged.tag === "some";
  }
  return true;
};

export const resolveOutcomeGrade = (
  value: unknown,
  passed: boolean,
): NonNullable<SceneResultEnvelope["checkResult"]>["outcomeGrade"] => {
  const parsed = unwrapOptionalString(value);
  return isOutcomeGrade(parsed) ? parsed : passed ? "success" : "fail";
};

export const parseSkillCheckBreakdown = (
  value: unknown,
  voiceId: string,
  voiceLevel: number,
): NonNullable<SceneResultEnvelope["checkResult"]>["breakdown"] => {
  const parsed = unwrapOptionalString(value);
  if (!parsed) {
    return [{ source: "voice", sourceId: voiceId, delta: voiceLevel }];
  }

  try {
    const json = JSON.parse(parsed) as unknown;
    if (Array.isArray(json) && json.every(isBreakdownEntry)) {
      return json;
    }
  } catch {
    // Fall through to the deterministic voice-only fallback.
  }

  return [{ source: "voice", sourceId: voiceId, delta: voiceLevel }];
};

export const sumBreakdownDelta = (
  breakdown: NonNullable<SceneResultEnvelope["checkResult"]>["breakdown"],
): number => breakdown.reduce((sum, entry) => sum + entry.delta, 0);

export const normalizeNumeric = (
  value: number | bigint | null | undefined,
): number => (typeof value === "bigint" ? Number(value) : (value ?? 0));

export const timestampMicros = (value: unknown): bigint => {
  if (
    typeof value === "object" &&
    value !== null &&
    "microsSinceUnixEpoch" in value
  ) {
    const micros = (
      value as { microsSinceUnixEpoch?: number | bigint | string }
    ).microsSinceUnixEpoch;
    if (typeof micros === "bigint") {
      return micros;
    }
    if (typeof micros === "number" && Number.isFinite(micros)) {
      return BigInt(Math.trunc(micros));
    }
    if (typeof micros === "string" && micros.trim().length > 0) {
      return BigInt(micros);
    }
  }

  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return BigInt(value);
  }

  return 0n;
};

export const parseStoredDialogueResponse = (value: unknown) => {
  const envelope = parseGenerateDialogueEnvelope(value);
  if (envelope) {
    return {
      ...envelope,
      canonicalVoiceId: canonicalVoiceIdFor(envelope.canonicalVoiceId),
    };
  }

  const legacyResponse = parseGenerateDialogueResponse(value);
  if (!legacyResponse) {
    return null;
  }

  return {
    ...legacyResponse,
    canonicalVoiceId: canonicalVoiceIdFor(legacyResponse.canonicalVoiceId),
  };
};

export const parseStoredCharacterReactionResponse = (value: unknown) =>
  parseCharacterReactionProposal(value);

export const isCompletionRouteBlockedError = (message: string): boolean =>
  message.includes("Scenario start is blocked by completion route rules");

export const checkResultMatches = (
  result: Pick<SkillCheckResultLike, "scenarioId" | "nodeId" | "checkId">,
  scenarioId: string,
  nodeId: string,
  checkId: string,
): boolean =>
  result.scenarioId === scenarioId &&
  result.nodeId === nodeId &&
  result.checkId === checkId;

export const aiRequestMatchesContext = (
  entry: { payloadJson: unknown; createdAt: unknown },
  context: ActiveAiThoughtContext,
): boolean => {
  const payload = parseGenerateDialoguePayload(
    typeof entry.payloadJson === "string" ? entry.payloadJson : null,
  );
  if (
    matchesSkillCheckThought(
      payload,
      context.scenarioId,
      context.nodeId,
      context.checkId,
      context.choiceId,
    )
  ) {
    return timestampMicros(entry.createdAt) >= context.resultCreatedAtMicros;
  }

  if (typeof entry.payloadJson !== "string") {
    return false;
  }

  return (
    entry.payloadJson.includes(`"scenarioId":"${context.scenarioId}"`) &&
    entry.payloadJson.includes(`"nodeId":"${context.nodeId}"`) &&
    entry.payloadJson.includes(`"checkId":"${context.checkId}"`) &&
    entry.payloadJson.includes(`"choiceId":"${context.choiceId}"`) &&
    timestampMicros(entry.createdAt) >= context.resultCreatedAtMicros
  );
};

export const reactionRequestMatchesContext = (
  entry: { payloadJson: unknown; createdAt: unknown },
  context: ActiveReactionContext,
): boolean => {
  const payload = parseGenerateCharacterReactionPayload(
    typeof entry.payloadJson === "string" ? entry.payloadJson : null,
  );
  return (
    payload?.characterId === context.characterId &&
    payload?.scenarioId === context.scenarioId &&
    payload?.nodeId === context.nodeId &&
    timestampMicros(entry.createdAt) >= context.sessionUpdatedAtMicros
  );
};

export const isAutoContinueChoice = (choice: VnChoice): boolean =>
  choice.id.startsWith(AUTO_CONTINUE_PREFIX);

export const sessionPointer = (session: VnSession | null): string | null => {
  if (!session) {
    return null;
  }

  const updatedAt = session.updatedAt as
    | { microsSinceUnixEpoch?: unknown }
    | undefined;
  const updatedToken =
    updatedAt && "microsSinceUnixEpoch" in updatedAt
      ? String(updatedAt.microsSinceUnixEpoch)
      : String(session.updatedAt);

  return `${session.nodeId}::${updatedToken}`;
};

export const waitMs = (time: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, time);
  });

export const nowMs = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();
