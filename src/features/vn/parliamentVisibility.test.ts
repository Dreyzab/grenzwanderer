import { describe, expect, it } from "vitest";
import { isParliamentVoiceVisible } from "./parliamentVisibility";

describe("isParliamentVoiceVisible", () => {
  it("hides the witch's Shame seat until its reveal flag is set", () => {
    expect(isParliamentVoiceVisible("inner_hermit", {}, "witch")).toBe(false);
    expect(
      isParliamentVoiceVisible(
        "inner_hermit",
        { flag_witch_shame_revealed: true },
        "witch",
      ),
    ).toBe(true);
  });

  it("does not hide inner_hermit for presets where it is not concealed", () => {
    // detective's [СВИДЕТЕЛЬ] and archivist's [ОТШЕЛЬНИК] are open counter-voices
    expect(isParliamentVoiceVisible("inner_hermit", {}, "detective")).toBe(
      true,
    );
    expect(isParliamentVoiceVisible("inner_hermit", {}, "archivist")).toBe(
      true,
    );
  });

  it("shows every voice when no preset is active yet", () => {
    expect(isParliamentVoiceVisible("inner_hermit", {})).toBe(true);
  });

  it("does not gate ordinary parliament voices", () => {
    expect(isParliamentVoiceVisible("inner_leader", {}, "witch")).toBe(true);
    expect(isParliamentVoiceVisible("inner_cynic", {}, "witch")).toBe(true);
  });

  it("resolves track-preset aliases", () => {
    expect(
      isParliamentVoiceVisible("inner_hermit", {}, "journalist_cityroom"),
    ).toBe(true);
  });
});
