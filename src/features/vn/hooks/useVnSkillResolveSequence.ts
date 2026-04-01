import { useCallback, useEffect, useReducer } from "react";
import { nowMs } from "../vnScreenUtils";
import {
  ACTIVE_SKILL_ARMING_MS,
  ACTIVE_SKILL_IMPACT_MS,
  ACTIVE_SKILL_ROLLING_MS,
  buildActiveSkillResolveState,
} from "../vnSkillCheckUtils";
import type {
  AwaitingSkillChoice,
  SkillCheckResultLike,
} from "../vnScreenTypes";
import type { VnSkillCheckResolvePhase } from "../ui/VnSkillCheckResolveOverlay";

interface ResolveSequenceState {
  token: number;
  startedAt: number;
  pending: AwaitingSkillChoice | null;
  matchedResult: SkillCheckResultLike | null;
  activeSkillResolve: ReturnType<typeof buildActiveSkillResolveState> | null;
  skipRequested: boolean;
  impactSfxHandled: boolean;
}

type ResolveSequenceAction =
  | { type: "start"; pending: AwaitingSkillChoice; startedAt: number }
  | {
      type: "resolve";
      pending: AwaitingSkillChoice;
      matchedResult: SkillCheckResultLike;
    }
  | {
      type: "advance_phase";
      token: number;
      phase: Extract<VnSkillCheckResolvePhase, "rolling" | "impact" | "result">;
    }
  | { type: "request_skip"; matchedResult: SkillCheckResultLike | null }
  | { type: "mark_impact_sfx_handled"; token: number }
  | { type: "reset" };

const initialState: ResolveSequenceState = {
  token: 0,
  startedAt: 0,
  pending: null,
  matchedResult: null,
  activeSkillResolve: null,
  skipRequested: false,
  impactSfxHandled: false,
};

const matchesPending = (
  left: AwaitingSkillChoice | null,
  right: AwaitingSkillChoice,
): boolean =>
  Boolean(
    left &&
    left.scenarioId === right.scenarioId &&
    left.nodeId === right.nodeId &&
    left.choiceId === right.choiceId &&
    left.checkId === right.checkId,
  );

const resolvePhaseIfPossible = (
  state: ResolveSequenceState,
  phase: Extract<VnSkillCheckResolvePhase, "rolling" | "impact" | "result">,
): ResolveSequenceState => {
  if (!state.pending || !state.matchedResult || !state.activeSkillResolve) {
    return state;
  }

  if (state.activeSkillResolve.phase === "result") {
    return state;
  }

  return {
    ...state,
    activeSkillResolve: buildActiveSkillResolveState(
      state.pending,
      phase,
      state.matchedResult,
    ),
  };
};

const reducer = (
  state: ResolveSequenceState,
  action: ResolveSequenceAction,
): ResolveSequenceState => {
  switch (action.type) {
    case "start": {
      return {
        token: state.token + 1,
        startedAt: action.startedAt,
        pending: action.pending,
        matchedResult: null,
        activeSkillResolve: buildActiveSkillResolveState(
          action.pending,
          "arming",
        ),
        skipRequested: false,
        impactSfxHandled: false,
      };
    }
    case "resolve": {
      if (
        !matchesPending(state.pending, action.pending) ||
        !state.activeSkillResolve
      ) {
        return state;
      }

      const nextMatchedResult = action.matchedResult;
      if (state.skipRequested) {
        return {
          ...state,
          matchedResult: nextMatchedResult,
          activeSkillResolve: buildActiveSkillResolveState(
            action.pending,
            "result",
            nextMatchedResult,
          ),
        };
      }

      return {
        ...state,
        matchedResult: nextMatchedResult,
      };
    }
    case "advance_phase": {
      if (action.token !== state.token) {
        return state;
      }

      return resolvePhaseIfPossible(state, action.phase);
    }
    case "request_skip": {
      if (
        !state.activeSkillResolve ||
        state.activeSkillResolve.phase === "result"
      ) {
        return state;
      }

      const nextMatchedResult = action.matchedResult ?? state.matchedResult;
      if (!nextMatchedResult || !state.pending) {
        return {
          ...state,
          skipRequested: true,
        };
      }

      return {
        ...state,
        matchedResult: nextMatchedResult,
        skipRequested: true,
        activeSkillResolve: buildActiveSkillResolveState(
          state.pending,
          "result",
          nextMatchedResult,
        ),
      };
    }
    case "mark_impact_sfx_handled": {
      if (action.token !== state.token || state.impactSfxHandled) {
        return state;
      }

      return {
        ...state,
        impactSfxHandled: true,
      };
    }
    case "reset": {
      return {
        token: state.token + 1,
        startedAt: 0,
        pending: null,
        matchedResult: null,
        activeSkillResolve: null,
        skipRequested: false,
        impactSfxHandled: false,
      };
    }
  }
};

interface UseVnSkillResolveSequenceParams {
  isSfxMuted: boolean;
  playImpactSfx: (passed: boolean) => void | Promise<void>;
}

type ResolveInteractionOutcome = "ignored" | "handled" | "dismiss";

export function useVnSkillResolveSequence({
  isSfxMuted,
  playImpactSfx,
}: UseVnSkillResolveSequenceParams) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const activeState = state.activeSkillResolve;
    if (
      !activeState ||
      !state.matchedResult ||
      activeState.phase === "result"
    ) {
      return;
    }

    if (state.skipRequested) {
      dispatch({
        type: "advance_phase",
        token: state.token,
        phase: "result",
      });
      return;
    }

    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (activeState.phase === "arming") {
      const remainingArming = Math.max(
        0,
        ACTIVE_SKILL_ARMING_MS - (nowMs() - state.startedAt),
      );
      timerId = setTimeout(() => {
        dispatch({
          type: "advance_phase",
          token: state.token,
          phase: "rolling",
        });
      }, remainingArming);
    } else if (activeState.phase === "rolling") {
      timerId = setTimeout(() => {
        dispatch({
          type: "advance_phase",
          token: state.token,
          phase: "impact",
        });
      }, ACTIVE_SKILL_ROLLING_MS);
    } else if (activeState.phase === "impact") {
      timerId = setTimeout(() => {
        dispatch({
          type: "advance_phase",
          token: state.token,
          phase: "result",
        });
      }, ACTIVE_SKILL_IMPACT_MS);
    }

    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [
    state.activeSkillResolve,
    state.matchedResult,
    state.skipRequested,
    state.startedAt,
    state.token,
  ]);

  useEffect(() => {
    const activeState = state.activeSkillResolve;
    if (!activeState || !state.matchedResult || state.impactSfxHandled) {
      return;
    }

    if (activeState.phase !== "impact" && activeState.phase !== "result") {
      return;
    }

    dispatch({
      type: "mark_impact_sfx_handled",
      token: state.token,
    });

    if (!isSfxMuted) {
      void playImpactSfx(state.matchedResult.passed);
    }
  }, [
    isSfxMuted,
    playImpactSfx,
    state.activeSkillResolve,
    state.impactSfxHandled,
    state.matchedResult,
    state.token,
  ]);

  const startResolveSequence = useCallback((pending: AwaitingSkillChoice) => {
    dispatch({
      type: "start",
      pending,
      startedAt: nowMs(),
    });
  }, []);

  const applyResolvedResult = useCallback(
    (pending: AwaitingSkillChoice, matchedResult: SkillCheckResultLike) => {
      dispatch({
        type: "resolve",
        pending,
        matchedResult,
      });
    },
    [],
  );

  const resetResolveSequence = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const handleResolveInteraction = useCallback(
    (matchedResult: SkillCheckResultLike | null): ResolveInteractionOutcome => {
      if (!state.activeSkillResolve) {
        return "ignored";
      }

      if (state.activeSkillResolve.phase === "result") {
        return "dismiss";
      }

      dispatch({
        type: "request_skip",
        matchedResult,
      });
      return "handled";
    },
    [state.activeSkillResolve],
  );

  return {
    activeSkillResolve: state.activeSkillResolve,
    startResolveSequence,
    applyResolvedResult,
    resetResolveSequence,
    handleResolveInteraction,
  };
}
