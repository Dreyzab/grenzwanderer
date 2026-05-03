export const VN_SFX_MUTED_STORAGE_KEY = "grenzwanderer:vn-sfx-muted";

const successSfxPath = "/audio/check-success.wav";
const failSfxPath = "/audio/check-fail.wav";

const audioCache = new Map<string, HTMLAudioElement>();

export type VnTokenSfxKind = "clue" | "fact" | "lead" | "item" | "unknown";

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

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextClass =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  return new AudioContextClass();
};

const playShortTone = async (
  frequency: number,
  durationMs: number,
  type: OscillatorType,
): Promise<void> => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + Math.max(0.03, durationMs / 1000),
  );

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000 + 0.02);

  window.setTimeout(() => {
    void context.close();
  }, durationMs + 80);
};

const playPenScratch = async (): Promise<void> => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(820, now);
  oscillator.frequency.linearRampToValueAtTime(1280, now + 0.045);
  oscillator.frequency.linearRampToValueAtTime(640, now + 0.105);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(720, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.028, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.16);

  window.setTimeout(() => {
    void context.close();
  }, 240);
};

export const playVnTokenSfx = async (
  kind: VnTokenSfxKind,
  muted: boolean,
): Promise<void> => {
  if (muted) {
    return;
  }

  try {
    if (kind === "lead") {
      await playPenScratch();
      return;
    }
    if (kind === "clue") {
      await playShortTone(520, 90, "triangle");
      return;
    }
    if (kind === "fact") {
      await playShortTone(660, 110, "sine");
      return;
    }
    if (kind === "item") {
      await playShortTone(440, 100, "square");
    }
  } catch (_error) {
    // SFX should never block narrative interaction.
  }
};
