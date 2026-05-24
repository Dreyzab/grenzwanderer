import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_FREIBURG_GHOST_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "sandbox_ghost_pilot",
    title: "Ghost Intro Pilot",
    startNodeId: "scene_estate_intro",
    mode: "fullscreen",
    packId: "freiburg_ghost",
    defaultBackgroundUrl: "/images/scenes/scene_estate_intro.png",
    musicUrl: "/assets/vn/music/ghost_ambient.ogg",
    nodeIds: [
      "scene_estate_intro",
      "scene_estate_intro_beat1",
      "scene_guild_tutorial",
      "scene_guild_tutorial_beat1",
      "scene_evidence_collection",
      "scene_evidence_collection_beat1",
      "scene_conclusion_false",
      "scene_conclusion_true",
    ],
  },
];

export const PACK_FREIBURG_GHOST_NODES: NodeBlueprint[] = [
  {
    id: "scene_estate_intro",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro.md",
    backgroundUrl: "/assets/vn/bg/estate_entrance.webp",
    onEnter: [
      { type: "add_tension", amount: 2 },
      { type: "set_quest_stage", questId: "quest_ghost", stage: 1 },
    ],
    choices: [
      {
        id: "GHOST_INVESTIGATE",
        text: "Begin estate investigation",
        choiceType: "action",
        nextNodeId: "scene_estate_intro_beat1",
      },
      {
        id: "GHOST_ABORT",
        text: "File a superficial report",
        choiceType: "flavor",
        nextNodeId: "scene_conclusion_false",
      },
    ],
  },
  {
    id: "scene_estate_intro_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro_beat1.md",
    choices: [
      {
        id: "GHOST_BEAT1_CONTINUE",
        text: "Proceed to guild orientation",
        nextNodeId: "scene_guild_tutorial",
      },
    ],
  },
  {
    id: "scene_guild_tutorial",
    backgroundUrl: "/images/scenes/scene_guild_tutorial.png",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_guild_tutorial.md",
    choices: [
      {
        id: "GHOST_TUTORIAL_CONTINUE",
        text: "Continue briefing",
        nextNodeId: "scene_guild_tutorial_beat1",
      },
    ],
  },
  {
    id: "scene_guild_tutorial_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_guild_tutorial_beat1.md",
    choices: [
      {
        id: "GHOST_TUTORIAL_INVESTIGATE",
        text: "Start evidence sweep",
        nextNodeId: "scene_evidence_collection",
      },
    ],
  },
  {
    id: "scene_evidence_collection",
    backgroundUrl: "/images/scenes/scene_evidence_collection.png",
    scenarioId: "sandbox_ghost_pilot",
    voicePresenceMode: "parliament",
    activeSpeakers: ["attr_intellect", "attr_perception", "attr_spirit"],
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection.md",
    passiveChecks: [
      {
        id: "check_ghost_cold_draft",
        voiceId: "attr_spirit",
        difficulty: 12,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "set_flag", key: "ghost_draft_sensed", value: true },
          ],
        },
      },
    ],
    choices: [
      {
        id: "GHOST_EVIDENCE_BOOKSHELF",
        text: "Inspect bookshelf",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        effects: [
          {
            type: "set_flag",
            key: "ghost_bookshelf_switch_found",
            value: true,
          },
          { type: "add_var", key: "attr_shadow", value: 1 },
          { type: "grant_evidence", evidenceId: "ev_bookshelf_switch" },
        ],
      },
      {
        id: "GHOST_EVIDENCE_THERMOMETER",
        text: "Check the temperature anomaly",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        skillCheck: {
          id: "check_ghost_thermometer",
          voiceId: "attr_intellect",
          difficulty: 4,
          showChancePercent: true,
          outcomeModel: "tiered",
          modifiers: [
            {
              source: "preparation",
              sourceId: "calibrated_thermometer",
              delta: 3,
            },
          ],
          onSuccess: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              { type: "add_var", key: "attr_spirit", value: 1 },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
          },
          onCritical: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              {
                type: "set_flag",
                key: "ghost_thermometer_mastery",
                value: true,
              },
              { type: "add_var", key: "attr_spirit", value: 1 },
              { type: "add_var", key: "attr_intellect", value: 1 },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
          },
          onSuccessWithCost: {
            effects: [
              {
                type: "set_flag",
                key: "ghost_cold_spot_confirmed",
                value: true,
              },
              {
                type: "set_flag",
                key: "ghost_thermometer_overreach",
                value: true,
              },
              { type: "grant_evidence", evidenceId: "ev_cold_spot" },
            ],
            costEffects: [{ type: "add_var", key: "attr_shadow", value: 1 }],
          },
          onFail: {
            effects: [
              { type: "set_flag", key: "ghost_cold_spot_unclear", value: true },
            ],
          },
        },
        effects: [
          { type: "track_event", eventName: "ghost_thermometer_check" },
        ],
      },
      {
        id: "GHOST_EVIDENCE_FLOOR",
        text: "Inspect floor traces",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        effects: [
          { type: "set_flag", key: "ghost_ectoplasm_found", value: true },
          { type: "add_var", key: "checks_passed", value: 1 },
          { type: "grant_evidence", evidenceId: "ev_ectoplasm" },
        ],
      },
      {
        id: "GHOST_WITCH_VEIL_FOCUS",
        text: "[Veil Sight] Ask what in the room is not human.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
        effects: [
          { type: "set_flag", key: "ghost_veil_resonance_seen", value: true },
          { type: "set_flag", key: "ghost_human_cover_suspected", value: true },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
          {
            type: "track_event",
            eventName: "witch_veil_focus",
            tags: { location: "grand_estate", scope: "session_hook" },
          },
        ],
        inlineText:
          "**[attr_spirit]**:\nThe cold does not begin at the window. It gathers around the pantry door, where a living hand has touched the same brass latch too often. The spirit is real, but someone alive has learned its route.",
      },
      {
        id: "GHOST_WITCH_BLOOD_TEMPTATION",
        text: "[Blood Curse] Breathe through the metallic scent near the pantry.",
        choiceType: "flavor",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "var_gte", key: "witch_blood_curse_pressure", value: 50 },
        ],
        effects: [
          {
            type: "set_flag",
            key: "ghost_witch_blood_temptation_seen",
            value: true,
          },
          { type: "add_var", key: "witch_blood_curse_pressure", value: -20 },
          { type: "add_var", key: "witch_blood_power", value: 1 },
          { type: "add_var", key: "witch_blood_debt", value: 16 },
        ],
        inlineText:
          "**[Narrator]**:\nThe scent is old wine, cut copper, and fear. Relief comes quickly enough to be dangerous. The hunger quiets, but it takes a note of the room for later.",
      },
      {
        id: "GHOST_WITCH_FRIENDRICH_LEDGER_MEMORY",
        text: "[Ledger Memory] Listen for the accountant whose case you already met.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          {
            type: "logic_or",
            conditions: [
              { type: "flag_equals", key: "flag_witch_ghost_freed", value: true },
              { type: "flag_equals", key: "flag_witch_ghost_bound", value: true },
            ],
          },
        ],
        effects: [
          {
            type: "grant_evidence",
            evidenceId: "ev_friedrich_ledger_testimony",
          },
          {
            type: "set_flag",
            key: "ghost_session_hook_spirit_bargain",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nThe cold remembers a brass-bound ledger. Friedrich's testimony lines up here too: the same partners, the same night the vault was sealed. The pages you carry in memory now answer the room.",
      },
      {
        id: "GHOST_WITCH_KARL_SERVICE_CORRIDOR",
        text: "[Service Corridor] Walk the pantry route Karl trusted you with.",
        choiceType: "inquiry",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "flag_equals", key: "flag_witch_helped_karl_hbf", value: true },
          { type: "flag_equals", key: "flag_witch_attacked_karl", value: false },
        ],
        effects: [
          {
            type: "grant_evidence",
            evidenceId: "ev_karl_service_corridor_testimony",
          },
          {
            type: "set_flag",
            key: "ghost_session_hook_karl_smuggling_key",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nKarl's directions hold. The pantry door opens onto the smuggling corridor he keeps quiet about — a clean path from cellar to yard that someone living used the night Friedrich died.",
      },
      {
        id: "GHOST_WITCH_KARL_PANIC_TRACE",
        text: "[Panic Trace] Read the corridor where Karl was fed on.",
        choiceType: "flavor",
        nextNodeId: "scene_evidence_collection_beat1",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          { type: "flag_equals", key: "flag_witch_attacked_karl", value: true },
        ],
        effects: [
          {
            type: "set_flag",
            key: "ghost_karl_testimony_compromised",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nThe service corridor still smells of Karl's fear. His silence will read as a ghost story to anyone who asks — and his testimony, if it ever comes, will carry the bite mark with it.",
      },
    ],
  },
  {
    id: "scene_evidence_collection_beat1",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_evidence_collection_beat1.md",
    choices: [
      {
        id: "GHOST_COLLECT_MORE",
        text: "Collect more traces before conclusion",
        nextNodeId: "scene_evidence_collection",
      },
      {
        id: "GHOST_CONCLUSION_TRUE",
        text: "Build a full accusation",
        nextNodeId: "scene_conclusion_true",
        conditions: [
          {
            type: "flag_equals",
            key: "ghost_bookshelf_switch_found",
            value: true,
          },
          {
            type: "flag_equals",
            key: "ghost_ectoplasm_found",
            value: true,
          },
        ],
        effects: [
          { type: "set_quest_stage", questId: "quest_ghost", stage: 2 },
          { type: "set_flag", key: "ghost_truth_proven", value: true },
        ],
      },
      {
        id: "GHOST_CONCLUSION_FALSE",
        text: "File it as folklore",
        nextNodeId: "scene_conclusion_false",
        effects: [
          { type: "set_quest_stage", questId: "quest_ghost", stage: 2 },
        ],
      },
    ],
  },
  {
    id: "scene_conclusion_false",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_false.md",
    terminal: true,
    choices: [],
    onEnter: [{ type: "set_flag", key: "ghost_truth_proven", value: false }],
  },
  {
    id: "scene_conclusion_true",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_true.md",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_ghost", stage: 3 },
      { type: "set_flag", key: "ghost_case_closed", value: true },
      { type: "grant_xp", amount: 45 },
    ],
  },
];
