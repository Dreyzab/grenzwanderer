const KARLSRUHE_SCENE_CONTEXTS = new Map<
  string,
  { caseId: string; pointId: string }
>([
  [
    "karlsruhe_event_arrival",
    { caseId: "karlsruhe_event_arrival", pointId: "karlsruhe_arrival" },
  ],
  ["sandbox_banker_pilot", { caseId: "quest_banker", pointId: "loc_ka_bank" }],
  ["sandbox_dog_pilot", { caseId: "quest_dog", pointId: "loc_ka_rathaus" }],
  [
    "sandbox_missing_aroma_pilot",
    { caseId: "quest_missing_aroma", pointId: "loc_ka_bakery" },
  ],
]);

export const getKarlsruheSceneContext = (scenarioId?: string) => {
  if (!scenarioId) {
    return null;
  }

  const mapping = KARLSRUHE_SCENE_CONTEXTS.get(scenarioId);
  if (!mapping) {
    return null;
  }

  return {
    ...mapping,
    scenarioId,
    mode: "prompt_only" as const,
  };
};
