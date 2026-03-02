import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolveUiLanguage, useUiLanguage } from "./useUiLanguage";

describe("resolveUiLanguage", () => {
  it("resolves russian and german flags", () => {
    expect(resolveUiLanguage({ lang_ru: true })).toBe("ru");
    expect(resolveUiLanguage({ lang_de: true })).toBe("de");
    expect(resolveUiLanguage({})).toBe("en");
  });
});

describe("useUiLanguage", () => {
  it("memoizes ui language from flags", () => {
    const { result, rerender } = renderHook(
      ({ flags }: { flags: Record<string, boolean> }) => useUiLanguage(flags),
      { initialProps: { flags: { lang_ru: true } as Record<string, boolean> } },
    );

    expect(result.current).toBe("ru");

    rerender({ flags: { lang_de: true } as Record<string, boolean> });
    expect(result.current).toBe("de");
  });
});
