import { describe, expect, it } from "vitest";
import { resolvePlayerPortrait } from "./playerPortrait";

describe("Player Portrait Resolver", () => {
  it("falls back to the base origin portrait when no items are equipped", () => {
    // Detective active
    const flags = { origin_detective: true };
    const equipped = {
      head: "",
      body: "",
      hands: "",
      weapon: "",
      accessory: "",
    };
    const portrait = resolvePlayerPortrait(flags, equipped);
    expect(portrait).toBe(
      "/images/characters/detective_portrait/detective_portrait.png",
    );
  });

  it("falls back to base origin portrait when only partial set is equipped", () => {
    // Witch active, but only 3 items from set
    const flags = { origin_witch: true };
    const equipped = {
      head: "witch_veil_head",
      body: "witch_veil_body",
      hands: "witch_veil_hands",
      weapon: "",
      accessory: "",
    };
    const portrait = resolvePlayerPortrait(flags, equipped);
    expect(portrait).toBe(
      "/Characters/Eleonora/eleonora_mother_refined_1776592048672.png",
    );
  });

  it("overrides with set portrait when full 5/5 set is equipped and origin matches", () => {
    // Witch active with 5/5 witch set
    const flags = { origin_witch: true };
    const equipped = {
      head: "witch_veil_head",
      body: "witch_veil_body",
      hands: "witch_veil_hands",
      weapon: "witch_veil_weapon",
      accessory: "witch_veil_accessory",
    };
    const portrait = resolvePlayerPortrait(flags, equipped);
    expect(portrait).toBe(
      "/Characters/Eleonora/eleonora_mother_refined_1776592048672.png",
    );
  });

  it("does not override with set portrait if origin is mismatched", () => {
    // Detective active, but somehow has full 5/5 witch set
    const flags = { origin_detective: true };
    const equipped = {
      head: "witch_veil_head",
      body: "witch_veil_body",
      hands: "witch_veil_hands",
      weapon: "witch_veil_weapon",
      accessory: "witch_veil_accessory",
    };
    const portrait = resolvePlayerPortrait(flags, equipped);
    // Should fallback to detective, because witch set specifies originId: 'witch'
    expect(portrait).toBe(
      "/images/characters/detective_portrait/detective_portrait.png",
    );
  });
});
