import { describe, expect, it } from "vitest";
import { getCharacterPortrait } from "./characterAssets";

describe("character portrait bridge", () => {
  it("resolves Lotte to her authored portrait instead of a generic operator", () => {
    expect(getCharacterPortrait("npc_weber_dispatcher")).toBe(
      "/Characters/lotte_weber_portrait.png",
    );
    expect(getCharacterPortrait("lotte_weber")).toBe(
      "/Characters/lotte_weber_portrait.png",
    );
  });

  it("resolves the detective origin portrait for sprite identity work", () => {
    expect(getCharacterPortrait("detective")).toBe(
      "/images/characters/detective_portrait/detective_portrait.png",
    );
  });

  it("resolves Case01 culprit and sapper portraits explicitly", () => {
    expect(getCharacterPortrait("npc_heinrich_galdermann")).toBe(
      "/images/characters/heinrich_galdermann/heinrich_galdermann.webp",
    );
    expect(getCharacterPortrait("npc_albrecht_stoll")).toBe(
      "/images/characters/albrecht_stoll/albrecht_stoll.webp",
    );
    expect(getCharacterPortrait("npc_konrad_vossler")).toBe(
      "/images/characters/konrad_vossler/konrad_vossler.webp",
    );
  });
});
