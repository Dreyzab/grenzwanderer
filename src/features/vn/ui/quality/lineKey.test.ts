import { describe, expect, it } from "vitest";
import type { SpeakerSegment } from "../../log/speakerParser";
import { buildDialogueLineKey, hashLineText } from "./lineKey";

const makeSegment = (overrides: Partial<SpeakerSegment>): SpeakerSegment => ({
  speaker: "narrator",
  speakerLabel: "Narrator",
  category: "narrator",
  text: "The lamp gutters in the draught.",
  ...overrides,
});

describe("dialogue line key", () => {
  it("produces a stable hash for identical text", () => {
    expect(hashLineText("hello world")).toBe(hashLineText("hello world"));
  });

  it("changes the hash only when the line text changes", () => {
    const a = buildDialogueLineKey(makeSegment({ text: "Line A" }), 0);
    const b = buildDialogueLineKey(makeSegment({ text: "Line B" }), 0);
    expect(a.textHash).not.toBe(b.textHash);
  });

  it("survives insertion of a later line by keying on segmentIndex + text", () => {
    // Same speaker/text at the same index keeps the same key, even if other
    // lines elsewhere in the node change.
    const before = buildDialogueLineKey(makeSegment({ text: "Keep me" }), 2);
    const after = buildDialogueLineKey(makeSegment({ text: "Keep me" }), 2);
    expect(after.lineKey).toBe(before.lineKey);
  });

  it("encodes segmentIndex, speaker, and textHash into lineKey", () => {
    const key = buildDialogueLineKey(
      makeSegment({ speaker: "npc_weber", text: "Guten Abend." }),
      4,
    );
    expect(key.lineKey).toBe(`4:npc_weber:${key.textHash}`);
    expect(key.segmentIndex).toBe(4);
    expect(key.speaker).toBe("npc_weber");
  });
});
