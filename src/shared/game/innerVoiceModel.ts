import {
  APPROACH_WEIGHT,
  INNER_VOICE_DEFINITIONS,
  INNER_VOICE_IDS,
  INNER_VOICE_SILENCE_THRESHOLD,
  PSYCHE_APPROACH_KEY,
  PSYCHE_AXIS_X_KEY,
  PSYCHE_AXIS_Y_KEY,
  type InnerVoiceId,
  type InnerVoiceRole,
  type InnerVoiceStance,
} from "../../../data/innerVoiceContract";

export interface PsycheState {
  axisX: number;
  axisY: number;
  approach: number;
}

export interface ResolvedInnerVoiceEntry {
  voiceId: InnerVoiceId;
  resonance: number;
  role: InnerVoiceRole;
  stance: InnerVoiceStance;
}

export interface ResolvedInnerVoiceSelection {
  dominant: ResolvedInnerVoiceEntry | null;
  support: ResolvedInnerVoiceEntry | null;
  counter: ResolvedInnerVoiceEntry | null;
  ordered: ResolvedInnerVoiceEntry[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const quadrantKeyFor = (voiceId: InnerVoiceId): string => {
  const { x, y } = INNER_VOICE_DEFINITIONS[voiceId].homePoint;
  return `${x >= 0 ? "+" : "-"}${y >= 0 ? "+" : "-"}`;
};

export const readPsycheState = (
  vars: Readonly<Record<string, number>>,
): PsycheState => ({
  axisX: clamp(vars[PSYCHE_AXIS_X_KEY] ?? 0, -100, 100),
  axisY: clamp(vars[PSYCHE_AXIS_Y_KEY] ?? 0, -100, 100),
  approach: clamp(vars[PSYCHE_APPROACH_KEY] ?? 0, -100, 100),
});

export const resonanceForInnerVoice = (
  state: PsycheState,
  voiceId: InnerVoiceId,
): number => {
  const homePoint = INNER_VOICE_DEFINITIONS[voiceId].homePoint;
  const dx = state.axisX - homePoint.x;
  const dy = state.axisY - homePoint.y;
  const dApproach = state.approach - homePoint.approach;
  const distance = Math.sqrt(
    dx * dx + dy * dy + (APPROACH_WEIGHT * dApproach) ** 2,
  );
  return 1 / (1 + distance);
};

export const resolveInnerVoiceSelection = (
  state: PsycheState,
  pool: readonly InnerVoiceId[],
  options?: {
    includeCounter?: boolean;
    silenceThreshold?: number;
  },
): ResolvedInnerVoiceSelection => {
  const silenceThreshold =
    options?.silenceThreshold ?? INNER_VOICE_SILENCE_THRESHOLD;
  const uniquePool = [...new Set(pool)];
  const candidates = uniquePool
    .map((voiceId) => ({
      voiceId,
      resonance: resonanceForInnerVoice(state, voiceId),
    }))
    .sort((left, right) => right.resonance - left.resonance);

  const audible =
    candidates.filter((entry) => entry.resonance >= silenceThreshold).length > 0
      ? candidates.filter((entry) => entry.resonance >= silenceThreshold)
      : candidates.slice(0, 1);

  const dominant = audible[0]
    ? {
        voiceId: audible[0].voiceId,
        resonance: audible[0].resonance,
        role: "dominant" as const,
        stance: "supports" as const,
      }
    : null;
  const support =
    audible.length >= 2
      ? {
          voiceId: audible[1].voiceId,
          resonance: audible[1].resonance,
          role: "support" as const,
          stance: "supports" as const,
        }
      : null;

  let counter: ResolvedInnerVoiceEntry | null = null;
  if (options?.includeCounter && audible.length >= 3 && dominant) {
    const dominantQuadrant = quadrantKeyFor(dominant.voiceId);
    const remaining = audible.slice(2);
    const counterCandidate =
      remaining.find(
        (entry) => quadrantKeyFor(entry.voiceId) !== dominantQuadrant,
      ) ?? remaining[0];

    if (counterCandidate) {
      counter = {
        voiceId: counterCandidate.voiceId,
        resonance: counterCandidate.resonance,
        role: "counter",
        stance: "opposes",
      };
    }
  }

  return {
    dominant,
    support,
    counter,
    ordered: [dominant, support, counter].filter(
      (entry): entry is ResolvedInnerVoiceEntry => entry !== null,
    ),
  };
};

export const buildInnerVoiceFallbackText = (
  voiceId: InnerVoiceId,
  stance: InnerVoiceStance,
): string =>
  stance === "supports"
    ? INNER_VOICE_DEFINITIONS[voiceId].supportText
    : INNER_VOICE_DEFINITIONS[voiceId].opposeText;

export const describeAxisX = (value: number): string => {
  if (value <= -60) return "Strong Individualist";
  if (value <= -20) return "Self-Reliant";
  if (value < 20) return "Balanced";
  if (value < 60) return "Collective";
  return "Strong Collectivist";
};

export const describeAxisY = (value: number): string => {
  if (value <= -60) return "Machiavellian";
  if (value <= -20) return "Hard Pragmatist";
  if (value < 20) return "Morally Split";
  if (value < 60) return "Principled";
  return "Altruistic";
};

export const describeApproach = (value: number): string => {
  if (value <= -60) return "Reactive";
  if (value <= -20) return "Measured";
  if (value < 20) return "Adaptive";
  if (value < 60) return "Initiating";
  return "Proactive";
};

export const describeQuadrant = (state: PsycheState): string => {
  const xLabel = state.axisX >= 0 ? "Collective" : "Individualist";
  const yLabel = state.axisY >= 0 ? "Altruist" : "Machiavellian";
  return `${xLabel} / ${yLabel}`;
};

export const toCompassPercent = (value: number): number =>
  ((clamp(value, -100, 100) + 100) / 200) * 100;

export const resolveOverallInnerVoiceSelection = (
  vars: Readonly<Record<string, number>>,
): ResolvedInnerVoiceSelection =>
  resolveInnerVoiceSelection(readPsycheState(vars), INNER_VOICE_IDS, {
    includeCounter: true,
  });

export interface DnDAlignment {
  code: string;
  label: string;
  description: string;
}

export const getDnDAlignment = (state: PsycheState): DnDAlignment => {
  const x = state.axisX;
  const y = state.axisY;

  let xPart: "Lawful" | "Chaotic" | "Neutral";
  if (x >= 25) {
    xPart = "Lawful";
  } else if (x <= -25) {
    xPart = "Chaotic";
  } else {
    xPart = "Neutral";
  }

  let yPart: "Good" | "Evil" | "Neutral";
  if (y >= 25) {
    yPart = "Good";
  } else if (y <= -25) {
    yPart = "Evil";
  } else {
    yPart = "Neutral";
  }

  if (xPart === "Neutral" && yPart === "Neutral") {
    return {
      code: "TN",
      label: "True Neutral",
      description:
        "You follow your own path, balancing duty, freedom, altruism, and self-preservation.",
    };
  }

  const codeMap: Record<string, string> = {
    "Lawful-Good": "LG",
    "Lawful-Neutral": "LN",
    "Lawful-Evil": "LE",
    "Neutral-Good": "NG",
    "Neutral-Evil": "NE",
    "Chaotic-Good": "CG",
    "Chaotic-Neutral": "CN",
    "Chaotic-Evil": "CE",
  };

  const key = `${xPart}-${yPart}`;
  const code = codeMap[key] || "TN";
  const label = `${xPart} ${yPart}`;

  let description = "";
  if (key === "Lawful-Good") {
    description =
      "You believe that order, community duty, and active kindness are the best ways to protect the vulnerable.";
  } else if (key === "Lawful-Neutral") {
    description =
      "You hold rules, protocols, and institutional order above individual sentiments or desires.";
  } else if (key === "Lawful-Evil") {
    description =
      "You utilize established rules, systems, and structures to secure your own leverage and power.";
  } else if (key === "Neutral-Good") {
    description =
      "You seek to do good and protect others, regardless of whether it requires following or breaking rules.";
  } else if (key === "Neutral-Evil") {
    description =
      "You pursue your own self-interest pragmatically, without any particular desire to uphold or break the law.";
  } else if (key === "Chaotic-Good") {
    description =
      "You follow your conscience and protect the innocent, refusing to be bound by oppressive rules or societal structures.";
  } else if (key === "Chaotic-Neutral") {
    description =
      "You value personal freedom, autonomy, and independence above all else, resisting external constraints.";
  } else if (key === "Chaotic-Evil") {
    description =
      "You claim total personal sovereignty, pursuing your goals aggressively and disregarding both laws and others.";
  }

  return { code, label, description };
};
