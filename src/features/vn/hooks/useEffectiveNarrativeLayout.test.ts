import { describe, expect, it } from "vitest";
import { resolveEffectiveNarrativeLayout } from "./useEffectiveNarrativeLayout";

describe("resolveEffectiveNarrativeLayout", () => {
  it("promotes letter presentation without an explicit layout to letter overlay", () => {
    expect(
      resolveEffectiveNarrativeLayout({ narrativePresentation: "letter" }),
    ).toBe("letter_overlay");
  });

  it("promotes letter presentation with split layout to letter overlay", () => {
    expect(
      resolveEffectiveNarrativeLayout({
        narrativePresentation: "letter",
        narrativeLayout: "split",
      }),
    ).toBe("letter_overlay");
  });

  it("maps split layout to log", () => {
    expect(resolveEffectiveNarrativeLayout({ narrativeLayout: "split" })).toBe(
      "log",
    );
  });

  it("keeps fullscreen layout unchanged", () => {
    expect(
      resolveEffectiveNarrativeLayout({ narrativeLayout: "fullscreen" }),
    ).toBe("fullscreen");
  });
});
