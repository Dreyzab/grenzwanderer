import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseSnapshot } from "./parser";

// Guards the journal dossier feature: the social-catalog parser whitelists
// fields, so NPC `bio` must be explicitly preserved or it silently vanishes at
// client load. Round-trip the real shipped snapshot to prove it survives.
describe("parseSnapshot preserves NPC bios", () => {
  const payload = readFileSync(
    resolve(process.cwd(), "content/vn/pilot.snapshot.json"),
    "utf8",
  );

  it("keeps the bio summary and progressive stages through parsing", () => {
    const snapshot = parseSnapshot(payload);
    expect(snapshot).not.toBeNull();

    const identities = snapshot!.socialCatalog?.npcIdentities ?? [];
    const withBio = identities.filter((npc) => npc.bio);
    expect(withBio.length).toBeGreaterThan(0);

    const lotte = identities.find((npc) => npc.id === "npc_weber_dispatcher");
    expect(lotte?.bio?.summary).toContain("telephone operator");
    expect(
      lotte?.bio?.stages?.some(
        (stage) => stage.revealFlag === "lotte_warning_heeded",
      ),
    ).toBe(true);
  });
});
