export type ParsedTypedSegment =
  | { kind: "text"; text: string }
  | { kind: "clue"; text: string; payload: string };

const CLUE_MARKUP = /\[clue:([^:\]]+):([^\]]+)\]/gi;

export const parseClueMarkup = (input: string): ParsedTypedSegment[] => {
  const segments: ParsedTypedSegment[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(CLUE_MARKUP)) {
    const fullMatch = match[0];
    const tokenText = match[1]?.trim() ?? "";
    const tokenPayload = match[2]?.trim() ?? "";
    const start = match.index ?? 0;

    if (start > lastIndex) {
      segments.push({
        kind: "text",
        text: input.slice(lastIndex, start),
      });
    }

    if (tokenText.length > 0) {
      segments.push({
        kind: "clue",
        text: tokenText,
        payload: tokenPayload,
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
