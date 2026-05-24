import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DiscoverySignalPhase,
  DiscoverySignalState,
} from "../model/discoverySignal";

interface CompassFeedbackOptions {
  enabled: boolean;
  phase: DiscoverySignalPhase;
  state: DiscoverySignalState;
}

interface CompassFeedbackApi {
  isFeedbackArmed: boolean;
  armFeedback: () => void;
}

const PHASE_INTERVAL_MS: Record<DiscoverySignalPhase, number> = {
  none: 0,
  cold: 1500,
  warm: 760,
  hot: 280,
};

const PHASE_FREQUENCY_HZ: Record<DiscoverySignalPhase, number> = {
  none: 0,
  cold: 520,
  warm: 650,
  hot: 820,
};

const getAudioContextCtor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };

  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
};

const supportsVibration = (
  navigatorRef: Navigator,
): navigatorRef is Navigator & {
  vibrate: (pattern: number | number[]) => boolean;
} => typeof navigatorRef.vibrate === "function";

export const useCompassFeedback = ({
  enabled,
  phase,
  state,
}: CompassFeedbackOptions): CompassFeedbackApi => {
  const [isFeedbackArmed, setIsFeedbackArmed] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const armFeedback = useCallback(() => {
    setIsFeedbackArmed(true);
  }, []);

  const playTick = useCallback((tickPhase: DiscoverySignalPhase) => {
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor || tickPhase === "none") {
      return;
    }

    const context =
      audioContextRef.current ??
      new AudioContextCtor({ latencyHint: "interactive" });
    audioContextRef.current = context;

    void context.resume?.();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const duration = tickPhase === "hot" ? 0.038 : 0.026;
    const volume =
      tickPhase === "hot" ? 0.035 : tickPhase === "warm" ? 0.024 : 0.016;

    oscillator.type = tickPhase === "hot" ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(PHASE_FREQUENCY_HZ[tickPhase], now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }, []);

  useEffect(() => {
    if (!enabled || !isFeedbackArmed || state === "idle" || phase === "none") {
      return;
    }

    const intervalMs =
      state === "interference" ? 420 : PHASE_INTERVAL_MS[phase];
    if (intervalMs <= 0) {
      return;
    }

    const tick = () => {
      playTick(phase);
      if (
        phase === "hot" &&
        typeof navigator !== "undefined" &&
        supportsVibration(navigator)
      ) {
        navigator.vibrate(24);
      }
    };

    tick();
    const handle = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(handle);
  }, [enabled, isFeedbackArmed, phase, playTick, state]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close?.();
      audioContextRef.current = null;
    };
  }, []);

  return { isFeedbackArmed, armFeedback };
};
