import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  getSkillCheckVoicePalette,
  formatSkillCheckVoiceLabel,
} from "../skillCheckPalette";
import type { VnChoice, VnDiceMode } from "../types";
import "./VnSkillCheckFeedback.css";

type DiceSceneComponent = typeof import("./VnSkillCheckDiceScene").VnSkillCheckDiceScene;

export type VnSkillCheckResolvePhase =
  | "arming"
  | "rolling"
  | "impact"
  | "result";

export interface FrozenSkillCheckPresentation {
  locationName: string;
  characterName?: string;
  narrativeText: string;
  backgroundImageUrl?: string;
  visibleChoices: VnChoice[];
  autoContinueChoice: VnChoice | null;
  showOriginCards: boolean;
  isScenarioCompleted: boolean;
}

export interface VnSkillCheckResolveState {
  scenarioId: string;
  nodeId: string;
  checkId: string;
  choiceId: string;
  choiceText: string;
  voiceId: string;
  voiceLabel: string;
  diceMode: VnDiceMode;
  phase: VnSkillCheckResolvePhase;
  passed?: boolean;
  chancePercent?: number;
  roll?: number;
  voiceLevel?: number;
  difficulty?: number;
  nextNodeId?: string | null;
  frozen: FrozenSkillCheckPresentation;
}

type SkillCheckAiStatus = "pending" | "processing" | "completed" | "failed";

interface VnSkillCheckResolveOverlayProps {
  state: VnSkillCheckResolveState | null;
  aiStatus?: SkillCheckAiStatus | null;
  aiThoughtText?: string | null;
  aiThoughtVoiceLabel?: string | null;
  onInteract: () => void;
}

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(mediaQuery.matches);
    };

    apply();
    mediaQuery.addEventListener("change", apply);
    return () => {
      mediaQuery.removeEventListener("change", apply);
    };
  }, []);

  return reduced;
};

const detectWebGlSupport = (): boolean => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
};

const resolveEyebrow = (state: VnSkillCheckResolveState): string => {
  if (state.phase === "arming") {
    return "CHECK PRIMED";
  }
  if (state.phase === "rolling") {
    return "DICE IN MOTION";
  }
  if (state.phase === "impact") {
    return state.passed ? "THE ROOM YIELDS" : "THE ROOM SHUTS";
  }
  return state.passed ? "SUCCESS" : "FAIL";
};

const ResolveFallbackDie = ({
  voiceId,
  phase,
  passed,
}: {
  voiceId: string;
  phase: VnSkillCheckResolvePhase;
  passed?: boolean;
}) => {
  const palette = useMemo(() => getSkillCheckVoicePalette(voiceId), [voiceId]);
  return (
    <div
      className={[
        "vn-check-resolve__fallback-die",
        phase === "result" ? "is-result" : "is-animating",
        passed === undefined ? "" : passed ? "is-success" : "is-fail",
      ].join(" ")}
      data-testid="vn-skill-dice-fallback"
      style={
        {
          "--vn-check-accent": palette.accent,
          "--vn-check-glow": palette.glowStrong,
        } as CSSProperties
      }
    >
      <span className="vn-check-resolve__fallback-core" />
      <span className="vn-check-resolve__fallback-ring" />
      <span className="vn-check-resolve__fallback-ring is-offset" />
      <span className="vn-check-resolve__fallback-label">
        {formatSkillCheckVoiceLabel(voiceId)}
      </span>
    </div>
  );
};

export const VnSkillCheckResolveOverlay = ({
  state,
  aiStatus = null,
  aiThoughtText = null,
  aiThoughtVoiceLabel = null,
  onInteract,
}: VnSkillCheckResolveOverlayProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hasWebGl, setHasWebGl] = useState(false);
  const [DiceScene, setDiceScene] = useState<DiceSceneComponent | null>(null);
  const [diceLoadFailed, setDiceLoadFailed] = useState(false);

  useEffect(() => {
    setHasWebGl(detectWebGlSupport());
  }, []);

  useEffect(() => {
    if (!state || prefersReducedMotion || !hasWebGl || diceLoadFailed || DiceScene) {
      return;
    }

    let cancelled = false;

    void import("./VnSkillCheckDiceScene")
      .then((module) => {
        if (cancelled) {
          return;
        }
        setDiceScene(() => module.VnSkillCheckDiceScene);
      })
      .catch(() => {
        if (!cancelled) {
          setDiceLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [DiceScene, diceLoadFailed, hasWebGl, prefersReducedMotion, state]);

  const palette = useMemo(
    () => (state ? getSkillCheckVoicePalette(state.voiceId) : null),
    [state],
  );
  const showDiceScene =
    Boolean(state) &&
    !prefersReducedMotion &&
    hasWebGl &&
    !diceLoadFailed &&
    Boolean(DiceScene);

  return (
    <AnimatePresence>
      {state ? (
        <motion.button
          key={`${state.choiceId}:${state.phase}:${state.passed ? "pass" : "fail"}`}
          type="button"
          className={[
            "vn-check-resolve",
            state.phase === "result"
              ? state.passed
                ? "is-success"
                : "is-fail"
              : "is-animating",
          ].join(" ")}
          data-phase={state.phase}
          onClick={(event) => {
            event.stopPropagation();
            onInteract();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={
            {
              "--vn-check-accent": palette?.accent,
              "--vn-check-accent-soft": palette?.accentSoft,
              "--vn-check-glow": palette?.glowStrong,
            } as CSSProperties
          }
        >
          <motion.div
            className="vn-check-resolve__vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="vn-check-resolve__visual">
            {showDiceScene && DiceScene ? (
              <DiceScene
                diceMode={state.diceMode}
                voiceId={state.voiceId}
                phase={state.phase}
                passed={state.passed}
              />
            ) : (
              <ResolveFallbackDie
                voiceId={state.voiceId}
                phase={state.phase}
                passed={state.passed}
              />
            )}
          </div>
          <motion.article
            className="vn-check-resolve__panel"
            initial={{
              opacity: 0,
              scale: 0.96,
              y:
                state.phase === "result"
                  ? state.passed
                    ? 22
                    : -18
                  : 14,
            }}
            animate={{
              opacity: 1,
              scale: state.phase === "result" ? 1.02 : 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <p className="vn-check-resolve__eyebrow">{resolveEyebrow(state)}</p>
            <h3 className="vn-check-resolve__title">{state.voiceLabel}</h3>
            <p className="vn-check-resolve__text">{state.choiceText}</p>
            {state.chancePercent !== undefined ? (
              <p className="vn-check-resolve__chance">{`${state.chancePercent}% predicted`}</p>
            ) : null}
            {state.phase === "result" ? (
              <>
                <p className="vn-check-resolve__formula">
                  {`Roll ${state.roll ?? 0} + ${state.voiceLevel ?? 0} vs DC ${state.difficulty ?? 0}`}
                </p>
                <p className="vn-check-resolve__result">
                  {state.passed ? "Success" : "Fail"}
                </p>
                {aiStatus && aiStatus !== "failed" ? (
                  <div className="vn-check-resolve__ai">
                    <p className="vn-check-resolve__ai-eyebrow">
                      Inner Parliament
                    </p>
                    <p className="vn-check-resolve__ai-title">
                      {aiStatus === "completed"
                        ? aiThoughtVoiceLabel ?? "Thought"
                        : "Thinking"}
                    </p>
                    <p className="vn-check-resolve__ai-text">
                      {aiStatus === "completed" && aiThoughtText
                        ? aiThoughtText
                        : `${aiThoughtVoiceLabel ?? state.voiceLabel} is turning the result over...`}
                    </p>
                  </div>
                ) : null}
                <p className="vn-check-resolve__hint">Tap to continue</p>
              </>
            ) : (
              <p className="vn-check-resolve__hint">Tap to skip</p>
            )}
          </motion.article>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
};
