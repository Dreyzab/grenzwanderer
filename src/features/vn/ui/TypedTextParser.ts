export interface ParsedTypedToken {
  type: string;
  text: string;
  payload: string;
  key: string;
}

export type ParsedTypedSegment =
  | { kind: "text"; text: string }
  | { kind: "token"; token: ParsedTypedToken; text: string };

const TYPED_TOKEN_MARKUP = /\[([a-z][a-z0-9_-]*):([^:\]]+):([^\]]+)\]/gi;

export const parseTypedTextMarkup = (input: string): ParsedTypedSegment[] => {
  const segments: ParsedTypedSegment[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(TYPED_TOKEN_MARKUP)) {
    const fullMatch = match[0];
    const tokenType = match[1]?.trim().toLowerCase() ?? "";
    const tokenText = match[2]?.trim() ?? "";
    const tokenPayload = match[3]?.trim() ?? "";
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({
        kind: "text",
        text: input.slice(lastIndex, start),
      });
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
      segments.push({
        kind: "text",
        text: fullMatch,
      });
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < input.length) {
    segments.push({
      kind: "text",
      text: input.slice(lastIndex),
    });
  }

  if (segments.length === 0) {
    segments.push({ kind: "text", text: input });
  }

  return segments;
};

export const parseClueMarkup = parseTypedTextMarkup;
