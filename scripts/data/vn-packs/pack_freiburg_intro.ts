import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import { originBackstoryChoices } from "./legacy-origin-profiles";

export const PACK_FREIBURG_INTRO_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_intro_pilot",
    title: "Sandbox Intro Pilot",
    startNodeId: "scene_start",
    mode: "fullscreen",
    packId: "freiburg_intro",
    completionRoute: {
      nextScenarioId: "journalist_agency_wakeup",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["origin_journalist_handoff_done"],
    },
    nodeIds: [
      "scene_start",
      "scene_language_select",
      "scene_backstory_select",
      "scene_map_intro",
    ],
  },
];

export const PACK_FREIBURG_INTRO_NODES: NodeBlueprint[] = [
  {
    id: "scene_start",
    backgroundUrl: "/images/scenes/scene_start.webp",
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    choices: [
      {
        id: "START_CONTINUE",
        text: "Continue to language setup",
        nextNodeId: "scene_language_select",
      },
    ],
  },
  {
    id: "scene_language_select",
    backgroundUrl: "/images/scenes/scene_language_select.webp",
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_language_select.md",
    choices: [
      {
        id: "LANG_DE",
        text: "Select Deutsch",
        nextNodeId: "scene_backstory_select",
        effects: [
          { type: "set_flag", key: "lang_en", value: false },
          { type: "set_flag", key: "lang_de", value: true },
          { type: "set_flag", key: "lang_ru", value: false },
          {
            type: "track_event",
            eventName: "language_selected",
            tags: { lang: "de" },
          },
        ],
      },
      {
        id: "LANG_EN",
        text: "Select English",
        nextNodeId: "scene_backstory_select",
        effects: [
          { type: "set_flag", key: "lang_en", value: true },
          { type: "set_flag", key: "lang_de", value: false },
          { type: "set_flag", key: "lang_ru", value: false },
          {
            type: "track_event",
            eventName: "language_selected",
            tags: { lang: "en" },
          },
        ],
      },
      {
        id: "LANG_RU",
        text: "Select Russian",
        nextNodeId: "scene_backstory_select",
        effects: [
          { type: "set_flag", key: "lang_en", value: false },
          { type: "set_flag", key: "lang_de", value: false },
          { type: "set_flag", key: "lang_ru", value: true },
          {
            type: "track_event",
            eventName: "language_selected",
            tags: { lang: "ru" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_backstory_select",
    backgroundUrl: "/images/scenes/scene_backstory_select.webp",
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select.md",
    choices: originBackstoryChoices,
  },
  {
    id: "scene_map_intro",
    backgroundUrl: "/images/scenes/scene_map_intro.webp",
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    terminal: true,
    choices: [],
  },
];
