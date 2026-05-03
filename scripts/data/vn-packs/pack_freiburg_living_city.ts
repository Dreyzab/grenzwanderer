import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_LIVING_CITY_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_city_student_tip",
    title: "Living City: Student Tip",
    startNodeId: "scene_city_student_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_student_tip", "scene_city_student_tip_end"],
  },
  {
    id: "sandbox_city_cleaner_tip",
    title: "Living City: Cleaner Tip",
    startNodeId: "scene_city_cleaner_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_cleaner_tip", "scene_city_cleaner_tip_end"],
  },
  {
    id: "sandbox_city_bootblack_tip",
    title: "Living City: Bootblack Tip",
    startNodeId: "scene_city_bootblack_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_bootblack_tip", "scene_city_bootblack_tip_end"],
  },
];

export const PACK_FREIBURG_LIVING_CITY_NODES: NodeBlueprint[] = [
  {
    id: "scene_city_student_tip",
    scenarioId: "sandbox_city_student_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_student_seen", value: true },
      { type: "track_event", eventName: "city_student_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_STUDENT_CONTINUE",
        text: "Leave them be",
        nextNodeId: "scene_city_student_tip_end",
      },
    ],
  },
  {
    id: "scene_city_student_tip_end",
    scenarioId: "sandbox_city_student_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_city_cleaner_tip",
    scenarioId: "sandbox_city_cleaner_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_cleaner_seen", value: true },
      { type: "track_event", eventName: "city_cleaner_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_CLEANER_CONTINUE",
        text: "Move along",
        nextNodeId: "scene_city_cleaner_tip_end",
      },
    ],
  },
  {
    id: "scene_city_cleaner_tip_end",
    scenarioId: "sandbox_city_cleaner_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_city_bootblack_tip",
    scenarioId: "sandbox_city_bootblack_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_bootblack_seen", value: true },
      { type: "track_event", eventName: "city_bootblack_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_BOOTBLACK_CONTINUE",
        text: "Walk away",
        nextNodeId: "scene_city_bootblack_tip_end",
      },
    ],
  },
  {
    id: "scene_city_bootblack_tip_end",
    scenarioId: "sandbox_city_bootblack_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip_end.md",
    terminal: true,
    choices: [],
  },
];
