import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import {
  KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
  KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
} from "./vn-pack-constants";

export const PACK_KARLSRUHE_EVENT_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
    title: "Karlsruhe Event Arrival",
    startNodeId: "scene_karlsruhe_event_arrival_platform",
    mode: "fullscreen",
    packId: "karlsruhe_event",
    defaultBackgroundUrl: "/images/scenes/karlsruhe_event_arrival.png",
    nodeIds: [
      "scene_karlsruhe_event_arrival_platform",
      "scene_karlsruhe_event_arrival_paperboy",
      "scene_karlsruhe_event_arrival_briefing",
      "scene_karlsruhe_event_arrival_unlock",
    ],
  },
  {
    id: KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
    title: "Missing Aroma",
    startNodeId: "scene_missing_aroma_briefing",
    mode: "fullscreen",
    packId: "karlsruhe_event",
    defaultBackgroundUrl: "/images/scenes/karlsruhe_missing_aroma.png",
    nodeIds: [
      "scene_missing_aroma_briefing",
      "scene_missing_aroma_kitchen",
      "scene_missing_aroma_alley",
      "scene_missing_aroma_resolution",
    ],
  },
];

export const PACK_KARLSRUHE_EVENT_NODES: NodeBlueprint[] = [
  {
    id: "scene_karlsruhe_event_arrival_platform",
    scenarioId: KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_karlsruhe_event_arrival.md",
    titleOverride: "Karlsruhe Hauptbahnhof",
    bodyOverride:
      "Steam from the first morning train hangs over the platform. Victoria Sterling spots you before the porters do, already carrying a folded dispatch case and a list of unfinished meetings.",
    characterId: "assistant",
    choices: [
      {
        id: "KA_EVENT_ARRIVAL_FOLLOW_VICTORIA",
        text: "Take pace beside Victoria and ask for the situation.",
        nextNodeId: "scene_karlsruhe_event_arrival_paperboy",
      },
      {
        id: "KA_EVENT_ARRIVAL_SCAN_CROWD",
        text: "Read the platform before speaking.",
        choiceType: "inquiry",
        nextNodeId: "scene_karlsruhe_event_arrival_paperboy",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
    ],
  },
  {
    id: "scene_karlsruhe_event_arrival_paperboy",
    scenarioId: KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_karlsruhe_event_arrival_paperboy.md",
    titleOverride: "Morning Edition",
    bodyOverride:
      "Before Victoria can finish her briefing, a paperboy wedges himself between you with today's edition. The headline names three embarrassments before breakfast: the bank robbery, the mayor's vanished dog, and a bakery whose signature scent has disappeared overnight.",
    characterId: "paperboy",
    choices: [
      {
        id: "KA_EVENT_PAPERBOY_BUY",
        text: "Buy the paper and keep him talking.",
        nextNodeId: "scene_karlsruhe_event_arrival_briefing",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
      {
        id: "KA_EVENT_PAPERBOY_GLANCE",
        text: "Skim the front page and wave him on.",
        nextNodeId: "scene_karlsruhe_event_arrival_briefing",
      },
    ],
  },
  {
    id: "scene_karlsruhe_event_arrival_briefing",
    scenarioId: KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_karlsruhe_event_arrival_briefing.md",
    titleOverride: "Victoria's Briefing",
    bodyOverride:
      "Victoria taps the paper with one gloved finger. 'Three public fires, one morning. We do not have time for ceremony. Take the city as it is, not as Freiburg trained you to expect it.'",
    characterId: "assistant",
    choices: [
      {
        id: "KA_EVENT_BRIEFING_ACCEPT",
        text: "Take the newspaper and move out.",
        nextNodeId: "scene_karlsruhe_event_arrival_unlock",
      },
    ],
  },
  {
    id: "scene_karlsruhe_event_arrival_unlock",
    scenarioId: KARLSRUHE_EVENT_ARRIVAL_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_karlsruhe_event_arrival_unlock.md",
    titleOverride: "Case Ledger Opened",
    bodyOverride:
      "The folded newspaper becomes your first Karlsruhe lead sheet. Bank. Rathaus. Bakery. Three names, no ceremony, and the city already moving before you choose.",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "grant_evidence", evidenceId: "ev_karlsruhe_newspaper" },
      { type: "set_flag", key: "karlsruhe_arrival_complete", value: true },
      { type: "unlock_group", groupId: "loc_ka_bank" },
      { type: "unlock_group", groupId: "loc_ka_rathaus" },
      { type: "unlock_group", groupId: "loc_ka_bakery" },
      {
        type: "track_event",
        eventName: "karlsruhe_event_arrival_completed",
        tags: { releaseProfile: "karlsruhe_event" },
      },
    ],
  },
  {
    id: "scene_missing_aroma_briefing",
    scenarioId: KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/04_Missing_Aroma/scene_missing_aroma_briefing.md",
    titleOverride: "Bakery Counter",
    bodyOverride:
      "The baker does not talk about thefts. He talks about absences. This morning the ovens worked, the bread rose, and yet the cardamom signature that draws half the street simply never arrived.",
    onEnter: [
      { type: "set_quest_stage", questId: "quest_missing_aroma", stage: 1 },
      { type: "set_flag", key: "missing_aroma_case_started", value: true },
    ],
    choices: [
      {
        id: "MISSING_AROMA_CHECK_KITCHEN",
        text: "Inspect the ovens and spice shelf.",
        nextNodeId: "scene_missing_aroma_kitchen",
      },
      {
        id: "MISSING_AROMA_QUESTION_APPRENTICE",
        text: "Question the apprentice about the missing scent.",
        choiceType: "inquiry",
        nextNodeId: "scene_missing_aroma_kitchen",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
    ],
  },
  {
    id: "scene_missing_aroma_kitchen",
    scenarioId: KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/04_Missing_Aroma/scene_missing_aroma_kitchen.md",
    titleOverride: "Cooling Rack",
    bodyOverride:
      "The missing aroma was not stolen from the tray. It was intercepted before the dough reached the front room. A torn paper wrap and a wet footprint point toward the service alley.",
    choices: [
      {
        id: "MISSING_AROMA_FOLLOW_TRAIL",
        text: "Follow the service trail into the alley.",
        nextNodeId: "scene_missing_aroma_alley",
        effects: [
          { type: "set_quest_stage", questId: "quest_missing_aroma", stage: 2 },
        ],
      },
    ],
  },
  {
    id: "scene_missing_aroma_alley",
    scenarioId: KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/04_Missing_Aroma/scene_missing_aroma_alley.md",
    titleOverride: "Service Alley",
    bodyOverride:
      "You find the missing spice packet where a courier tried to dry it over a boiler vent. The aroma was borrowed to fake a premium delivery, not to poison the batch. Sloppy, urgent, and easy to unwind.",
    choices: [
      {
        id: "MISSING_AROMA_CLOSE_CASE",
        text: "Recover the packet and close the file quietly.",
        nextNodeId: "scene_missing_aroma_resolution",
      },
    ],
  },
  {
    id: "scene_missing_aroma_resolution",
    scenarioId: KARLSRUHE_MISSING_AROMA_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/04_Missing_Aroma/scene_missing_aroma_resolution.md",
    titleOverride: "Aroma Restored",
    bodyOverride:
      "The baker relights the oven, the scent returns to the room, and the neighborhood never learns how close it came to panic over a missing spice packet.",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_missing_aroma", stage: 3 },
      { type: "set_flag", key: "missing_aroma_case_closed", value: true },
      {
        type: "track_event",
        eventName: "karlsruhe_missing_aroma_closed",
        tags: { releaseProfile: "karlsruhe_event" },
      },
    ],
  },
];
