import type { NodeBlueprint } from "../../vn-blueprint-types";
import type { ScenarioBlueprint } from "../../vn-blueprint-types";

export const PACK_INTRO_JOURNALIST_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: "intro_journalist",
    title: "Cafe Riegler \u2013 News & Nerves",
    startNodeId: "scene_journalist_intro",
    mode: "fullscreen",
    packId: "journalist_origin",
    defaultBackgroundUrl: "/images/scenes/jurnalistintro.png",
    nodeIds: [
      "scene_journalist_intro",
      "scene_journalist_shivers",
      "scene_journalist_key_secret",
      "scene_journalist_messenger",
      "scene_journalist_show_telegram",
      "scene_journalist_anna_tip",
      "scene_journalist_exit",
    ],
  },
];

export const PACK_INTRO_JOURNALIST_NODES: NodeBlueprint[] = [
  {
    id: "scene_journalist_intro",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_intro.md",
    sourcePathByLocale: {
      en: "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_intro.md",
      ru: "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_intro.ru.md",
    },
    characterId: "npc_anna_mahler",
    choices: [
      {
        id: "JOURNALIST_SHIVERS_CHECK",
        text: "[Shivers] Close your eyes and feel the vibration of the floor.",
        choiceType: "inquiry",
        nextNodeId: "scene_journalist_shivers",
        skillCheck: {
          id: "check_journalist_shivers",
          voiceId: "attr_spirit",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_journalist_shivers",
            effects: [
              { type: "set_flag", key: "used_shivers_intro", value: true },
              { type: "add_var", key: "checks_passed", value: 1 },
              { type: "add_var", key: "track_mythologist_xp", value: 1 },
              {
                type: "track_event",
                eventName: "journalist_shivers_success",
                tags: { route: "journalist_origin" },
              },
            ],
          },
          onFail: {
            nextNodeId: "scene_journalist_key_secret",
            effects: [
              { type: "add_var", key: "checks_failed", value: 1 },
              { type: "add_tension", amount: 1 },
              {
                type: "track_event",
                eventName: "journalist_shivers_fail",
                tags: { route: "journalist_origin" },
              },
            ],
          },
        },
      },
      {
        id: "JOURNALIST_SELECTIVE_EXCAVATION",
        text: '"A detective only digs when the client pays for the shovel, Anna."',
        choiceType: "action",
        nextNodeId: "scene_journalist_key_secret",
        effects: [{ type: "add_var", key: "track_whistleblower_xp", value: 1 }],
      },
    ],
  },
  {
    id: "scene_journalist_shivers",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_shivers.md",
    characterId: "inspector",
    onEnter: [{ type: "set_flag", key: "used_shivers_intro", value: true }],
    choices: [
      {
        id: "JOURNALIST_SHIVERS_CONTINUE",
        text: "She looks at you like you've grown a second head.",
        nextNodeId: "scene_journalist_key_secret",
        effects: [{ type: "grant_influence", amount: 1 }],
      },
    ],
  },
  {
    id: "scene_journalist_key_secret",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_key_secret.md",
    characterId: "npc_anna_mahler",
    choices: [
      {
        id: "JOURNALIST_KEY_SECRET_CONTINUE",
        text: "A messenger boy in a tattered blue cap skids to a halt by your table.",
        nextNodeId: "scene_journalist_messenger",
      },
      {
        id: "JOURNALIST_FLAW_PLACE_WAGER",
        text: "[Flaw] Bet your last coin on the messenger's destination.",
        choiceType: "flavor",
        nextNodeId: "scene_journalist_messenger",
        conditions: [
          { type: "flag_equals", key: "flaw_gambling_addiction", value: true },
        ],
        effects: [
          { type: "add_var", key: "var_addiction_pressure", value: 1 },
          { type: "add_heat", amount: 1 },
          {
            type: "track_event",
            eventName: "journalist_flaw_wager",
            tags: { flaw: "gambling_addiction" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_messenger",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_messenger.md",
    characterId: "inspector",
    choices: [
      {
        id: "JOURNALIST_SHOW_SEAL",
        text: '"It seems an exclusive awaits us. But keep your mouth shut."',
        choiceType: "action",
        nextNodeId: "scene_journalist_show_telegram",
        skillCheck: {
          id: "check_journalist_show_seal",
          voiceId: "attr_deception",
          difficulty: 12,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_journalist_show_telegram",
            effects: [
              {
                type: "change_relationship",
                characterId: "npc_anna_mahler",
                delta: 15,
              },
              { type: "set_flag", key: "anna_knows_secret", value: true },
              { type: "add_var", key: "checks_passed", value: 1 },
              { type: "add_var", key: "track_whistleblower_xp", value: 1 },
              {
                type: "set_flag",
                key: "track_whistleblower_tier1",
                value: true,
              },
              {
                type: "track_event",
                eventName: "journalist_show_seal_success",
                tags: { route: "whistleblower" },
              },
            ],
          },
          onFail: {
            nextNodeId: "scene_journalist_exit",
            effects: [
              {
                type: "change_relationship",
                characterId: "npc_anna_mahler",
                delta: -5,
              },
              { type: "add_var", key: "checks_failed", value: 1 },
              { type: "add_heat", amount: 1 },
              {
                type: "track_event",
                eventName: "journalist_show_seal_fail",
                tags: { route: "whistleblower" },
              },
            ],
          },
        },
      },
      {
        id: "JOURNALIST_HIDE_SEAL",
        text: "Pocket the telegram without a word.",
        choiceType: "action",
        nextNodeId: "scene_journalist_exit",
        effects: [
          { type: "add_var", key: "track_mythologist_xp", value: 1 },
          { type: "set_flag", key: "track_mythologist_tier1", value: true },
          { type: "add_tension", amount: 1 },
        ],
      },
      {
        id: "JOURNALIST_FLAW_DOUBLE_OR_NOTHING",
        text: "[Flaw] Offer the boy double if he tells who paid him.",
        choiceType: "action",
        nextNodeId: "scene_journalist_exit",
        conditions: [
          { type: "flag_equals", key: "flaw_gambling_addiction", value: true },
        ],
        effects: [
          { type: "add_var", key: "var_addiction_pressure", value: 2 },
          { type: "add_heat", amount: 2 },
          { type: "grant_influence", amount: 1 },
          {
            type: "track_event",
            eventName: "journalist_double_or_nothing",
            tags: { flaw: "gambling_addiction" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_journalist_show_telegram",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_show_telegram.md",
    characterId: "inspector",
    onEnter: [
      {
        type: "discover_fact",
        caseId: "case_banker_theft",
        factId: "fact_journalist_bank_seal",
      },
    ],
    choices: [
      {
        id: "JOURNALIST_TELEGRAM_CONTINUE",
        text: "Anna's smirk softens into a look of genuine intrigue.",
        nextNodeId: "scene_journalist_anna_tip",
      },
    ],
  },
  {
    id: "scene_journalist_anna_tip",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_anna_tip.md",
    characterId: "npc_anna_mahler",
    onEnter: [
      { type: "grant_evidence", evidenceId: "ev_bank_master_key" },
      {
        type: "discover_fact",
        caseId: "case_banker_theft",
        factId: "fact_journalist_master_key",
      },
      { type: "grant_influence", amount: 1 },
    ],
    choices: [
      {
        id: "JOURNALIST_TIP_CONTINUE",
        text: "You drain the last of your cold coffee and stand up.",
        nextNodeId: "scene_journalist_exit",
      },
    ],
  },
  {
    id: "scene_journalist_exit",
    scenarioId: "intro_journalist",
    sourcePath:
      "40_GameViewer/Sandbox_KA/04_Journalist/scene_journalist_exit.md",
    characterId: "inspector",
    terminal: true,
    passiveChecks: [
      {
        id: "check_nose_for_story",
        voiceId: "attr_perception",
        difficulty: 12,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "set_flag", key: "nose_for_story_triggered", value: true },
            { type: "grant_influence", amount: 1 },
            {
              type: "track_event",
              eventName: "nose_for_story_triggered",
              tags: { origin: "journalist" },
            },
          ],
        },
      },
    ],
    onEnter: [
      { type: "set_flag", key: "met_anna_intro", value: true },
      { type: "set_flag", key: "origin_journalist_handoff_done", value: true },
      { type: "unlock_group", groupId: "loc_ka_rathaus" },
      { type: "unlock_group", groupId: "loc_rathaus" },
    ],
    choices: [],
  },
];
