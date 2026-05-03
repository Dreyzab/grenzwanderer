import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_BANKER_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_banker_pilot",
    title: "Banker Intro Pilot",
    startNodeId: "scene_bank_intro",
    mode: "fullscreen",
    packId: "freiburg_banker",
    defaultBackgroundUrl: "/images/scenes/scene_bank_intro.png",
    nodeIds: [
      "scene_bank_intro",
      "scene_bank_intro_ch1",
      "scene_bank_intro_ch2",
      "scene_bank_leads",
      "scene_bank_resolution",
      "scene_bank_resolution_victory",
      "scene_bank_resolution_defeat",
    ],
  },
];

export const PACK_FREIBURG_BANKER_NODES: NodeBlueprint[] = [
  {
    id: "scene_bank_intro",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro.md",
    characterId: "npc_banker_kessler",
    onEnter: [
      { type: "set_flag", key: "banker_intro_seen", value: true },
      { type: "add_tension", amount: 1 },
    ],
    passiveChecks: [
      {
        id: "check_bank_first_impression",
        voiceId: "attr_social",
        difficulty: 10,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "set_flag", key: "banker_nervous_noticed", value: true },
            {
              type: "discover_fact",
              caseId: "case_banker_theft",
              factId: "fact_banker_nervous",
            },
          ],
        },
      },
    ],
    choices: [
      {
        id: "BANK_INTRO_ACCEPT",
        text: "Accept the case without pressure",
        choiceType: "action",
        nextNodeId: "scene_bank_intro_ch1",
      },
      {
        id: "BANK_INTRO_PRESS_MOTIVE",
        text: "Press on hidden motives",
        choiceType: "inquiry",
        nextNodeId: "scene_bank_intro_ch2",
        conditions: [{ type: "var_gte", key: "attr_intellect", value: 2 }],
        effects: [
          { type: "add_var", key: "stress_index", value: 0.1 },
          { type: "add_heat", amount: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_bank_intro_ch1",
    scenarioId: "sandbox_banker_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_ch1.md",
    choices: [
      {
        id: "BANK_CH1_CONTINUE",
        text: "Move to lead hub",
        nextNodeId: "scene_bank_leads",
        effects: [
          { type: "set_flag", key: "banker_client_cooperative", value: true },
          { type: "add_var", key: "rep_finance", value: 0.4 },
        ],
      },
    ],
  },
  {
    id: "scene_bank_intro_ch2",
    scenarioId: "sandbox_banker_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_ch2.md",
    choices: [
      {
        id: "BANK_CH2_CONTINUE",
        text: "Move to lead hub",
        nextNodeId: "scene_bank_leads",
        effects: [
          { type: "set_flag", key: "clue_ledger_gap", value: true },
          {
            type: "discover_fact",
            caseId: "case_banker_theft",
            factId: "fact_ledger_gap",
          },
          { type: "set_flag", key: "banker_client_hostile", value: true },
          { type: "add_var", key: "rep_civic", value: 0.2 },
        ],
      },
    ],
  },
  {
    id: "scene_bank_leads",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads.md",
    choices: [
      {
        id: "BANK_LEAD_HOUSE",
        text: "Follow house lead",
        nextNodeId: "scene_bank_leads",
        conditions: [
          {
            type: "flag_equals",
            key: "banker_lead_house_checked",
            value: false,
          },
        ],
        effects: [
          { type: "set_flag", key: "banker_lead_house_checked", value: true },
          {
            type: "discover_fact",
            caseId: "case_banker_theft",
            factId: "fact_house_contact",
          },
          { type: "add_var", key: "case_progress", value: 0.2 },
        ],
      },
      {
        id: "BANK_LEAD_TAVERN",
        text: "Follow tavern lead",
        nextNodeId: "scene_bank_leads",
        conditions: [
          {
            type: "flag_equals",
            key: "banker_lead_tavern_checked",
            value: false,
          },
        ],
        effects: [
          { type: "set_flag", key: "banker_lead_tavern_checked", value: true },
          {
            type: "discover_fact",
            caseId: "case_banker_theft",
            factId: "fact_tavern_alibi",
          },
          { type: "add_var", key: "case_progress", value: 0.2 },
        ],
      },
      {
        id: "BANK_LEAD_CASINO",
        text: "Proceed to casino confrontation",
        nextNodeId: "scene_bank_resolution",
        conditions: [{ type: "var_gte", key: "case_progress", value: 0.2 }],
        effects: [
          { type: "set_flag", key: "banker_finale_started", value: true },
          { type: "set_flag", key: "son_duel_done", value: false },
          { type: "set_flag", key: "son_duel_won", value: false },
          { type: "set_flag", key: "son_duel_lost", value: false },
          { type: "add_var", key: "checks_passed", value: 1 },
          {
            type: "open_battle_mode",
            scenarioId: "sandbox_son_duel",
            returnTab: "vn",
          },
        ],
      },
    ],
  },
  {
    id: "scene_bank_resolution",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel.md",
    backgroundUrl: "/images/scenes/scene_casino_duel.png",
    choices: [
      {
        id: "BANK_RESOLUTION_WIN",
        text: "Press the advantage",
        nextNodeId: "scene_bank_resolution_victory",
        conditions: [{ type: "flag_equals", key: "son_duel_won", value: true }],
      },
      {
        id: "BANK_RESOLUTION_LOSS",
        text: "Recover the thread",
        nextNodeId: "scene_bank_resolution_defeat",
        conditions: [
          { type: "flag_equals", key: "son_duel_lost", value: true },
        ],
      },
    ],
    fallbackBody:
      "The room holds its breath after the duel. Continue once the outcome has settled.",
  },
  {
    id: "scene_bank_resolution_victory",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel.md",
    backgroundUrl: "/images/scenes/scene_casino_duel.png",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_banker", stage: 3 },
      { type: "set_flag", key: "banker_case_closed", value: true },
    ],
    fallbackBody:
      "Friedrich finally buckles. The bluff is broken and the banker case can now close on your terms.",
  },
  {
    id: "scene_bank_resolution_defeat",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel.md",
    backgroundUrl: "/images/scenes/scene_casino_duel.png",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_banker", stage: 3 },
      { type: "set_flag", key: "banker_case_closed", value: true },
    ],
    fallbackBody:
      "Friedrich steals the momentum for a moment, but the case still lurches into a fail-forward resolution.",
  },
];
