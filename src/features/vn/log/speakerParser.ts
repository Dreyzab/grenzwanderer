import {
  INNER_VOICE_DEFINITIONS,
  isInnerVoiceId,
} from "../../../../data/innerVoiceContract";

export type SpeakerCategory = "narrator" | "npc" | "inner_voice" | "player";

export interface SpeakerSegment {
  speaker: string;
  speakerLabel: string;
  category: SpeakerCategory;
  text: string;
  portraitUrl?: string;
  accentColor?: string;
  textColor?: string;
}

const SPEAKER_MARKER_PATTERN = /\*\*\[(.+?)\]\*\*:\s*/g;

const normalizeSegmentText = (text: string): string =>
  text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

const formatSpeakerLabel = (speaker: string): string =>
  speaker
    .replace(/^inner_/, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildSegment = (
  speaker: string,
  text: string,
  dictionary?: any,
): SpeakerSegment | null => {
  const normalizedText = normalizeSegmentText(text);
  if (!normalizedText) {
    return null;
  }

  const normalizedSpeaker = speaker.trim() || "Narrator";
  const lowerSpeaker = normalizedSpeaker.toLowerCase();

  const getSpeakerLabel = (id: string, defaultLabel: string) => {
    return dictionary?.speakers?.[id] ?? defaultLabel;
  };

  if (lowerSpeaker === "narrator") {
    return {
      speaker: "Narrator",
      speakerLabel: getSpeakerLabel("narrator", "Narrator"),
      category: "narrator",
      text: normalizedText,
    };
  }

  if (lowerSpeaker === "player" || lowerSpeaker === "you") {
    return {
      speaker: normalizedSpeaker,
      speakerLabel: getSpeakerLabel("player", "You"),
      category: "player",
      text: normalizedText,
    };
  }

  if (isInnerVoiceId(normalizedSpeaker)) {
    const definition = INNER_VOICE_DEFINITIONS[normalizedSpeaker];
    return {
      speaker: normalizedSpeaker,
      speakerLabel: getSpeakerLabel(normalizedSpeaker, definition.label),
      category: "inner_voice",
      text: normalizedText,
      accentColor: definition.palette.accent,
      textColor: definition.palette.text,
    };
  }

  return {
    speaker: normalizedSpeaker,
    speakerLabel: getSpeakerLabel(
      normalizedSpeaker,
      formatSpeakerLabel(normalizedSpeaker),
    ),
    category: lowerSpeaker.startsWith("inner_") ? "inner_voice" : "npc",
    text: normalizedText,
  };
};

export function parseSpeakerSegments(
  body: string,
  dictionary?: any,
): SpeakerSegment[] {
  const source = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const segments: SpeakerSegment[] = [];
  let activeSpeaker = "Narrator";
  let cursor = 0;

  SPEAKER_MARKER_PATTERN.lastIndex = 0;
  for (
    let match = SPEAKER_MARKER_PATTERN.exec(source);
    match;
    match = SPEAKER_MARKER_PATTERN.exec(source)
  ) {
    const segment = buildSegment(
      activeSpeaker,
      source.slice(cursor, match.index),
      dictionary,
    );
    if (segment) {
      segments.push(segment);
    }

    activeSpeaker = match[1]?.trim() || "Narrator";
    cursor = match.index + match[0].length;
  }

  const trailingSegment = buildSegment(
    activeSpeaker,
    source.slice(cursor),
    dictionary,
  );
  if (trailingSegment) {
    segments.push(trailingSegment);
  }

  return segments;
}
