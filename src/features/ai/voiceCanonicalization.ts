/**
 * Canonicalize a voice ID returned by the AI layer.
 * Currently a pass-through; extend with alias mapping when needed.
 */
export const canonicalVoiceIdFor = (raw: string): string =>
  raw?.trim().toLowerCase() ?? "";
