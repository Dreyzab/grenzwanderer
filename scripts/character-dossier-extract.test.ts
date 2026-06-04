import { describe, expect, it } from "vitest";
import {
  applyDossierExcerpts,
  parsePlayerDossier,
} from "./character-dossier-extract";

const note = (body: string): string =>
  `---\nid: char_x\nnpc_identity: npc_weber_dispatcher\n---\n\n# X\n\n${body}`;

describe("parsePlayerDossier", () => {
  it("returns null when there is no npc_identity", () => {
    expect(
      parsePlayerDossier(
        "---\nid: char_x\n---\n\n## Player Dossier\n- **A**: b",
      ),
    ).toBeNull();
  });

  it("returns null when there is no Player Dossier section", () => {
    expect(
      parsePlayerDossier(note("## Secrets\n- **Hidden**: spoiler")),
    ).toBeNull();
  });

  it("parses flagged and unflagged entries, ignoring other sections", () => {
    const excerpt = parsePlayerDossier(
      note(
        [
          "## Player Dossier",
          "",
          "- **Always Shown**: visible once met.",
          "- (reveal: lotte_warning_heeded) **Earned**: deeper truth.",
          "",
          "## Secrets",
          "- **Hidden**: this must never ship.",
        ].join("\n"),
      ),
    );
    expect(excerpt?.npcIdentity).toBe("npc_weber_dispatcher");
    expect(excerpt?.stages).toEqual([
      { heading: "Always Shown", text: "visible once met." },
      {
        revealFlag: "lotte_warning_heeded",
        heading: "Earned",
        text: "deeper truth.",
      },
    ]);
  });

  it("does not leak design-only sections (Secrets/Evolution stay out)", () => {
    const excerpt = parsePlayerDossier(
      note(
        "## Player Dossier\n- **Safe**: ok\n\n## Evolution\n- **Stage 3**: crisis spoiler",
      ),
    );
    expect(excerpt?.stages).toHaveLength(1);
    expect(JSON.stringify(excerpt)).not.toContain("crisis spoiler");
  });
});

describe("applyDossierExcerpts", () => {
  const npcs = [
    {
      id: "npc_weber_dispatcher",
      bio: {
        summary: "Operator.",
        stages: [{ heading: "Existing", text: "a" }],
      },
    },
    { id: "npc_no_bio" },
  ];

  it("appends excerpt stages onto an NPC that already has a bio", () => {
    const result = applyDossierExcerpts(npcs, [
      {
        npcIdentity: "npc_weber_dispatcher",
        stages: [{ revealFlag: "f", heading: "New", text: "b" }],
      },
    ]);
    expect(result[0].bio?.stages?.map((s) => s.heading)).toEqual([
      "Existing",
      "New",
    ]);
  });

  it("skips NPCs without a bio (catalog owns the summary)", () => {
    const result = applyDossierExcerpts(npcs, [
      { npcIdentity: "npc_no_bio", stages: [{ heading: "X", text: "y" }] },
    ]);
    expect(result[1].bio).toBeUndefined();
  });

  it("dedupes by heading so re-runs are idempotent", () => {
    const excerpts = [
      {
        npcIdentity: "npc_weber_dispatcher",
        stages: [{ heading: "Existing", text: "dup" }],
      },
    ];
    const once = applyDossierExcerpts(npcs, excerpts);
    expect(once[0].bio?.stages).toHaveLength(1);
  });
});
