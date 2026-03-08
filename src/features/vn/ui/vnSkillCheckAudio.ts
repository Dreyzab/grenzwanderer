export const VN_SFX_MUTED_STORAGE_KEY = "grenzwanderer:vn-sfx-muted";

const successSfxPath = "/audio/check-success.wav";
const failSfxPath = "/audio/check-fail.wav";

const audioCache = new Map<string, HTMLAudioElement>();

const getAudio = (src: string): HTMLAudioElement | null => {
  if (typeof Audio === "undefined") {
    return null;
  }

  const cached = audioCache.get(src);
  if (cached) {
    return cached;
  }

  const audio = new Audio(src);
  audio.preload = "auto";
  audioCache.set(src, audio);
  return audio;
};

export const readVnSfxMuted = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(VN_SFX_MUTED_STORAGE_KEY) === "true";
  } catch (_error) {
    return false;
  }
};

export const writeVnSfxMuted = (muted: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      VN_SFX_MUTED_STORAGE_KEY,
      muted ? "true" : "false",
    );
  } catch (_error) {
    // Ignore storage errors and keep the runtime responsive.
  }
};

export const playVnSkillCheckSfx = async (
  passed: boolean,
  muted: boolean,
): Promise<void> => {
  if (muted) {
    return;
  }

  const audio = getAudio(passed ? successSfxPath : failSfxPath);
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch (_error) {
    // Autoplay failures are expected on some browsers.
  }
};
