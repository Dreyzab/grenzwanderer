import {
  APP_CHECK_ENABLED,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_PROJECT_ID,
  RECAPTCHA_ENTERPRISE_SITE_KEY,
} from "../config";

interface SceneGenAppCheckTokenProvider {
  getToken: () => Promise<string | null>;
}

let providerPromise: Promise<SceneGenAppCheckTokenProvider> | null = null;

const hasAppCheckConfig = (): boolean =>
  APP_CHECK_ENABLED &&
  FIREBASE_API_KEY.trim().length > 0 &&
  FIREBASE_APP_ID.trim().length > 0 &&
  FIREBASE_PROJECT_ID.trim().length > 0 &&
  RECAPTCHA_ENTERPRISE_SITE_KEY.trim().length > 0;

const warnAppCheckFailure = (error: unknown): void => {
  if (!import.meta.env.DEV) {
    return;
  }
  console.warn("[app-check] failed to obtain token", error);
};

const initializeSceneGenAppCheck =
  async (): Promise<SceneGenAppCheckTokenProvider> => {
    const [{ getApp, getApps, initializeApp }, appCheckModule] =
      await Promise.all([import("firebase/app"), import("firebase/app-check")]);

    const firebaseApp =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: FIREBASE_API_KEY,
            appId: FIREBASE_APP_ID,
            projectId: FIREBASE_PROJECT_ID,
          });

    const appCheck = appCheckModule.initializeAppCheck(firebaseApp, {
      provider: new appCheckModule.ReCaptchaEnterpriseProvider(
        RECAPTCHA_ENTERPRISE_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    });

    return {
      getToken: async () => {
        const result = await appCheckModule.getToken(appCheck, false);
        return result.token || null;
      },
    };
  };

export const getSceneGenAppCheckToken = async (): Promise<string | null> => {
  if (!hasAppCheckConfig()) {
    return null;
  }

  providerPromise ??= initializeSceneGenAppCheck();

  try {
    const provider = await providerPromise;
    return await provider.getToken();
  } catch (error) {
    providerPromise = null;
    warnAppCheckFailure(error);
    return null;
  }
};
