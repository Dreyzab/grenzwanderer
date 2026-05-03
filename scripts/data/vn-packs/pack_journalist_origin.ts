import { buildOriginChoiceEffects } from "../../origins.manifest";
import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import { journalistOriginProfile } from "./legacy-origin-profiles";

export const PACK_JOURNALIST_ORIGIN_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "origin_journalist_bootstrap",
    title: "Origin Bootstrap - Journalist",
    startNodeId: "scene_origin_journalist_bootstrap",
    mode: "fullscreen",
    packId: "system_origin_bootstrap",
    completionRoute: {
      nextScenarioId: "journalist_agency_wakeup",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["origin_journalist_handoff_done"],
    },
    nodeIds: ["scene_origin_journalist_bootstrap"],
  },
  {
    id: "journalist_agency_wakeup",
    title: "Immersion Bath Wakeup",
    startNodeId: "scene_journalist_agency_wakeup",
    mode: "fullscreen",
    packId: "journalist_origin",
    completionRoute: {
      nextScenarioId: "sandbox_agency_briefing",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["agency_briefing_complete"],
    },
    nodeIds: [
      "scene_journalist_agency_wakeup",
      "scene_journalist_memory_gap",
      "scene_journalist_cellar_valve",
      "scene_journalist_cellar_ledger",
      "scene_journalist_cellar_uniform",
      "scene_journalist_recruitment_pitch",
    ],
  },
];

export const PACK_JOURNALIST_ORIGIN_NODES: NodeBlueprint[] = [
  {
    id: "scene_origin_journalist_bootstrap",
    scenarioId: "origin_journalist_bootstrap",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select.md",
    terminal: true,
    bodyOverride: "Preparing case file...",
    preconditions: [
      {
        type: "flag_equals",
        key: "origin_journalist",
        value: false,
      },
    ],
    onEnter: [
      ...buildOriginChoiceEffects(journalistOriginProfile),
      {
        type: "track_event",
        eventName: "origin_bootstrap_applied",
        tags: {
          origin: "journalist",
          system_flow: "origin_bootstrap",
        },
      },
    ],
    choices: [],
  },
  {
    id: "scene_journalist_agency_wakeup",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_agency_wakeup.md",
    titleOverride: "Immersion Bath",
    bodyOverride:
      "Steam claws at your lungs as Lotte Weber orders you upright from the Agency immersion tub before the memory fog can settle.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "JOURNALIST_WAKEUP_SURFACE",
        text: "Grip the tub rim and force yourself upright.",
        nextNodeId: "scene_journalist_memory_gap",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_surfaced",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_memory_gap",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_memory_gap.md",
    titleOverride: "Missing Notes",
    bodyOverride:
      "Your satchel is empty, your notes are gone, and Weber refuses to explain until you prove you can still think on your feet.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "JOURNALIST_WAKEUP_ORIENT",
        text: "Ask Lotte where you are and why your notes are gone.",
        nextNodeId: "scene_journalist_recruitment_pitch",
      },
      {
        id: "JOURNALIST_WAKEUP_INSPECT_VALVE",
        text: "Ignore the answer for a second and inspect the steam valve.",
        choiceType: "inquiry",
        nextNodeId: "scene_journalist_cellar_valve",
      },
    ],
  },
  {
    id: "scene_journalist_cellar_valve",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_valve.md",
    titleOverride: "Steam Valve",
    bodyOverride:
      "The valve hisses beside the tub, wet metal and rushed maintenance turning the cellar into a machine room that never quite cools.",
    characterId: "inspector",
    choices: [
      {
        id: "JOURNALIST_VALVE_TO_LEDGER",
        text: "Trace the wet pipe to the ledger crate by the wall.",
        nextNodeId: "scene_journalist_cellar_ledger",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_valve_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
      {
        id: "JOURNALIST_VALVE_CONTINUE",
        text: "Leave the hardware alone and face Lotte properly.",
        nextNodeId: "scene_journalist_recruitment_pitch",
      },
    ],
  },
  {
    id: "scene_journalist_cellar_ledger",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_ledger.md",
    titleOverride: "Ledger Crate",
    bodyOverride:
      "A swollen ledger lies beside the wall, its page edges marked by recent handling and the kind of haste that leaves trails.",
    characterId: "inspector",
    choices: [
      {
        id: "JOURNALIST_LEDGER_TO_UNIFORM",
        text: "Set the ledger down and inspect the drying uniform.",
        nextNodeId: "scene_journalist_cellar_uniform",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_ledger_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
      {
        id: "JOURNALIST_LEDGER_CONTINUE",
        text: "Keep the page numbers in mind and hear the offer out.",
        nextNodeId: "scene_journalist_recruitment_pitch",
      },
    ],
  },
  {
    id: "scene_journalist_cellar_uniform",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_cellar_uniform.md",
    titleOverride: "Drying Uniform",
    bodyOverride:
      "A fresh inspector's coat hangs above the boiler, still damp from the bath heat and already waiting to become your cover.",
    characterId: "inspector",
    choices: [
      {
        id: "JOURNALIST_UNIFORM_CONTINUE",
        text: "Pull the coat on and demand the short version.",
        nextNodeId: "scene_journalist_recruitment_pitch",
        effects: [
          {
            type: "track_event",
            eventName: "journalist_wakeup_uniform_checked",
            tags: { route: "journalist_wakeup" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_recruitment_pitch",
    scenarioId: "journalist_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_recruitment_pitch.md",
    titleOverride: "Weber's Pitch",
    bodyOverride:
      "Weber drops the performance at last: the Agency needs a journalist who can wear a badge, follow the money, and survive the city long enough to report back.",
    characterId: "npc_weber_dispatcher",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "origin_journalist_handoff_done", value: true },
      {
        type: "track_event",
        eventName: "journalist_wakeup_completed",
        tags: { route: "journalist_wakeup" },
      },
    ],
    choices: [],
  },
];
