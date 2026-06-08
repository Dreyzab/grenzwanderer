import type { SpeakerSegment } from "../../log/speakerParser";

export interface DialogueLineKey {
  segmentIndex: number;
  speaker: string;
  textHash: string;
  lineKey: string;
}

/**
 * Stable FNV-1a 32-bit hash of the segment text, rendered as zero-padded hex.
 * Used so a dialogue rating stays attached to its line after small text edits
 * elsewhere in the node (the hash only changes when *this* line's text changes).
 */
export const hashLineText = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts to stay in integer range.
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const buildDialogueLineKey = (
  segment: SpeakerSegment,
  segmentIndex: number,
): DialogueLineKey => {
  const textHash = hashLineText(segment.text);
  return {
    segmentIndex,
    speaker: segment.speaker,
    textHash,
    lineKey: `${segmentIndex}:${segment.speaker}:${textHash}`,
  };
};
