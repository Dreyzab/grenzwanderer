import { useEffect, useMemo, useState } from "react";
import { RELEASE_PROFILE, SCENE_GEN_BASE_URL } from "../../config";
import type { SceneGenerationResult } from "./types";
import { getKarlsruheSceneContext } from "./karlsruheSceneCatalog";

const sceneGenerationCache = new Map<string, SceneGenerationResult>();
const failedSceneGenerationRequests = new Set<string>();

const buildSceneCacheKey = (context: {
  caseId: string;
  pointId: string;
  scenarioId: string;
}): string =>
  `${RELEASE_PROFILE}::${context.caseId}::${context.pointId}::${context.scenarioId}`;

const isSceneGenerationResult = (
  value: unknown,
): value is SceneGenerationResult => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.imageUrl === "string" &&
    candidate.imageUrl.trim().length > 0 &&
    typeof candidate.cacheKey === "string" &&
    candidate.cacheKey.trim().length > 0 &&
    typeof candidate.promptVersion === "string" &&
    candidate.promptVersion.trim().length > 0
  );
};

const requestSceneGeneration = async (context: {
  caseId: string;
  pointId: string;
  scenarioId: string;
  mode: "prompt_only";
}): Promise<SceneGenerationResult> => {
  if (!SCENE_GEN_BASE_URL) {
    throw new Error("Scene generation base URL is not configured");
  }

  const response = await fetch(`${SCENE_GEN_BASE_URL}/scene/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    throw new Error(`Scene generation failed with status ${response.status}`);
  }

  const parsed = (await response.json()) as unknown;
  if (!isSceneGenerationResult(parsed)) {
    throw new Error("Scene generation returned an invalid payload");
  }

  return parsed;
};

export const useKarlsruheSceneBackground = (
  scenarioId?: string,
): string | null => {
  const sceneContext = useMemo(
    () =>
      RELEASE_PROFILE === "karlsruhe_event"
        ? getKarlsruheSceneContext(scenarioId)
        : null,
    [scenarioId],
  );

  const cacheKey = useMemo(
    () => (sceneContext ? buildSceneCacheKey(sceneContext) : null),
    [sceneContext],
  );

  const [sceneResult, setSceneResult] = useState<SceneGenerationResult | null>(
    () => (cacheKey ? (sceneGenerationCache.get(cacheKey) ?? null) : null),
  );

  useEffect(() => {
    if (!cacheKey) {
      setSceneResult(null);
      return;
    }

    setSceneResult(sceneGenerationCache.get(cacheKey) ?? null);

    if (
      !sceneContext ||
      sceneGenerationCache.has(cacheKey) ||
      failedSceneGenerationRequests.has(cacheKey)
    ) {
      return;
    }

    let cancelled = false;
    void requestSceneGeneration(sceneContext)
      .then((result) => {
        sceneGenerationCache.set(cacheKey, result);
        if (!cancelled) {
          setSceneResult(result);
        }
      })
      .catch(() => {
        failedSceneGenerationRequests.add(cacheKey);
        if (!cancelled) {
          setSceneResult(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, sceneContext]);

  return sceneResult?.imageUrl ?? null;
};
