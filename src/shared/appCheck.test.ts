import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseMocks = vi.hoisted(() => {
  const firebaseApp = { name: "karlsruhe-test-app" };
  const appCheck = { name: "karlsruhe-test-app-check" };

  return {
    appCheck,
    firebaseApp,
    getApp: vi.fn(() => firebaseApp),
    getApps: vi.fn(() => []),
    getToken: vi.fn(async () => ({ token: "app-check-token" })),
    initializeApp: vi.fn(() => firebaseApp),
    initializeAppCheck: vi.fn(() => appCheck),
    ReCaptchaEnterpriseProvider: vi.fn(function (
      this: { siteKey?: string },
      siteKey: string,
    ) {
      this.siteKey = siteKey;
    }),
  };
});

vi.mock("firebase/app", () => ({
  getApp: firebaseMocks.getApp,
  getApps: firebaseMocks.getApps,
  initializeApp: firebaseMocks.initializeApp,
}));

vi.mock("firebase/app-check", () => ({
  getToken: firebaseMocks.getToken,
  initializeAppCheck: firebaseMocks.initializeAppCheck,
  ReCaptchaEnterpriseProvider: firebaseMocks.ReCaptchaEnterpriseProvider,
}));

describe("getSceneGenAppCheckToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    for (const mock of [
      firebaseMocks.getApp,
      firebaseMocks.getApps,
      firebaseMocks.getToken,
      firebaseMocks.initializeApp,
      firebaseMocks.initializeAppCheck,
      firebaseMocks.ReCaptchaEnterpriseProvider,
    ]) {
      mock.mockClear();
    }
  });

  it("returns null without initializing Firebase when the flag is disabled", async () => {
    vi.stubEnv("VITE_APP_CHECK_ENABLED", "false");

    const { getSceneGenAppCheckToken } = await import("./appCheck");

    await expect(getSceneGenAppCheckToken()).resolves.toBeNull();
    expect(firebaseMocks.initializeApp).not.toHaveBeenCalled();
    expect(firebaseMocks.initializeAppCheck).not.toHaveBeenCalled();
    expect(firebaseMocks.getToken).not.toHaveBeenCalled();
  });

  it("initializes App Check and returns a token when configured", async () => {
    vi.stubEnv("VITE_APP_CHECK_ENABLED", "true");
    vi.stubEnv("VITE_FIREBASE_API_KEY", "api-key");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "app-id");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "detective-prod-8f6f0");
    vi.stubEnv("VITE_RECAPTCHA_ENTERPRISE_SITE_KEY", "site-key");

    const { getSceneGenAppCheckToken } = await import("./appCheck");

    await expect(getSceneGenAppCheckToken()).resolves.toBe("app-check-token");
    expect(firebaseMocks.initializeApp).toHaveBeenCalledWith({
      apiKey: "api-key",
      appId: "app-id",
      projectId: "detective-prod-8f6f0",
    });
    expect(firebaseMocks.ReCaptchaEnterpriseProvider).toHaveBeenCalledWith(
      "site-key",
    );
    expect(firebaseMocks.initializeAppCheck).toHaveBeenCalledWith(
      firebaseMocks.firebaseApp,
      expect.objectContaining({ isTokenAutoRefreshEnabled: true }),
    );
    expect(firebaseMocks.getToken).toHaveBeenCalledWith(
      firebaseMocks.appCheck,
      false,
    );
  });
});
