import { describe, expect, it } from "vitest";
import { mergeI18nSection } from "./mergeI18nSection";

describe("mergeI18nSection", () => {
  it("keeps bundled Russian text when a stale server row is English", () => {
    const merged = mergeI18nSection(
      "ru",
      {
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body":
          "Уважаемый детектив.",
      },
      {
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body":
          "Dear detective.",
      },
    );

    expect(
      merged[
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body"
      ],
    ).toBe("Уважаемый детектив.");
  });

  it("repairs German UTF-8 misread as Latin-1 after merge", () => {
    const mojibake = Buffer.from("Erzähler", "utf8").toString("latin1");

    const merged = mergeI18nSection(
      "de",
      {},
      {
        Narrator: mojibake,
      },
    );

    expect(merged.Narrator).toBe("Erzähler");
  });

  it("repairs Russian UTF-8 misread as Latin-1 after merge", () => {
    /** Synthetic mojibake: UTF-8 bytes of Cyrillic decoded as latin1 */
    const mojibake = Buffer.from("Уважаемый детектив.", "utf8").toString(
      "latin1",
    );

    const merged = mergeI18nSection(
      "ru",
      {},
      {
        "vn.case01.example.body": mojibake,
      },
    );

    expect(merged["vn.case01.example.body"]).toBe("Уважаемый детектив.");
  });

  it("allows server rows that match the selected language", () => {
    const merged = mergeI18nSection(
      "ru",
      {
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body":
          "Уважаемый детектив.",
      },
      {
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body":
          "Уважаемый инспектор.",
      },
    );

    expect(
      merged[
        "vn.case01_hbf_arrival.scene_case01_train_compartment_letter.body"
      ],
    ).toBe("Уважаемый инспектор.");
  });
});
