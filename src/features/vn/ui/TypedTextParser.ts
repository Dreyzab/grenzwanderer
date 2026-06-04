export interface ParsedTypedToken {
  type: string;
  text: string;
  payload: string;
  key: string;
}

export type ParsedTypedSegment =
  | { kind: "text"; text: string; bold?: boolean; italic?: boolean }
  | { kind: "token"; token: ParsedTypedToken; text: string };

const TYPED_TOKEN_MARKUP = /\[([a-z][a-z0-9_-]*):([^:\]]+):([^\]]+)\]/gi;
/** Inline emphasis: **bold** (group 1) and *italic* (group 2). Non-greedy, no `*` inside. */
const EMPHASIS_MARKUP = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/**
 * Splits a plain-text run into bold/italic/plain pieces.
 * Speaker markers (`**[Name]**:`) are stripped upstream by `parseSpeakerSegments`,
 * so here `**…**` / `*…*` is always authorial emphasis.
 */
const expandEmphasis = (
  text: string,
): Array<{ text: string; bold?: boolean; italic?: boolean }> => {
  const parts: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EMPHASIS_MARKUP)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ text: text.slice(lastIndex, start) });
    }
    if (match[1] !== undefined) {
      parts.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      parts.push({ text: match[2], italic: true });
    }
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  return parts;
};

export const parseTypedTextMarkup = (input: string): ParsedTypedSegment[] => {
  const segments: ParsedTypedSegment[] = [];
  let lastIndex = 0;

  const pushText = (text: string) => {
    if (!text) {
      return;
    }
    for (const part of expandEmphasis(text)) {
      if (part.text.length === 0) {
        continue;
      }
      segments.push({
        kind: "text",
        text: part.text,
        bold: part.bold,
        italic: part.italic,
      });
    }
  };

  for (const match of input.matchAll(TYPED_TOKEN_MARKUP)) {
    const fullMatch = match[0];
    const tokenType = match[1]?.trim().toLowerCase() ?? "";
    const tokenText = match[2]?.trim() ?? "";
    const tokenPayload = match[3]?.trim() ?? "";
    const start = match.index ?? 0;

    if (start > lastIndex) {
      pushText(input.slice(lastIndex, start));
    }

    if (
      tokenType.length > 0 &&
      tokenText.length > 0 &&
      tokenPayload.length > 0
    ) {
      const token = {
        type: tokenType,
        text: tokenText,
        payload: tokenPayload,
        key: `${tokenType}:${tokenPayload}:${start}`,
      };

      segments.push({
        kind: "token",
        text: tokenText,
        token,
      });
    } else {
      pushText(fullMatch);
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < input.length) {
    pushText(input.slice(lastIndex));
  }

  if (segments.length === 0) {
    segments.push({ kind: "text", text: input });
  }

  return segments;
};

export const parseClueMarkup = parseTypedTextMarkup;
