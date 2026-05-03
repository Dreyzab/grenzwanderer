import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_OTHER_ORIGIN_INTROS_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "intro_aristocrat",
    title: "Salon of Debts and Favors",
    startNodeId: "scene_aristocrat_intro",
    mode: "fullscreen",
    packId: "aristocrat_origin",
    defaultBackgroundUrl: "/images/scenes/salon_night.png",
    nodeIds: [
      "scene_aristocrat_intro",
      "scene_aristocrat_ballroom",
      "scene_aristocrat_debt",
      "scene_aristocrat_blackmail",
      "scene_aristocrat_favor",
      "scene_aristocrat_exit",
    ],
  },
  {
    id: "intro_veteran",
    title: "Barracks Echo",
    startNodeId: "scene_veteran_intro",
    mode: "fullscreen",
    packId: "veteran_origin",
    defaultBackgroundUrl: "/images/scenes/barracks_dusk.png",
    nodeIds: [
      "scene_veteran_intro",
      "scene_veteran_flashback",
      "scene_veteran_dispatch",
      "scene_veteran_checkpoint",
      "scene_veteran_oath",
      "scene_veteran_exit",
    ],
  },
  {
    id: "intro_archivist",
    title: "Stacks of Omitted Pages",
    startNodeId: "scene_archivist_intro",
    mode: "fullscreen",
    packId: "archivist_origin",
    defaultBackgroundUrl: "/images/scenes/archive_stacks.png",
    nodeIds: [
      "scene_archivist_intro",
      "scene_archivist_catalog",
      "scene_archivist_discrepancy",
      "scene_archivist_restriction",
      "scene_archivist_unlock",
      "scene_archivist_exit",
    ],
  },
];

export const PACK_OTHER_ORIGIN_INTROS_NODES: NodeBlueprint[] = [
  {
    id: "scene_aristocrat_intro",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_intro.md",
    characterId: "npc_baroness_elise",
    choices: [
      {
        id: "ARISTOCRAT_COURTESY_CHECK",
        text: "[Social] Mirror her etiquette before speaking.",
        nextNodeId: "scene_aristocrat_ballroom",
        skillCheck: {
          id: "check_aristocrat_courtesy",
          voiceId: "attr_social",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_aristocrat_ballroom",
            effects: [
              { type: "add_var", key: "checks_passed", value: 1 },
              { type: "grant_influence", amount: 1 },
            ],
          },
          onFail: {
            nextNodeId: "scene_aristocrat_debt",
            effects: [
              { type: "add_var", key: "checks_failed", value: 1 },
              { type: "add_heat", amount: 1 },
            ],
          },
        },
      },
      {
        id: "ARISTOCRAT_SKIP_RITUAL",
        text: "Skip formalities and ask about the debt register.",
        nextNodeId: "scene_aristocrat_debt",
      },
    ],
  },
  {
    id: "scene_aristocrat_ballroom",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_ballroom.md",
    characterId: "npc_baroness_elise",
    choices: [
      {
        id: "ARISTOCRAT_BALLROOM_CONTINUE",
        text: "Accept a private lead ledger from the Baroness.",
        nextNodeId: "scene_aristocrat_blackmail",
        effects: [
          { type: "add_var", key: "track_whistleblower_xp", value: 1 },
          { type: "set_flag", key: "track_whistleblower_tier1", value: true },
        ],
      },
    ],
  },
  {
    id: "scene_aristocrat_debt",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_debt.md",
    characterId: "inspector",
    choices: [
      {
        id: "ARISTOCRAT_DEBT_CONTINUE",
        text: "Trace signatures from the unpaid pages.",
        nextNodeId: "scene_aristocrat_blackmail",
      },
      {
        id: "ARISTOCRAT_FLAW_INSULT",
        text: "[Flaw] Publicly humiliate a minor lord to force compliance.",
        nextNodeId: "scene_aristocrat_blackmail",
        conditions: [
          { type: "flag_equals", key: "flaw_prideful_etiquette", value: true },
        ],
        effects: [
          { type: "add_heat", amount: 1 },
          { type: "add_var", key: "var_addiction_pressure", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_aristocrat_blackmail",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_blackmail.md",
    characterId: "npc_baroness_elise",
    onEnter: [{ type: "grant_evidence", evidenceId: "ev_aristocrat_seal" }],
    choices: [
      {
        id: "ARISTOCRAT_BLACKMAIL_CONTINUE",
        text: "Lock the compromise letter in your coat.",
        nextNodeId: "scene_aristocrat_favor",
        effects: [
          { type: "set_quest_stage", questId: "quest_aristocrat", stage: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_aristocrat_favor",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_favor.md",
    characterId: "npc_baroness_elise",
    choices: [
      {
        id: "ARISTOCRAT_FAVOR_CONTINUE",
        text: "Promise one favor in exchange for silence.",
        nextNodeId: "scene_aristocrat_exit",
        effects: [{ type: "add_var", key: "track_mythologist_xp", value: 1 }],
      },
    ],
  },
  {
    id: "scene_aristocrat_exit",
    scenarioId: "intro_aristocrat",
    sourcePath:
      "40_GameViewer/Sandbox_KA/05_Aristocrat/scene_aristocrat_exit.md",
    characterId: "inspector",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "met_baroness_intro", value: true },
      { type: "set_flag", key: "origin_aristocrat_handoff_done", value: true },
      { type: "unlock_group", groupId: "loc_ka_bank" },
    ],
    choices: [],
  },
  {
    id: "scene_veteran_intro",
    scenarioId: "intro_veteran",
    sourcePath: "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_intro.md",
    characterId: "npc_major_falk",
    choices: [
      {
        id: "VETERAN_FLASHBACK_CHECK",
        text: "[Spirit] Hold your stance while artillery memories return.",
        nextNodeId: "scene_veteran_flashback",
        skillCheck: {
          id: "check_veteran_flashback",
          voiceId: "attr_spirit",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_veteran_flashback",
            effects: [{ type: "add_var", key: "checks_passed", value: 1 }],
          },
          onFail: {
            nextNodeId: "scene_veteran_dispatch",
            effects: [{ type: "add_var", key: "checks_failed", value: 1 }],
          },
        },
      },
      {
        id: "VETERAN_KEEP_MOVING",
        text: "Push the memories down and request immediate briefing.",
        nextNodeId: "scene_veteran_dispatch",
      },
    ],
  },
  {
    id: "scene_veteran_flashback",
    scenarioId: "intro_veteran",
    sourcePath:
      "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_flashback.md",
    characterId: "inspector",
    choices: [
      {
        id: "VETERAN_FLASHBACK_CONTINUE",
        text: "Count breathing cadence until your hands stop shaking.",
        nextNodeId: "scene_veteran_dispatch",
        effects: [
          {
            type: "set_flag",
            key: "veteran_flashback_controlled",
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: "scene_veteran_dispatch",
    scenarioId: "intro_veteran",
    sourcePath: "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_dispatch.md",
    characterId: "npc_major_falk",
    onEnter: [{ type: "grant_evidence", evidenceId: "ev_veteran_dispatch" }],
    choices: [
      {
        id: "VETERAN_DISPATCH_CONTINUE",
        text: "Memorize the courier route and unit aliases.",
        nextNodeId: "scene_veteran_checkpoint",
        effects: [
          { type: "set_quest_stage", questId: "quest_veteran", stage: 1 },
        ],
      },
      {
        id: "VETERAN_FLAW_TRIGGER",
        text: "[Flaw] Lash out at a trainee who dropped his rifle.",
        nextNodeId: "scene_veteran_checkpoint",
        conditions: [
          {
            type: "flag_equals",
            key: "flaw_battle_scar_trigger",
            value: true,
          },
        ],
        effects: [{ type: "add_heat", amount: 1 }],
      },
    ],
  },
  {
    id: "scene_veteran_checkpoint",
    scenarioId: "intro_veteran",
    sourcePath:
      "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_checkpoint.md",
    characterId: "npc_major_falk",
    choices: [
      {
        id: "VETERAN_CHECKPOINT_CONTINUE",
        text: "Call in old favors to pass an inspection line.",
        nextNodeId: "scene_veteran_oath",
        effects: [{ type: "add_var", key: "track_whistleblower_xp", value: 1 }],
      },
    ],
  },
  {
    id: "scene_veteran_oath",
    scenarioId: "intro_veteran",
    sourcePath: "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_oath.md",
    characterId: "npc_major_falk",
    choices: [
      {
        id: "VETERAN_OATH_CONTINUE",
        text: "Swear to finish what your unit never could.",
        nextNodeId: "scene_veteran_exit",
        effects: [{ type: "add_var", key: "track_mythologist_xp", value: 1 }],
      },
    ],
  },
  {
    id: "scene_veteran_exit",
    scenarioId: "intro_veteran",
    sourcePath: "40_GameViewer/Sandbox_KA/06_Veteran/scene_veteran_exit.md",
    characterId: "inspector",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "met_major_falk_intro", value: true },
      { type: "set_flag", key: "origin_veteran_handoff_done", value: true },
      { type: "unlock_group", groupId: "loc_ka_estate" },
    ],
    choices: [],
  },
  {
    id: "scene_archivist_intro",
    scenarioId: "intro_archivist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_intro.md",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "ARCHIVIST_INDEX_CHECK",
        text: "[Intellect] Rebuild the missing index from memory.",
        nextNodeId: "scene_archivist_catalog",
        skillCheck: {
          id: "check_archivist_index",
          voiceId: "attr_intellect",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_archivist_catalog",
            effects: [{ type: "add_var", key: "checks_passed", value: 1 }],
          },
          onFail: {
            nextNodeId: "scene_archivist_discrepancy",
            effects: [{ type: "add_var", key: "checks_failed", value: 1 }],
          },
        },
      },
      {
        id: "ARCHIVIST_SKIP_TO_LEDGER",
        text: "Ignore catalog policy and jump to restricted ledgers.",
        nextNodeId: "scene_archivist_discrepancy",
      },
    ],
  },
  {
    id: "scene_archivist_catalog",
    scenarioId: "intro_archivist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_catalog.md",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "ARCHIVIST_CATALOG_CONTINUE",
        text: "Flag irregular signatures for later comparison.",
        nextNodeId: "scene_archivist_discrepancy",
      },
    ],
  },
  {
    id: "scene_archivist_discrepancy",
    scenarioId: "intro_archivist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_discrepancy.md",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "ARCHIVIST_DISCREPANCY_CONTINUE",
        text: "Cross-link the missing folios to municipal tax seals.",
        nextNodeId: "scene_archivist_restriction",
      },
      {
        id: "ARCHIVIST_FLAW_OVERSCRIBE",
        text: "[Flaw] Rewrite the archive index in your own notation.",
        nextNodeId: "scene_archivist_restriction",
        conditions: [
          {
            type: "flag_equals",
            key: "flaw_obsessive_archivist",
            value: true,
          },
        ],
        effects: [{ type: "add_tension", amount: 1 }],
      },
    ],
  },
  {
    id: "scene_archivist_restriction",
    scenarioId: "intro_archivist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_restriction.md",
    characterId: "inspector",
    onEnter: [
      { type: "grant_evidence", evidenceId: "ev_archivist_index_card" },
    ],
    choices: [
      {
        id: "ARCHIVIST_RESTRICTION_CONTINUE",
        text: "Keep the card hidden and request one final key.",
        nextNodeId: "scene_archivist_unlock",
      },
    ],
  },
  {
    id: "scene_archivist_unlock",
    scenarioId: "intro_archivist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_unlock.md",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "ARCHIVIST_UNLOCK_CONTINUE",
        text: "Catalog the key and leave before dawn.",
        nextNodeId: "scene_archivist_exit",
        effects: [
          { type: "set_quest_stage", questId: "quest_archivist", stage: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_archivist_exit",
    scenarioId: "intro_archivist",
    sourcePath: "40_GameViewer/Sandbox_KA/07_Archivist/scene_archivist_exit.md",
    characterId: "inspector",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "met_archivist_intro", value: true },
      { type: "set_flag", key: "origin_archivist_handoff_done", value: true },
      { type: "unlock_group", groupId: "loc_ka_bank" },
    ],
    choices: [],
  },
];
