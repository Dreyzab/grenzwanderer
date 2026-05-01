import { afterEach, describe, expect, it, vi } from "vitest";
import type { UiLanguage } from "./useUiLanguage";
import {
  inferBrowserUiLanguage,
  resolveEffectiveUiLanguage,
} from "./useUiLanguage";

describe("inferBrowserUiLanguage", () => {
  const restore = () => vi.unstubAllGlobals();

  afterEach(() => {
    restore();
  });

  it("returns ru when primary language is Russian", () => {
    vi.stubGlobal("navigator", {
      language: "ru-RU",
      languages: ["ru-RU"],
    });
    expect(inferBrowserUiLanguage()).toBe("ru");
  });

  it("returns de for German", () => {
    vi.stubGlobal("navigator", {
      language: "de-DE",
      languages: ["de-DE"],
    });
    expect(inferBrowserUiLanguage()).toBe("de");
  });

  it("returns en for unsupported languages", () => {
    vi.stubGlobal("navigator", {
      language: "pl-PL",
      languages: ["pl"],
    });
    expect(inferBrowserUiLanguage()).toBe("en");
  });

  it("picks first supported locale from navigator.languages", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["en-US", "ru"],
    });
    expect(inferBrowserUiLanguage()).toBe("ru");
  });
});

describe("resolveEffectiveUiLanguage", () => {
  it("prefers stored locale over browser and flags", () => {
    expect(
      resolveEffectiveUiLanguage(
        "de",
        { lang_ru: true },
        () => "ru" as UiLanguage,
      ),
    ).toBe("de");
  });

  it("uses browser when inferred language is not en", () => {
    expect(
      resolveEffectiveUiLanguage(null, { lang_ru: true }, () => "de"),
    ).toBe("de");
  });

  it("falls back to server flags when browser is neutral", () => {
    expect(
      resolveEffectiveUiLanguage(null, { lang_ru: true }, () => "en"),
    ).toBe("ru");
  });

  it("defaults to en without flags", () => {
    expect(resolveEffectiveUiLanguage(null, {}, () => "en")).toBe("en");
  });

  it("respects explicit lang_en on server after neutral browser", () => {
    expect(
      resolveEffectiveUiLanguage(null, { lang_en: true }, () => "en"),
    ).toBe("en");
  });
});
