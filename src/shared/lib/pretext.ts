import {
  clearCache as clearPretextCache,
  layout,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  walkLineRanges,
  type PrepareOptions,
  type PreparedText,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

const SINGLE_LINE_WIDTH = 100_000;
const DEFAULT_WHITE_SPACE = "normal";
const MAX_PREPARED_CACHE_ENTRIES = 512;

const preparedTextCache = new Map<string, PreparedText>();
const preparedSegmentsCache = new Map<string, PreparedTextWithSegments>();

function touchLruGet<K, V>(map: Map<K, V>, key: K): V | undefined {
  const value = map.get(key);
  if (value === undefined) return undefined;
  map.delete(key);
  map.set(key, value);
  return value;
}

function setLru<K, V>(
  map: Map<K, V>,
  key: K,
  value: V,
  maxEntries: number,
): void {
  map.delete(key);
  map.set(key, value);
  while (map.size > maxEntries) {
    const first = map.keys().next().value as K | undefined;
    if (first === undefined) break;
    map.delete(first);
  }
}

type TruncateTextOptions = {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
  maxLines: number;
  ellipsis?: string;
  whiteSpace?: PrepareOptions["whiteSpace"];
};

export type TruncateTextResult = {
  text: string;
  truncated: boolean;
  fullLineCount: number;
  visibleLineCount: number;
};

function getCacheKey(
  text: string,
  font: string,
  whiteSpace: PrepareOptions["whiteSpace"],
) {
  return `${font}__${whiteSpace ?? DEFAULT_WHITE_SPACE}__${text}`;
}

function getPrepareOptions(
  whiteSpace: PrepareOptions["whiteSpace"],
): PrepareOptions | undefined {
  if (!whiteSpace || whiteSpace === DEFAULT_WHITE_SPACE) return undefined;
  return { whiteSpace };
}

export function resetPretextCaches(): void {
  preparedTextCache.clear();
  preparedSegmentsCache.clear();
  clearPretextCache();
}

export function getPreparedText(
  text: string,
  font: string,
  whiteSpace?: PrepareOptions["whiteSpace"],
): PreparedText {
  const key = getCacheKey(text, font, whiteSpace);
  const cached = touchLruGet(preparedTextCache, key);
  if (cached) return cached;

  const prepared = prepare(text, font, getPrepareOptions(whiteSpace));
  setLru(preparedTextCache, key, prepared, MAX_PREPARED_CACHE_ENTRIES);
  return prepared;
}

export function getPreparedTextWithSegments(
  text: string,
  font: string,
  whiteSpace?: PrepareOptions["whiteSpace"],
): PreparedTextWithSegments {
  const key = getCacheKey(text, font, whiteSpace);
  const cached = touchLruGet(preparedSegmentsCache, key);
  if (cached) return cached;

  const prepared = prepareWithSegments(
    text,
    font,
    getPrepareOptions(whiteSpace),
  );
  setLru(preparedSegmentsCache, key, prepared, MAX_PREPARED_CACHE_ENTRIES);
  return prepared;
}

export function measureParagraphHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  whiteSpace?: PrepareOptions["whiteSpace"],
) {
  if (!text) {
    return {
      height: lineHeight,
      lineCount: 1,
    };
  }

  const prepared = getPreparedText(text, font, whiteSpace);
  return layout(prepared, Math.max(1, Math.floor(maxWidth)), lineHeight);
}

export function measureSingleLineWidth(
  text: string,
  font: string,
  whiteSpace?: PrepareOptions["whiteSpace"],
): number {
  if (!text) return 0;

  let width = 0;
  const prepared = getPreparedTextWithSegments(text, font, whiteSpace);
  walkLineRanges(prepared, SINGLE_LINE_WIDTH, (line) => {
    width = Math.max(width, line.width);
  });
  return width;
}

function trimEndWhitespace(value: string): string {
  return value.replace(/\s+$/u, "");
}

function splitGraphemes(value: string): string[] {
  const IntlWithSegmenter = Intl as typeof Intl & {
    Segmenter?: new (
      locales?: string | string[],
      options?: { granularity?: "grapheme" | "word" | "sentence" },
    ) => {
      segment(input: string): Iterable<{ segment: string }>;
    };
  };

  if (typeof Intl !== "undefined" && IntlWithSegmenter.Segmenter) {
    const segmenter = new IntlWithSegmenter.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(value), (segment) => segment.segment);
  }

  return Array.from(value);
}

function prefixWidthForEllipsis(
  graphemes: string[],
  prefixLen: number,
  font: string,
): number {
  const raw = graphemes.slice(0, prefixLen).join("");
  return measureSingleLineWidth(trimEndWhitespace(raw), font);
}

function fitEllipsis(
  lastLineText: string,
  font: string,
  maxWidth: number,
  ellipsis: string,
): string {
  const ellipsisWidth = measureSingleLineWidth(ellipsis, font);
  if (ellipsisWidth > maxWidth) {
    return ellipsis;
  }

  const graphemes = splitGraphemes(trimEndWhitespace(lastLineText));
  const n = graphemes.length;
  if (n === 0) {
    return ellipsis;
  }

  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const w = prefixWidthForEllipsis(graphemes, mid, font);
    if (w + ellipsisWidth <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  if (lo === 0) {
    return ellipsis;
  }

  const fitted = trimEndWhitespace(graphemes.slice(0, lo).join(""));
  return `${fitted}${ellipsis}`;
}

export function truncateTextToLines({
  text,
  font,
  maxWidth,
  lineHeight,
  maxLines,
  ellipsis = "…",
  whiteSpace,
}: TruncateTextOptions): TruncateTextResult {
  if (!text || maxWidth <= 0 || maxLines <= 0) {
    return {
      text,
      truncated: false,
      fullLineCount: 0,
      visibleLineCount: 0,
    };
  }

  const prepared = getPreparedTextWithSegments(text, font, whiteSpace);
  const metrics = layoutWithLines(
    prepared,
    Math.max(1, Math.floor(maxWidth)),
    lineHeight,
  );

  if (metrics.lineCount <= maxLines) {
    return {
      text,
      truncated: false,
      fullLineCount: metrics.lineCount,
      visibleLineCount: metrics.lineCount,
    };
  }

  const visibleLines = metrics.lines.slice(0, maxLines);
  const leadingText = visibleLines
    .slice(0, -1)
    .map((line) => line.text)
    .join("");
  const lastLineText = visibleLines[maxLines - 1]?.text ?? "";
  const fittedLastLine = fitEllipsis(lastLineText, font, maxWidth, ellipsis);

  return {
    text: `${leadingText}${fittedLastLine}`,
    truncated: true,
    fullLineCount: metrics.lineCount,
    visibleLineCount: maxLines,
  };
}
