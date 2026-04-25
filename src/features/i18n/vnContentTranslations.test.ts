import { describe, expect, it } from "vitest";
import {
  localizeVnChoice,
  resolveOriginProfileText,
  resolveVnNodeText,
  resolveVnScenarioTitle,
} from "./vnContentTranslations";
import type { VnChoice } from "../vn/types";
import type { I18nDictionary } from "./I18nContext";

const mockDictionary: I18nDictionary = {
  vn: {
    "vn.case01_hbf_arrival.title": "Дело 01: Прибытие во Фрайбург",
    "vn.case01_hbf_arrival.scene_case01_beat1_atmosphere.body": "Фрайбург...",
    "vn.case01_hbf_arrival.scene_case01_beat1_atmosphere.choice.CASE01_BEAT1_POLICE":
      "Обратиться к железнодорожной полиции.",
  },
  origin: {
    "origin.detective.label": "Детектив",
    "origin.detective.summary": "Логика и наблюдение.",
  },
  speakers: {},
  stats: {},
};

describe("vnContentTranslations", () => {
  it("falls back to source content for English and missing keys", () => {
    expect(
      resolveVnNodeText(
        "en",
        "case01_hbf_arrival",
        "scene_case01_beat1_atmosphere",
        "body",
        "Steam at the station.",
        mockDictionary,
      ),
    ).toBe("Steam at the station.");

    expect(
      resolveVnNodeText(
        "ru",
        "unknown_scenario",
        "unknown_node",
        "body",
        "Fallback body",
        mockDictionary,
      ),
    ).toBe("Fallback body");
  });

  it("resolves Russian narrative and scenario titles by stable IDs", () => {
    expect(
      resolveVnScenarioTitle(
        "ru",
        { id: "case01_hbf_arrival", title: "Case 01: Freiburg Arrival" },
        "Case 01: Freiburg Arrival",
        mockDictionary,
      ),
    ).toBe("Дело 01: Прибытие во Фрайбург");

    expect(
      resolveVnNodeText(
        "ru",
        "case01_hbf_arrival",
        "scene_case01_beat1_atmosphere",
        "body",
        "Steam folds around the iron columns.",
        mockDictionary,
      ),
    ).toContain("Фрайбург");
  });

  it("localizes choice text without changing runtime choice identity", () => {
    const choice: VnChoice = {
      id: "CASE01_BEAT1_POLICE",
      text: "Approach the railway police post.",
      nextNodeId: "scene_case01_hbf_police",
      choiceType: "inquiry",
    };

    const localized = localizeVnChoice(
      "ru",
      "case01_hbf_arrival",
      "scene_case01_beat1_atmosphere",
      choice,
      mockDictionary,
    );

    expect(localized).not.toBe(choice);
    expect(localized.id).toBe(choice.id);
    expect(localized.nextNodeId).toBe(choice.nextNodeId);
    expect(localized.text).toBe("Обратиться к железнодорожной полиции.");
  });

  it("localizes origin card copy through origin IDs", () => {
    expect(
      resolveOriginProfileText(
        "ru",
        "detective",
        "label",
        "Detective",
        mockDictionary,
      ),
    ).toBe("Детектив");
    expect(
      resolveOriginProfileText(
        "ru",
        "detective",
        "summary",
        "Logic and observation.",
        mockDictionary,
      ),
    ).toContain("Логика");
  });
});
