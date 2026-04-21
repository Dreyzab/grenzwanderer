import type { DialogueNode, Speaker } from "../../features/vn/types";

const resolveAssetPath = (path: string): string => {
  if (!path || path.startsWith("http") || path.startsWith("/")) return path;
  return `/vn/assets/${path}`;
};

import {
  INNER_VOICE_DEFINITIONS,
  isInnerVoiceId,
} from "../../../data/innerVoiceContract";

export type TranscriptSpeakerKind = "character" | "voice" | "narrator";
export type TranscriptMediaKind =
  | "background"
  | "character"
  | "voice"
  | "image";

export interface TranscriptCharacterSource {
  id: string;
  name: string;
  sprite?: string;
}

export interface TranscriptMediaSlot {
  kind: TranscriptMediaKind;
  id: string;
  label: string;
  url?: string;
  accentColor?: string;
  accentSoft?: string;
  abbreviation?: string;
  isFallback?: boolean;
}

export interface ResolvedTranscriptMedia {
  background: TranscriptMediaSlot | null;
  character: TranscriptMediaSlot | null;
  voice: TranscriptMediaSlot | null;
  images: TranscriptMediaSlot[];
}

export interface ResolvedTranscriptLine {
  key: string;
  sceneId: string;
  lineIndex: number;
  nodeId?: string;
  text: string;
  speakerKind: TranscriptSpeakerKind;
  speakerLabel: string;
  emotionLabel?: string;
  backgroundUrl?: string;
  media: ResolvedTranscriptMedia;
}

export interface CurrentSceneTranscriptBlock {
  backgroundUrl: string;
  lines: ResolvedTranscriptLine[];
}

export interface ResolveCurrentSceneTranscriptLineArgs {
  sceneId: string;
  lineIndex: number;
  backgroundUrl?: string;
  node: DialogueNode;
  characters?: TranscriptCharacterSource[];
}

interface VoiceRegistryEntry {
  key: string;
  label: string;
  accentColor: string;
  accentSoft: string;
  aliases: string[];
}

const CHARACTER_ACCENT = "#67e8f9";
const CHARACTER_ACCENT_SOFT = "rgba(103, 232, 249, 0.16)";
const NARRATOR_LABEL = "Narrator";

const VOICE_REGISTRY: VoiceRegistryEntry[] = [
  {
    key: "authority",
    label: "Authority",
    accentColor: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.18)",
    aliases: ["authority", "авторитет", "attr authority", "attr_authority"],
  },
  {
    key: "charisma",
    label: "Charisma",
    accentColor: "#f472b6",
    accentSoft: "rgba(244, 114, 182, 0.18)",
    aliases: ["charisma", "харизма", "attr charisma", "attr_charisma"],
  },
  {
    key: "cynicism",
    label: "Cynicism",
    accentColor: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.18)",
    aliases: ["cynicism", "цинизм", "attr cynicism", "attr_cynicism"],
  },
  {
    key: "dopamine",
    label: "Dopamine",
    accentColor: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.18)",
    aliases: ["dopamine", "дофамин"],
  },
  {
    key: "empathy",
    label: "Empathy",
    accentColor: "#2dd4bf",
    accentSoft: "rgba(45, 212, 191, 0.18)",
    aliases: ["empathy", "эмпатия", "attr empathy", "attr_empathy"],
  },
  {
    key: "encyclopedia",
    label: "Encyclopedia",
    accentColor: "#60a5fa",
    accentSoft: "rgba(96, 165, 250, 0.18)",
    aliases: [
      "encyclopedia",
      "encyclopaedia",
      "энциклопедия",
      "attr encyclopedia",
      "attr_encyclopedia",
    ],
  },
  {
    key: "endurance",
    label: "Endurance",
    accentColor: "#22c55e",
    accentSoft: "rgba(34, 197, 94, 0.18)",
    aliases: ["endurance", "выносливость", "attr endurance", "attr_endurance"],
  },
  {
    key: "intuition",
    label: "Intuition",
    accentColor: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.18)",
    aliases: ["intuition", "интуиция", "attr intuition", "attr_intuition"],
  },
  {
    key: "logic",
    label: "Logic",
    accentColor: "#818cf8",
    accentSoft: "rgba(129, 140, 248, 0.18)",
    aliases: ["logic", "логика", "attr logic", "attr_logic"],
  },
  {
    key: "paranoia",
    label: "Paranoia",
    accentColor: "#f87171",
    accentSoft: "rgba(248, 113, 113, 0.18)",
    aliases: ["paranoia", "паранойя", "attr paranoia", "attr_paranoia"],
  },
  {
    key: "perception",
    label: "Perception",
    accentColor: "#22d3ee",
    accentSoft: "rgba(34, 211, 238, 0.18)",
    aliases: ["perception", "восприятие", "attr perception", "attr_perception"],
  },
  {
    key: "philosophy",
    label: "Philosophy",
    accentColor: "#c084fc",
    accentSoft: "rgba(192, 132, 252, 0.18)",
    aliases: ["philosophy", "философия"],
  },
  {
    key: "professional",
    label: "Professional",
    accentColor: "#94a3b8",
    accentSoft: "rgba(148, 163, 184, 0.18)",
    aliases: ["professional", "профессионал", "профессионализм"],
  },
  {
    key: "reflexes",
    label: "Reflexes",
    accentColor: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.18)",
    aliases: ["reflexes", "рефлексы", "attr reflexes", "attr_reflexes"],
  },
  {
    key: "strength",
    label: "Strength",
    accentColor: "#f97316",
    accentSoft: "rgba(249, 115, 22, 0.18)",
    aliases: ["strength", "сила", "attr strength", "attr_strength"],
  },
  {
    key: "technophile",
    label: "Technophile",
    accentColor: "#14b8a6",
    accentSoft: "rgba(20, 184, 166, 0.18)",
    aliases: ["technophile", "технофил", "технофилия", "attr technophile"],
  },
];

const normalizeToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");

const abbreviateLabel = (label: string): string => {
  const parts = label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const compact = parts[0] ?? label;
  return compact.slice(0, 2).toUpperCase();
};

const resolveSpeakerFields = (
  node: DialogueNode,
): {
  text: string;
  speakerLabel: string;
  characterId?: string;
  emotionLabel?: string;
} => {
  const text = node.content?.text || node.text || "";
  const speaker = node.speaker;
  const speakerLabel =
    typeof speaker === "string"
      ? speaker
      : (speaker as Speaker | undefined)?.displayName || "";
  const characterId =
    node.characterId ||
    (typeof speaker === "object" && speaker
      ? (speaker as Speaker).characterId
      : undefined);
  const emotionRaw =
    typeof speaker === "object" && speaker
      ? (speaker as Speaker).emotion
      : node.emotion;
  const emotionLabel =
    typeof emotionRaw === "string"
      ? emotionRaw
      : emotionRaw?.primary || undefined;

  return {
    text,
    speakerLabel,
    characterId,
    emotionLabel,
  };
};

const resolveCharacterMatch = (
  speakerLabel: string,
  characterId: string | undefined,
  characters: readonly TranscriptCharacterSource[],
): TranscriptCharacterSource | undefined => {
  const normalizedLabel = normalizeToken(speakerLabel);

  return characters.find((candidate) => {
    if (characterId && candidate.id === characterId) {
      return true;
    }

    return (
      normalizedLabel.length > 0 &&
      (normalizeToken(candidate.id) === normalizedLabel ||
        normalizeToken(candidate.name) === normalizedLabel)
    );
  });
};

const resolveVoiceEntry = (
  speakerLabel: string,
  characterId: string | undefined,
) => {
  const candidates = [characterId, speakerLabel].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeToken(candidate);
    const compactCandidate = normalizedCandidate.replace(/\s+/g, "");

    const entry = VOICE_REGISTRY.find((voice) =>
      voice.aliases.some((alias) => {
        const normalizedAlias = normalizeToken(alias);
        const compactAlias = normalizedAlias.replace(/\s+/g, "");
        return (
          normalizedCandidate === normalizedAlias ||
          compactCandidate === compactAlias ||
          normalizedCandidate.includes(normalizedAlias) ||
          compactCandidate.includes(compactAlias)
        );
      }),
    );

    if (entry) {
      return entry;
    }
  }

  return undefined;
};

const buildBackgroundSlot = (
  backgroundUrl?: string,
): TranscriptMediaSlot | null =>
  backgroundUrl
    ? {
        kind: "background",
        id: backgroundUrl,
        label: "Scene background",
        url: backgroundUrl,
      }
    : null;

const buildCharacterSlot = (
  label: string,
  character?: TranscriptCharacterSource,
): TranscriptMediaSlot => {
  const portraitUrl = character?.sprite
    ? resolveAssetPath(character.sprite)
    : undefined;

  return {
    kind: "character",
    id: character?.id || normalizeToken(label) || "character",
    label: character?.name || label,
    url: portraitUrl,
    abbreviation: abbreviateLabel(character?.name || label),
    accentColor: CHARACTER_ACCENT,
    accentSoft: CHARACTER_ACCENT_SOFT,
    isFallback: !portraitUrl,
  };
};

const buildVoiceSlot = (
  speakerLabel: string,
  characterId?: string,
): TranscriptMediaSlot | null => {
  if (characterId && isInnerVoiceId(characterId)) {
    const definition = INNER_VOICE_DEFINITIONS[characterId];
    return {
      kind: "voice",
      id: characterId,
      label: definition.label,
      abbreviation: abbreviateLabel(definition.label),
      accentColor: definition.palette.accent,
      accentSoft: definition.palette.accentSoft,
      isFallback: true,
    };
  }

  const entry = resolveVoiceEntry(speakerLabel, characterId);
  if (!entry) {
    return null;
  }

  return {
    kind: "voice",
    id: entry.key,
    label: speakerLabel || entry.label,
    url: `/images/voices/${entry.key}.svg`,
    abbreviation: abbreviateLabel(speakerLabel || entry.label),
    accentColor: entry.accentColor,
    accentSoft: entry.accentSoft,
    isFallback: false,
  };
};

export const buildCurrentSceneTranscriptLineKey = (
  sceneId: string,
  lineIndex: number,
  node: DialogueNode,
): string => {
  const text = node.content?.text || node.text || "";
  return `${sceneId}:${lineIndex}:${node.id || text}`;
};

export const resolveCurrentSceneTranscriptLine = ({
  sceneId,
  lineIndex,
  backgroundUrl,
  node,
  characters = [],
}: ResolveCurrentSceneTranscriptLineArgs): ResolvedTranscriptLine | null => {
  const { text, speakerLabel, characterId, emotionLabel } =
    resolveSpeakerFields(node);

  if (!text.trim()) {
    return null;
  }

  const character = resolveCharacterMatch(
    speakerLabel,
    characterId,
    characters,
  );
  const voice = buildVoiceSlot(speakerLabel, characterId);
  const hasSpeaker = Boolean(speakerLabel.trim() || characterId);

  let speakerKind: TranscriptSpeakerKind = "narrator";
  let resolvedSpeakerLabel = speakerLabel.trim();

  if (character || (hasSpeaker && !voice)) {
    speakerKind = "character";
    resolvedSpeakerLabel =
      character?.name || speakerLabel.trim() || characterId || NARRATOR_LABEL;
  } else if (voice) {
    speakerKind = "voice";
    resolvedSpeakerLabel = speakerLabel.trim() || voice.label;
  } else if (hasSpeaker) {
    speakerKind = "character";
    resolvedSpeakerLabel = speakerLabel.trim() || characterId || NARRATOR_LABEL;
  } else {
    resolvedSpeakerLabel = NARRATOR_LABEL;
  }

  const media: ResolvedTranscriptMedia = {
    background: buildBackgroundSlot(backgroundUrl),
    character:
      speakerKind === "character"
        ? buildCharacterSlot(resolvedSpeakerLabel, character)
        : null,
    voice: speakerKind === "voice" ? voice : null,
    images: [],
  };

  return {
    key: buildCurrentSceneTranscriptLineKey(sceneId, lineIndex, node),
    sceneId,
    lineIndex,
    nodeId: node.id,
    text,
    speakerKind,
    speakerLabel: resolvedSpeakerLabel,
    emotionLabel,
    backgroundUrl,
    media,
  };
};
