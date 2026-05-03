import { useCallback, useEffect, useState } from "react";
import type {
  OpenVnScenarioOptions,
  VnLaunchCoverPhase,
} from "../shared/navigation/shellNavigationTypes";

export const VN_LAUNCH_CURTAIN_HOLD_MS = 450;
export const VN_LAUNCH_CURTAIN_FADE_MS = 500;

export const useVnLaunchCurtain = (
  navigateToVnScenario: (scenarioId: string) => void,
) => {
  const [vnLaunchCoverPhase, setVnLaunchCoverPhase] =
    useState<VnLaunchCoverPhase>("off");

  const openVnScenario = useCallback(
    (scenarioId: string, options?: OpenVnScenarioOptions) => {
      navigateToVnScenario(scenarioId);
      if (options?.launchCurtain) {
        setVnLaunchCoverPhase("solid");
      }
    },
    [navigateToVnScenario],
  );

  useEffect(() => {
    if (vnLaunchCoverPhase !== "solid") {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setVnLaunchCoverPhase("out");
    }, VN_LAUNCH_CURTAIN_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [vnLaunchCoverPhase]);

  const onVnLaunchCoverTransitionEnd = useCallback(() => {
    setVnLaunchCoverPhase("off");
  }, []);

  return {
    vnLaunchCoverPhase,
    openVnScenario,
    onVnLaunchCoverTransitionEnd,
  };
};
