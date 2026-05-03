import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_AGENCY_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_agency_briefing",
    title: "Agency Briefing",
    startNodeId: "scene_agency_briefing_intro",
    mode: "overlay",
    packId: "freiburg_agency",
    nodeIds: ["scene_agency_briefing_intro", "scene_agency_briefing_outro"],
  },
];

export const PACK_FREIBURG_AGENCY_NODES: NodeBlueprint[] = [
  {
    id: "scene_agency_briefing_intro",
    scenarioId: "sandbox_agency_briefing",
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Agency/scene_agency_briefing_intro.md",
    characterId: "inspector",
    choices: [
      {
        id: "AGENCY_BRIEFING_ACCEPT",
        text: "Take the first assignments and open the city map.",
        nextNodeId: "scene_agency_briefing_outro",
        effects: [
          { type: "set_flag", key: "agency_briefing_complete", value: true },
          { type: "set_quest_stage", questId: "quest_banker", stage: 1 },
          { type: "track_event", eventName: "agency_briefing_completed" },
          { type: "grant_xp", amount: 10 },
        ],
      },
    ],
  },
  {
    id: "scene_agency_briefing_outro",
    scenarioId: "sandbox_agency_briefing",
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Agency/scene_agency_briefing_outro.md",
    terminal: true,
    choices: [],
  },
];
