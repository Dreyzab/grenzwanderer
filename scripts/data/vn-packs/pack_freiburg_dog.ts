import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_DOG_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_dog_pilot",
    title: "Dog Intro Pilot",
    startNodeId: "scene_dog_briefing",
    mode: "fullscreen",
    packId: "freiburg_dog",
    defaultBackgroundUrl: "/images/scenes/scene_rathaus_interior.webp",
    nodeIds: [
      "scene_dog_briefing",
      "scene_dog_leads",
      "scene_dog_caseboard",
      "scene_dog_market_encounter",
      "scene_dog_market_beat2",
      "scene_dog_station_encounter",
      "scene_dog_station_beat2",
      "scene_dog_tailor_encounter",
      "scene_dog_tailor_beat2",
      "scene_dog_uni_encounter",
      "scene_dog_pub_encounter",
      "scene_dog_pub_beat2",
      "scene_park_reunion_beat1",
      "scene_park_reunion",
    ],
  },
];

export const PACK_FREIBURG_DOG_NODES: NodeBlueprint[] = [
  {
    id: "scene_dog_briefing",
    scenarioId: "sandbox_dog_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_briefing.md",
    characterId: "npc_anna_mahler",
    onEnter: [
      { type: "set_quest_stage", questId: "quest_dog", stage: 1 },
      { type: "set_flag", key: "dog_case_started", value: true },
    ],
    choices: [
      {
        id: "DOG_BRIEFING_CONTINUE",
        text: "Open lead board",
        choiceType: "action",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_leads",
    scenarioId: "sandbox_dog_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_leads.md",
    choices: [
      {
        id: "DOG_LEAD_MARKET",
        text: "Check the market route",
        nextNodeId: "scene_dog_market_encounter",
        conditions: [
          { type: "flag_equals", key: "dog_lead_market_done", value: false },
        ],
      },
      {
        id: "DOG_LEAD_STATION",
        text: "Check station witnesses",
        nextNodeId: "scene_dog_station_encounter",
        conditions: [
          { type: "flag_equals", key: "dog_lead_station_done", value: false },
        ],
      },
      {
        id: "DOG_LEAD_TAILOR",
        text: "Question tailor network",
        nextNodeId: "scene_dog_tailor_encounter",
        conditions: [
          { type: "flag_equals", key: "dog_lead_tailor_done", value: false },
        ],
      },
      {
        id: "DOG_LEAD_UNI",
        text: "Inspect university records",
        nextNodeId: "scene_dog_uni_encounter",
        conditions: [
          { type: "flag_equals", key: "dog_lead_uni_done", value: false },
        ],
      },
      {
        id: "DOG_LEAD_PUB",
        text: "Reconstruct pub timeline",
        nextNodeId: "scene_dog_pub_encounter",
        conditions: [
          { type: "flag_equals", key: "dog_lead_pub_done", value: false },
        ],
      },
      {
        id: "DOG_LEAD_CASEBOARD",
        text: "Review the current findings",
        nextNodeId: "scene_dog_caseboard",
      },
      {
        id: "DOG_LEAD_REUNION",
        text: "Convene at the park",
        nextNodeId: "scene_park_reunion_beat1",
        conditions: [{ type: "var_gte", key: "dog_leads_progress", value: 5 }],
        effects: [{ type: "set_quest_stage", questId: "quest_dog", stage: 2 }],
      },
    ],
  },
  {
    id: "scene_dog_caseboard",
    scenarioId: "sandbox_dog_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_caseboard.md",
    choices: [
      {
        id: "DOG_CASEBOARD_RETURN",
        text: "Back to leads",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_market_encounter",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_market_encounter.md",
    onEnter: [
      { type: "set_flag", key: "dog_lead_market_done", value: true },
      { type: "add_var", key: "dog_leads_progress", value: 1 },
    ],
    choices: [
      {
        id: "DOG_MARKET_VENDOR_PRESS",
        text: "Pressure the vendor for route details",
        choiceType: "action",
        nextNodeId: "scene_dog_market_beat2",
        skillCheck: {
          id: "check_dog_market_pressure",
          voiceId: "attr_social",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            effects: [
              {
                type: "set_flag",
                key: "dog_market_route_confirmed",
                value: true,
              },
              { type: "add_var", key: "checks_passed", value: 1 },
            ],
          },
          onFail: {
            effects: [{ type: "add_heat", amount: 1 }],
          },
        },
      },
      {
        id: "DOG_MARKET_QUIET_NOTE",
        text: "Log observations and move on",
        choiceType: "inquiry",
        nextNodeId: "scene_dog_market_beat2",
        effects: [{ type: "add_var", key: "dog_case_confidence", value: 0.2 }],
      },
    ],
  },
  {
    id: "scene_dog_market_beat2",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_market_beat2.md",
    onEnter: [
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_market_route",
      },
    ],
    choices: [
      {
        id: "DOG_MARKET_BEAT2_RETURN",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_station_encounter",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_station_encounter.md",
    onEnter: [
      { type: "set_flag", key: "dog_lead_station_done", value: true },
      { type: "add_var", key: "dog_leads_progress", value: 1 },
      { type: "change_relationship", characterId: "npc_anna_mahler", delta: 1 },
    ],
    choices: [
      {
        id: "DOG_STATION_BRIBE_PORTER",
        text: "Bribe the porter for schedule logs",
        choiceType: "action",
        nextNodeId: "scene_dog_station_beat2",
        effects: [
          { type: "set_flag", key: "dog_station_log_obtained", value: true },
          { type: "add_var", key: "rep_civic", value: -0.1 },
        ],
      },
      {
        id: "DOG_STATION_INTERVIEW",
        text: "Conduct a formal witness interview",
        choiceType: "inquiry",
        nextNodeId: "scene_dog_station_beat2",
        effects: [{ type: "add_var", key: "dog_case_confidence", value: 0.3 }],
      },
      {
        id: "DOG_STATION_RECHECK",
        text: "Re-check rail manifests",
        choiceType: "inquiry",
        nextNodeId: "scene_dog_station_beat2",
        conditions: [{ type: "var_gte", key: "attr_intellect", value: 2 }],
        effects: [{ type: "add_var", key: "dog_case_confidence", value: 0.4 }],
      },
      {
        id: "DOG_STATION_WRAP",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_station_beat2",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_station_beat2.md",
    onEnter: [
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_station_manifest",
      },
    ],
    choices: [
      {
        id: "DOG_STATION_BEAT2_RETURN",
        text: "Back to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_tailor_encounter",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_tailor_encounter.md",
    onEnter: [
      { type: "set_flag", key: "dog_lead_tailor_done", value: true },
      { type: "add_var", key: "dog_leads_progress", value: 1 },
      { type: "grant_evidence", evidenceId: "ev_bank_master_key" },
    ],
    choices: [
      {
        id: "DOG_TAILOR_AUDIT_BOOKS",
        text: "Audit tailor invoices",
        choiceType: "inquiry",
        nextNodeId: "scene_dog_tailor_beat2",
        effects: [{ type: "add_var", key: "dog_case_confidence", value: 0.3 }],
      },
      {
        id: "DOG_TAILOR_INTIMIDATE",
        text: "Intimidate workshop apprentice",
        choiceType: "action",
        nextNodeId: "scene_dog_tailor_beat2",
        effects: [
          { type: "add_tension", amount: 1 },
          { type: "set_flag", key: "dog_tailor_intimidation", value: true },
        ],
      },
      {
        id: "DOG_TAILOR_RETURN",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_tailor_beat2",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_tailor_beat2.md",
    onEnter: [
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_tailor_invoice",
      },
    ],
    choices: [
      {
        id: "DOG_TAILOR_BEAT2_RETURN",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_uni_encounter",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_uni_encounter.md",
    onEnter: [
      { type: "set_flag", key: "dog_lead_uni_done", value: true },
      { type: "set_flag", key: "dog_registry_found", value: true },
      { type: "add_var", key: "dog_leads_progress", value: 1 },
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_uni_registry",
      },
    ],
    choices: [
      {
        id: "DOG_UNI_ARCHIVE_REQUEST",
        text: "Request registry with legal notice",
        choiceType: "action",
        nextNodeId: "scene_dog_leads",
        effects: [
          { type: "set_flag", key: "dog_uni_registry_official", value: true },
          {
            type: "change_relationship",
            characterId: "npc_anna_mahler",
            delta: 1,
          },
        ],
      },
      {
        id: "DOG_UNI_STEALTH_COPY",
        text: "Copy registry quietly after hours",
        choiceType: "action",
        nextNodeId: "scene_dog_leads",
        effects: [
          { type: "set_flag", key: "dog_uni_registry_unofficial", value: true },
          { type: "add_heat", amount: 1 },
        ],
      },
      {
        id: "DOG_UNI_RETURN",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_pub_encounter",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_pub_encounter.md",
    onEnter: [
      { type: "set_flag", key: "dog_lead_pub_done", value: true },
      { type: "set_flag", key: "ghost_route_unlocked", value: true },
      { type: "add_var", key: "dog_leads_progress", value: 1 },
    ],
    choices: [
      {
        id: "DOG_PUB_TRUST_BARTENDER",
        text: "Trust bartender testimony",
        choiceType: "inquiry",
        nextNodeId: "scene_dog_pub_beat2",
        effects: [{ type: "add_var", key: "dog_case_confidence", value: 0.2 }],
      },
      {
        id: "DOG_PUB_TAIL_SUSPECT",
        text: "Tail the suspect immediately",
        choiceType: "action",
        nextNodeId: "scene_dog_pub_beat2",
        skillCheck: {
          id: "check_dog_pub_tail",
          voiceId: "attr_perception",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            effects: [
              { type: "set_flag", key: "dog_pub_tail_success", value: true },
              { type: "add_var", key: "checks_passed", value: 1 },
            ],
          },
          onFail: {
            effects: [{ type: "add_tension", amount: 1 }],
          },
        },
      },
      {
        id: "DOG_PUB_RETURN",
        text: "Return to lead board",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_dog_pub_beat2",
    scenarioId: "sandbox_dog_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_pub_beat2.md",
    onEnter: [
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_pub_identification",
      },
    ],
    choices: [
      {
        id: "DOG_PUB_BEAT2_RETURN",
        text: "Head back to leads",
        nextNodeId: "scene_dog_leads",
      },
    ],
  },
  {
    id: "scene_park_reunion_beat1",
    backgroundUrl: "/images/scenes/scene_park_reunion.png",
    scenarioId: "sandbox_dog_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_park_reunion_beat1.md",
    choices: [
      {
        id: "DOG_REUNION_CONTINUE",
        text: "Finalize findings",
        nextNodeId: "scene_park_reunion",
      },
    ],
  },
  {
    id: "scene_park_reunion",
    backgroundUrl: "/images/scenes/scene_park_reunion.png",
    scenarioId: "sandbox_dog_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_park_reunion.md",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_flag", key: "dog_reunion_reached", value: true },
      {
        type: "discover_fact",
        caseId: "case_dog_trail",
        factId: "fact_dog_reunion_capstone",
      },
    ],
  },
];
