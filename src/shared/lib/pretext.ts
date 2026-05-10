import {
  clearCache as pretextClearCache,
  layout,
  layoutNextLine,
  prepare,
  prepareWithSegments,
  walkLineRanges,
  type LayoutCursor,
  type PreparedText,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

export type WhiteSpaceMode = "normal" | "pre-wrap";

const PREPARE_OPTIONS_CACHE: Record<
  WhiteSpaceMode,
  { whiteSpace: WhiteSpaceMode }
> = {
  normal: { whiteSpace: "normal" },
  "pre-wrap": { whiteSpace: "pre-wrap" },
};

const LRU_CAPACITY = 512;

class Lru<K, V> {
  private readonly map = new Map<K, V>();

  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }

  clear(): void {
    this.map.clear();
  }
}

const cacheKey = (
  text: string,
  font: string,
  whiteSpace: WhiteSpaceMode,
): string => `${whiteSpace}\0${font}\0${text}`;

const preparedCache = new Lru<string, PreparedText>(LRU_CAPACITY);
const preparedWithSegmentsCache = new Lru<string, PreparedTextWithSegments>(
  LRU_CAPACITY,
);

export function getPreparedText(
  text: string,
  font: string,
  whiteSpace: WhiteSpaceMode = "normal",
): PreparedText {
  const key = cacheKey(text, font, whiteSpace);
  const cached = preparedCache.get(key);
  if (cached) return cached;
  const fresh = prepare(text, font, PREPARE_OPTIONS_CACHE[whiteSpace]);
  preparedCache.set(key, fresh);
  return fresh;
}

export function getPreparedTextWithSegments(
  text: string,
  font: string,
  whiteSpace: WhiteSpaceMode = "normal",
): PreparedTextWithSegments {
  const key = cacheKey(text, font, whiteSpace);
  const cached = preparedWithSegmentsCache.get(key);
  if (cached) return cached;
  const fresh = prepareWithSegments(
    text,
    font,
    PREPARE_OPTIONS_CACHE[whiteSpace],
  );
  preparedWithSegmentsCache.set(key, fresh);
  return fresh;
}

export interface ParagraphMeasurement {
  height: number;
  lineCount: number;
}

export function measureParagraphHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  whiteSpace: WhiteSpaceMode = "normal",
): ParagraphMeasurement {
  if (!text || maxWidth <= 0 || lineHeight <= 0) {
    return { height: 0, lineCount: 0 };
  }
  const prepared = getPreparedText(text, font, whiteSpace);
  const result = layout(prepared, maxWidth, lineHeight);
  return { height: result.height, lineCount: result.lineCount };
}

export function measureSingleLineWidth(
  text: string,
  font: string,
  whiteSpace: WhiteSpaceMode = "normal",
): number {
  if (!text) return 0;
  const prepared = getPreparedTextWithSegments(text, font, whiteSpace);
  let width = 0;
  walkLineRanges(prepared, Number.MAX_SAFE_INTEGER, (line) => {
    if (line.width > width) width = line.width;
  });
  return width;
}

export interface TruncateOptions {
  text: string;
  font: string;
  maxWidth: number;
  lineHeight: number;
  maxLines: number;
  ellipsis?: string;
  whiteSpace?: WhiteSpaceMode;
}

export interface TruncateResult {
  text: string;
  truncated: boolean;
  height: number;
  lineCount: number;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

const splitGraphemes = (value: string): string[] => {
  if (segmenter) {
    const out: string[] = [];
    for (const seg of segmenter.segment(value)) out.push(seg.segment);
    return out;
  }
  return Array.from(value);
};

export function truncateTextToLines(options: TruncateOptions): TruncateResult {
  const {
    text,
    font,
    maxWidth,
    lineHeight,
    maxLines,
    ellipsis = "…",
    whiteSpace = "normal",
  } = options;

  if (!text || maxLines <= 0 || maxWidth <= 0) {
    return { text: "", truncated: Boolean(text), height: 0, lineCount: 0 };
  }

  const measurement = measureParagraphHeight(
    text,
    font,
    maxWidth,
    lineHeight,
    whiteSpace,
  );
  if (measurement.lineCount <= maxLines) {
    return { ...measurement, text, truncated: false };
  }

  const graphemes = splitGraphemes(text);
  let lo = 0;
  let hi = graphemes.length;
  let bestText = "";

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const candidate = `${graphemes.slice(0, mid).join("").replace(/\s+$/u, "")}${ellipsis}`;
    const candidateMeasure = measureParagraphHeight(
      candidate,
      font,
      maxWidth,
      lineHeight,
      whiteSpace,
    );
    if (candidateMeasure.lineCount <= maxLines) {
      bestText = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const finalMeasure = measureParagraphHeight(
    bestText,
    font,
    maxWidth,
    lineHeight,
    whiteSpace,
  );
  return {
    text: bestText,
    truncated: true,
    height: finalMeasure.height,
    lineCount: finalMeasure.lineCount,
  };
}

export interface FloatLayoutOptions {
  text: string;
  font: string;
  fullWidth: number;
  narrowWidth: number;
  narrowLineLimit: number;
  lineHeight: number;
  whiteSpace?: WhiteSpaceMode;
}

export interface FloatLayoutResult {
  height: number;
  lineCount: number;
  /** Lines that ran inside the narrow region (next to the floated portrait). */
  narrowLineCount: number;
  /** Lines that flowed beneath the floated portrait at full width. */
  fullLineCount: number;
}

/**
 * Predicts paragraph height when the first `narrowLineLimit` lines render at `narrowWidth`
 * (because a portrait is floated next to them) and remaining lines render at `fullWidth`.
 * Mirrors how CSS `float: left` reflows text — used for predictable height animation.
 */
export function layoutAroundFloat(
  options: FloatLayoutOptions,
): FloatLayoutResult {
  const {
    text,
    font,
    fullWidth,
    narrowWidth,
    narrowLineLimit,
    lineHeight,
    whiteSpace = "normal",
  } = options;

  if (!text || fullWidth <= 0 || lineHeight <= 0) {
    return { height: 0, lineCount: 0, narrowLineCount: 0, fullLineCount: 0 };
  }

  const prepared = getPreparedTextWithSegments(text, font, whiteSpace);
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let narrowLineCount = 0;
  let fullLineCount = 0;

  while (narrowLineCount < narrowLineLimit) {
    const width = narrowWidth > 0 ? narrowWidth : fullWidth;
    const line = layoutNextLine(prepared, cursor, width);
    if (!line) break;
    narrowLineCount += 1;
    cursor = line.end;
  }

  while (true) {
    const line = layoutNextLine(prepared, cursor, fullWidth);
    if (!line) break;
    fullLineCount += 1;
    cursor = line.end;
  }

  const lineCount = narrowLineCount + fullLineCount;
  return {
    height: lineCount * lineHeight,
    lineCount,
    narrowLineCount,
    fullLineCount,
  };
}

export function resetPretextCaches(): void {
  preparedCache.clear();
  preparedWithSegmentsCache.clear();
  try {
    pretextClearCache();
  } catch {
    /* ignore */
  }
}
