import { buildOriginChoiceEffects } from "../../origins.manifest";
import { CASE01_DEFAULT_ENTRY_SCENARIO_ID } from "../../../src/shared/case01Canon";
import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";
import { detectiveOriginProfile } from "./legacy-origin-profiles";

export const PACK_DETECTIVE_ORIGIN_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "origin_detective_bootstrap",
    title: "Origin Bootstrap - Detective",
    startNodeId: "scene_origin_detective_bootstrap",
    mode: "fullscreen",
    packId: "system_origin_bootstrap",
    completionRoute: {
      nextScenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
      requiredFlagsAll: ["origin_detective"],
      blockedIfFlagsAny: ["case01_onboarding_complete"],
    },
    nodeIds: ["scene_origin_detective_bootstrap"],
  },
];

export const PACK_DETECTIVE_ORIGIN_NODES: NodeBlueprint[] = [
  {
    id: "scene_origin_detective_bootstrap",
    scenarioId: "origin_detective_bootstrap",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select.md",
    terminal: true,
    bodyOverride: "Preparing investigation dossier...",
    preconditions: [
      {
        type: "flag_equals",
        key: "origin_detective",
        value: false,
      },
    ],
    onEnter: [
      ...buildOriginChoiceEffects(detectiveOriginProfile),
      {
        type: "track_event",
        eventName: "origin_bootstrap_applied",
        tags: {
          origin: "detective",
          system_flow: "origin_bootstrap",
        },
      },
    ],
    choices: [],
  },
  {
    id: "scene_detective_case01_arrival",
    scenarioId: "detective_case01_prologue",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_case01_arrival.md",
    titleOverride: "Bankhaus J.A. Krebs",
    bodyOverride:
      "A grey morning. The Bankhaus sits behind its iron gates. Victoria Sterling waits by the door, a leather satchel pressed to her side.",
    characterId: "assistant",
    choices: [
      {
        id: "DETECTIVE_ARRIVAL_ENTER",
        text: "Follow Sterling inside.",
        nextNodeId: "scene_detective_case01_investigation",
        effects: [
          {
            type: "track_event",
            eventName: "detective_prologue_entered_bank",
            tags: { route: "detective_prologue" },
          },
        ],
      },
      {
        id: "DETECTIVE_ARRIVAL_INSPECT_EXTERIOR",
        text: "Walk the perimeter first. Old habit.",
        choiceType: "inquiry",
        nextNodeId: "scene_detective_case01_investigation",
        effects: [
          {
            type: "track_event",
            eventName: "detective_prologue_inspected_exterior",
            tags: { route: "detective_prologue" },
          },
          { type: "grant_xp", amount: 5 },
        ],
      },
    ],
  },
  {
    id: "scene_detective_case01_investigation",
    scenarioId: "detective_case01_prologue",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_case01_investigation.md",
    titleOverride: "Vault Corridor",
    bodyOverride:
      "The vault corridor stretches ahead. Victoria has already spread dust patterns across the tiles. A deposit box sits open — no forced entry.",
    characterId: "assistant",
    choices: [
      {
        id: "DETECTIVE_INVESTIGATE_LOCKBOX",
        text: "Examine the lockbox mechanism up close.",
        nextNodeId: "scene_detective_case01_spirit_encounter",
        effects: [
          {
            type: "track_event",
            eventName: "detective_prologue_examined_lockbox",
            tags: { route: "detective_prologue" },
          },
          { type: "grant_xp", amount: 10 },
        ],
      },
      {
        id: "DETECTIVE_INVESTIGATE_CORRIDOR",
        text: "Check the rest of the corridor before focusing.",
        nextNodeId: "scene_detective_case01_spirit_encounter",
        effects: [
          {
            type: "track_event",
            eventName: "detective_prologue_checked_corridor",
            tags: { route: "detective_prologue" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_detective_case01_spirit_encounter",
    scenarioId: "detective_case01_prologue",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_case01_spirit_encounter.md",
    titleOverride: "Something Wrong",
    bodyOverride:
      "The air drops ten degrees. Victoria's hand freezes mid-notation. The gas lamps flicker — not a draught. A voice rises from inside the vault, a ledger being read backwards.",
    choices: [
      {
        id: "DETECTIVE_SPIRIT_CONFRONT",
        text: "Step towards the source.",
        nextNodeId: "scene_detective_case01_knockout",
        effects: [
          {
            type: "track_event",
            eventName: "detective_prologue_confronted_spirit",
            tags: { route: "detective_prologue" },
          },
        ],
      },
      {
        id: "DETECTIVE_SPIRIT_SHIELD_VICTORIA",
        text: "Pull Victoria behind you.",
        nextNodeId: "scene_detective_case01_knockout",
        effects: [
          {
            type: "change_relationship",
            characterId: "assistant",
            delta: 10,
          },
          {
            type: "track_event",
            eventName: "detective_prologue_shielded_victoria",
            tags: { route: "detective_prologue" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_detective_case01_knockout",
    scenarioId: "detective_case01_prologue",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_case01_knockout.md",
    titleOverride: "Blackout",
    bodyOverride:
      "Your training screams for an explanation. But your body is already moving backwards. The last thing you see is Victoria's face, illuminated by a light that has no source. Then the floor meets you.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "detective_prologue_done", value: true },
      {
        type: "track_event",
        eventName: "detective_prologue_knockout",
        tags: { route: "detective_prologue" },
      },
    ],
    choices: [],
  },
  {
    id: "scene_detective_agency_wakeup",
    scenarioId: "detective_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_agency_wakeup.md",
    titleOverride: "Immersion Bath",
    bodyOverride:
      "Steam. A ceramic edge under your fingers. Lotte Weber's voice cuts through the fog: 'Inspector. You are late, you are wet, and you are mine now.'",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "DETECTIVE_WAKEUP_SURFACE",
        text: "Grip the tub rim and sit up.",
        nextNodeId: "scene_detective_agency_orientation",
        effects: [
          {
            type: "track_event",
            eventName: "detective_wakeup_surfaced",
            tags: { route: "detective_wakeup" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_detective_agency_orientation",
    scenarioId: "detective_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_agency_orientation.md",
    titleOverride: "Agency Corridor",
    bodyOverride:
      "Weber walks you down a corridor lined with locked doors. Every surface looks designed to be hosed down. 'You were an inspector. That is useful. Less useful: you have seen something you were not supposed to see.'",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "DETECTIVE_ORIENTATION_ASK",
        text: "Ask what the Agency wants from a detective.",
        nextNodeId: "scene_detective_recruitment_pitch",
      },
      {
        id: "DETECTIVE_ORIENTATION_DEMAND",
        text: "Demand to know what happened in the vault.",
        choiceType: "inquiry",
        nextNodeId: "scene_detective_recruitment_pitch",
        effects: [
          {
            type: "track_event",
            eventName: "detective_wakeup_demanded_answers",
            tags: { route: "detective_wakeup" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_detective_recruitment_pitch",
    scenarioId: "detective_agency_wakeup",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_Detective/scene_detective_recruitment_pitch.md",
    titleOverride: "Weber's Pitch",
    bodyOverride:
      "Weber drops a thin case file on the table. 'The bank was the beginning. Not the end. Welcome to the Grenzwanderer programme. Try not to die on the first day.'",
    characterId: "npc_weber_dispatcher",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "origin_detective_handoff_done", value: true },
      {
        type: "track_event",
        eventName: "detective_wakeup_completed",
        tags: { route: "detective_wakeup" },
      },
    ],
    choices: [],
  },
];
