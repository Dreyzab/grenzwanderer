import { parseSpeakerSegments, type SpeakerSegment } from "./speakerParser";
import {
  readPsycheState,
  resolveOverallInnerVoiceSelection,
} from "../../../shared/game/innerVoiceModel";
import {
  AI_DM_TURN_SOURCE_SIDE_PANEL,
  type DmInnerVoiceInput,
  type DmTurnProposal,
  type GenerateDmTurnPayload,
} from "../../ai/contracts";
import { INNER_VOICE_DEFINITIONS } from "../../../../data/innerVoiceContract";
import { getVoiceSkin } from "../../../../data/parliamentModules";
import { isParliamentVoiceVisible } from "../parliamentVisibility";
import {
  WITCH_ALCOHOL_AFTERTASTE_VAR,
  WITCH_BLOOD_CURSE_PRESSURE_VAR,
  WITCH_BLOOD_CURSE_TIER_VAR,
  WITCH_BLOOD_DEBT_VAR,
  WITCH_BLOOD_POWER_VAR,
} from "../../../shared/game/witchRules";

// The parliament itself — which voices speak and their stance — is the real DM
// mechanic, ported via resolveOverallInnerVoiceSelection (same call VnDmSidePanel
// uses to convene dominant/support/counter from the player's psyche).
//
// ponytail: only the line TEXT is a deterministic stub. Swap lineFor for the AI
// reflect call later — map selection.ordered -> DmInnerVoiceInput[] exactly like
// VnDmSidePanel, the markers -> parseSpeakerSegments -> appendSegments path stays.
function lineFor(stance: "supports" | "opposes", question: string): string {
  return stance === "opposes"
    ? `А если иначе: «${question}» — корень не здесь. Реши и держи курс.`
    : `Ты спрашиваешь: «${question}». Вопрос честный — побудь с ним.`;
}

// Local fallback used when AI is disabled or a request fails — keeps ponder from
// hanging in "thinking" forever. Voices the real parliament but with stub text.
export function buildPonderAnswerSegments(
  prompt: string,
  vars: Readonly<Record<string, number>>,
  dictionary?: Parameters<typeof parseSpeakerSegments>[1],
): SpeakerSegment[] {
  const question = prompt.trim().replace(/\s+/g, " ");
  const selection = resolveOverallInnerVoiceSelection(vars);
  const body = selection.ordered
    .map(
      (entry) => `**[${entry.voiceId}]**: ${lineFor(entry.stance, question)}`,
    )
    .join("\n\n");
  return parseSpeakerSegments(body, dictionary);
}

const resolvePonderToneMode = (
  nodeId: string,
  pressure: number,
): GenerateDmTurnPayload["toneMode"] => {
  if (pressure >= 50) {
    return "threat";
  }
  if (/estate|ghost|evidence/.test(nodeId)) {
    return "gothic_mystery";
  }
  return "safe_chekhovian";
};

export interface PonderDmPayloadArgs {
  scenarioId: string;
  nodeId: string;
  question: string;
  resources: GenerateDmTurnPayload["resources"];
  vars: Readonly<Record<string, number>>;
  flags: Readonly<Record<string, boolean>>;
  visibleFacts: readonly string[];
  parliamentPresetId?: string;
}

// Real AI path: build a propose_dm_turn payload addressing the same parliament the
// DM side panel convenes, with the player's question as the action and a
// debate beat (so the proposal carries innerVoiceDialogue). Mirrors
// VnDmSidePanel.buildDmPayload — kept here so ponder needs no DM-panel state.
export function buildPonderDmPayload(
  args: PonderDmPayloadArgs,
): GenerateDmTurnPayload {
  const selection = resolveOverallInnerVoiceSelection(args.vars);
  const innerVoices: DmInnerVoiceInput[] = selection.ordered
    .filter((entry) =>
      isParliamentVoiceVisible(
        entry.voiceId,
        args.flags,
        args.parliamentPresetId,
      ),
    )
    .map((entry) => {
      const definition = INNER_VOICE_DEFINITIONS[entry.voiceId];
      const skin = getVoiceSkin(args.parliamentPresetId, entry.voiceId);
      return {
        voiceId: entry.voiceId,
        role: entry.role,
        stance: entry.stance,
        label: skin?.label ?? definition.label,
        worldview:
          skin?.persona?.coreDrive ??
          skin?.persona?.motto ??
          definition.worldview,
        toneDescriptor:
          skin?.persona?.speechPattern ?? definition.toneDescriptor,
      };
    });

  const bloodCurse = {
    tier: Math.trunc(args.vars[WITCH_BLOOD_CURSE_TIER_VAR] ?? 1),
    pressure: Math.trunc(args.vars[WITCH_BLOOD_CURSE_PRESSURE_VAR] ?? 0),
    power: Math.trunc(args.vars[WITCH_BLOOD_POWER_VAR] ?? 0),
    debt: Math.trunc(args.vars[WITCH_BLOOD_DEBT_VAR] ?? 0),
    alcoholAftertaste: Math.trunc(args.vars[WITCH_ALCOHOL_AFTERTASTE_VAR] ?? 0),
  };

  return {
    source: AI_DM_TURN_SOURCE_SIDE_PANEL,
    scenarioId: args.scenarioId,
    nodeId: args.nodeId,
    actionText: args.question.trim() || "Обдумай это вслух.",
    spendFateToken: false,
    fortuneSpend: 0,
    moveTags: [],
    resources: args.resources,
    psyche: {
      ...readPsycheState(args.vars),
      dominantInnerVoiceId: selection.dominant?.voiceId ?? null,
      activeInnerVoiceIds: innerVoices.map((voice) => voice.voiceId),
    },
    bloodCurse,
    activeSessionFacts: [],
    acceptedRemarks: [],
    visibleFacts: args.visibleFacts,
    activeFlags: Object.entries(args.flags)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .sort(),
    innerVoices,
    beatDirective: { kind: "debate_options" },
    toneMode: resolvePonderToneMode(args.nodeId, bloodCurse.pressure),
    locale: "ru",
  };
}

// Convert the AI proposal's inner-voice debate into log segments (same marker
// round-trip as the fallback, so rendering is identical).
export function ponderProposalToSegments(
  proposal: DmTurnProposal,
  dictionary?: Parameters<typeof parseSpeakerSegments>[1],
): SpeakerSegment[] {
  const body = (proposal.innerVoiceDialogue ?? [])
    .map((line) => `**[${line.voiceId}]**: ${line.line}`)
    .join("\n\n");
  return parseSpeakerSegments(body, dictionary);
}
