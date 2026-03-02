import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  VnDiceMode,
  VnScenarioCompletionRoute,
  VnChoice,
  VnCondition,
  VnEffect,
  VnNode,
  VnScenario,
  VnSkillCheck,
  VnSnapshot,
} from "../src/features/vn/types";
import { buildOriginChoiceEffects, originProfiles } from "./origins.manifest";
import { CONTENT_IDS } from "./content-ids";
import { parseCase01Onboarding } from "./vn-case01-onboarding";

type ChoiceBlueprint = VnChoice;

type NodeBlueprint = {
  id: string;
  scenarioId: string;
  sourcePath: string;
  sourcePathByLocale?: Record<string, string>;
  terminal?: boolean;
  choices: ChoiceBlueprint[];
  fallbackBody?: string;
  onEnter?: VnEffect[];
  preconditions?: VnCondition[];
  passiveChecks?: VnSkillCheck[];
  backgroundUrl?: string;
  characterId?: string;
  titleOverride?: string;
  bodyOverride?: string;
};

type ScenarioBlueprint = {
  id: string;
  title: string;
  startNodeId: string;
  nodeIds: string[];
  completionRoute?: VnScenarioCompletionRoute;
  skillCheckDice?: VnDiceMode;
  mode?: "overlay" | "fullscreen";
  packId?: string;
  musicUrl?: string;
  defaultBackgroundUrl?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const storyRoot = path.join(repoRoot, "obsidian", "StoryDetective");
const narrativeLocale = process.env.VN_NARRATIVE_LOCALE ?? "en";
const outputPath = path.join(repoRoot, "content", "vn", "pilot.snapshot.json");
const publicOutputPath = path.join(
  repoRoot,
  "public",
  "content",
  "vn",
  "pilot.snapshot.json",
);
const defaultSkillCheckDice: VnDiceMode = "d20";
const defaultEntryScenarioId = "sandbox_case01_pilot";
const AUTO_CONTINUE_PREFIX = "AUTO_CONTINUE_";

const scenarios: ScenarioBlueprint[] = [
  {
    id: "sandbox_intro_pilot",
    title: "Sandbox Intro Pilot",
    startNodeId: "scene_start",
    mode: "fullscreen",
    packId: "freiburg_intro",
    completionRoute: {
      nextScenarioId: "intro_journalist",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["met_anna_intro", "origin_journalist_handoff_done"],
    },
    nodeIds: [
      "scene_start",
      "scene_language_select",
      "scene_backstory_select",
      "scene_map_intro",
    ],
  },
  {
    id: "sandbox_banker_pilot",
    title: "Banker Intro Pilot",
    startNodeId: "scene_bank_intro",
    mode: "fullscreen",
    packId: "freiburg_banker",
    defaultBackgroundUrl: "/assets/vn/bg/bank_exterior.webp",
    nodeIds: [
      "scene_bank_intro",
      "scene_bank_intro_ch1",
      "scene_bank_intro_ch2",
      "scene_bank_leads",
      "scene_bank_resolution",
    ],
  },
  {
    id: "sandbox_ghost_pilot",
    title: "Ghost Intro Pilot",
    startNodeId: "scene_estate_intro",
    mode: "fullscreen",
    packId: "freiburg_ghost",
    defaultBackgroundUrl: "/assets/vn/bg/estate_night.webp",
    musicUrl: "/assets/vn/music/ghost_ambient.ogg",
    nodeIds: [
      "scene_estate_intro",
      "scene_evidence_collection",
      "scene_conclusion_true",
    ],
  },
  {
    id: "origin_journalist_bootstrap",
    title: "Origin Bootstrap - Journalist",
    startNodeId: "scene_origin_journalist_bootstrap",
    mode: "fullscreen",
    packId: "system_origin_bootstrap",
    completionRoute: {
      nextScenarioId: "intro_journalist",
      requiredFlagsAll: ["origin_journalist"],
      blockedIfFlagsAny: ["origin_journalist_handoff_done", "met_anna_intro"],
    },
    nodeIds: ["scene_origin_journalist_bootstrap"],
  },
  {
    id: "intro_journalist",
    title: "Cafe Riegler \u2013 News & Nerves",
    startNodeId: "scene_journalist_intro",
    mode: "fullscreen",
    packId: "journalist_origin",
    defaultBackgroundUrl: "/assets/vn/bg/cafe_riegler.webp",
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
  {
    id: "intro_aristocrat",
    title: "Salon of Debts and Favors",
    startNodeId: "scene_aristocrat_intro",
    mode: "fullscreen",
    packId: "aristocrat_origin",
    defaultBackgroundUrl: "/assets/vn/bg/salon_night.webp",
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
    defaultBackgroundUrl: "/assets/vn/bg/barracks_dusk.webp",
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
    defaultBackgroundUrl: "/assets/vn/bg/archive_stacks.webp",
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

const journalistOriginProfile = originProfiles.find(
  (profile) => profile.id === "journalist",
);
if (!journalistOriginProfile) {
  throw new Error("Journalist origin profile is missing from originProfiles");
}

const originBackstoryChoices: ChoiceBlueprint[] = originProfiles.map(
  (profile): ChoiceBlueprint => ({
    id: profile.choiceId,
    text: profile.label,
    nextNodeId: "scene_map_intro",
    effects: buildOriginChoiceEffects(profile),
  }),
);

const nodes: NodeBlueprint[] = [
  {
    id: "scene_start",
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
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_language_select.md",
    choices: [
      {
        id: "LANG_DE",
        text: "Select Deutsch",
        nextNodeId: "scene_backstory_select",
        effects: [
          { type: "set_flag", key: "lang_de", value: true },
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
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_backstory_select.md",
    choices: originBackstoryChoices,
  },
  {
    id: "scene_map_intro",
    scenarioId: "sandbox_intro_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    terminal: true,
    choices: [],
  },
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
          { type: "add_var", key: "checks_passed", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_bank_resolution",
    scenarioId: "sandbox_banker_pilot",
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel.md",
    backgroundUrl: "/assets/vn/bg/casino_interior.webp",
    terminal: true,
    choices: [],
    onEnter: [
      { type: "set_quest_stage", questId: "quest_banker", stage: 3 },
      { type: "grant_xp", amount: 50 },
    ],
    fallbackBody: "Pilot resolution node for the banker scenario.",
  },
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
        nextNodeId: "scene_evidence_collection",
      },
    ],
  },
  {
    id: "scene_evidence_collection",
    scenarioId: "sandbox_ghost_pilot",
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
        nextNodeId: "scene_conclusion_true",
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
        nextNodeId: "scene_conclusion_true",
        skillCheck: {
          id: "check_ghost_thermometer",
          voiceId: "attr_intellect",
          difficulty: 8,
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
          onFail: {
            effects: [
              { type: "set_flag", key: "ghost_cold_spot_unclear", value: true },
            ],
          },
        },
        effects: [
          { type: "set_flag", key: "ghost_cold_spot_confirmed", value: true },
          { type: "add_var", key: "attr_spirit", value: 1 },
        ],
      },
      {
        id: "GHOST_EVIDENCE_FLOOR",
        text: "Inspect floor traces",
        choiceType: "inquiry",
        nextNodeId: "scene_conclusion_true",
        effects: [
          { type: "set_flag", key: "ghost_ectoplasm_found", value: true },
          { type: "add_var", key: "checks_passed", value: 1 },
          { type: "grant_evidence", evidenceId: "ev_ectoplasm" },
        ],
      },
    ],
  },
  {
    id: "scene_conclusion_true",
    scenarioId: "sandbox_ghost_pilot",
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_conclusion_true.md",
    terminal: true,
    choices: [],
  },
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
  // ---- Journalist Origin Intro ----
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
  // ---- Aristocrat Origin Intro ----
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
  // ---- Veteran Origin Intro ----
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
  // ---- Archivist Origin Intro ----
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

const case01Onboarding = parseCase01Onboarding(storyRoot);
for (const diagnostic of case01Onboarding.diagnostics) {
  if (diagnostic.severity === "warning") {
    console.warn(
      `Case01 parser warning: ${diagnostic.relativePath}:${diagnostic.line} [${diagnostic.code}] ${diagnostic.message}`,
    );
  }
}

const scenariosWithCase01: ScenarioBlueprint[] = [
  ...scenarios,
  case01Onboarding.scenarioBlueprint,
];
const nodesWithCase01: NodeBlueprint[] = [
  ...nodes,
  ...case01Onboarding.nodeBlueprints,
].map(normalizeNodeAutoContinue);

const mindCases: MindCaseContent[] = [
  {
    id: "case_banker_theft",
    title: "Banker Ledger Theft",
  },
];

const mindFacts: MindFactContent[] = [
  {
    id: "fact_ledger_gap",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_intro_ch2::BANK_CH2_CONTINUE",
    text: "Client ledger has a deliberate accounting gap for one night.",
    tags: {
      theme: "finance",
      reliability: "high",
    },
  },
  {
    id: "fact_banker_nervous",
    caseId: "case_banker_theft",
    sourceType: "vn_passive_check",
    sourceId:
      "sandbox_banker_pilot::scene_bank_intro::check_bank_first_impression",
    text: "The banker's hands trembled when discussing the ledger dates.",
    tags: {
      theme: "behavior",
      reliability: "medium",
    },
  },
  {
    id: "fact_house_contact",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_leads::BANK_LEAD_HOUSE",
    text: "House steward confirms the banker met an unknown courier.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_tavern_alibi",
    caseId: "case_banker_theft",
    sourceType: "vn_choice",
    sourceId: "sandbox_banker_pilot::scene_bank_leads::BANK_LEAD_TAVERN",
    text: "Tavern records break the client's alibi timeline.",
    tags: {
      theme: "timeline",
      reliability: "high",
    },
  },
  {
    id: "fact_journalist_bank_seal",
    caseId: "case_banker_theft",
    sourceType: "vn_on_enter",
    sourceId: "intro_journalist::scene_journalist_show_telegram",
    text: "Telegram seal matches Provincial Bank emergency dispatch wax.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_journalist_master_key",
    caseId: "case_banker_theft",
    sourceType: "vn_on_enter",
    sourceId: "intro_journalist::scene_journalist_anna_tip",
    text: "Anna hands over a cast of the archive master key.",
    tags: {
      theme: "evidence",
      reliability: "high",
    },
  },
];

const mindHypotheses: MindHypothesisContent[] = [
  {
    id: "hyp_banker_inside_job",
    caseId: "case_banker_theft",
    key: "banker_inside_job",
    text: "The banker staged an inside theft and used a courier cover.",
    requiredFactIds: [
      "fact_ledger_gap",
      "fact_house_contact",
      "fact_tavern_alibi",
    ],
    requiredVars: [
      {
        key: "case_progress",
        op: "gte",
        value: 0.4,
      },
    ],
    rewardEffects: [
      { type: "set_flag", key: "case_banker_theft_solved", value: true },
      { type: "add_var", key: "rep_civic", value: 0.5 },
      {
        type: "track_event",
        eventName: "mind_case_banker_solved",
        tags: { caseId: "case_banker_theft" },
      },
    ],
  },
];

const readMarkdown = (relativePath: string): string => {
  const absolutePath = path.join(storyRoot, relativePath);
  return readFileSync(absolutePath, "utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n");
};

const resolveNodeSourcePath = (node: NodeBlueprint): string => {
  if (!node.sourcePathByLocale) {
    return node.sourcePath;
  }

  const localizedPath = node.sourcePathByLocale[narrativeLocale];
  if (localizedPath) {
    return localizedPath;
  }

  return node.sourcePathByLocale.en ?? node.sourcePath;
};

const assertAscii = (value: string, fieldName: string): void => {
  const isAscii = [...value].every((char) => char.charCodeAt(0) <= 0x7f);
  if (!isAscii) {
    throw new Error(`${fieldName} must be ASCII. Received: ${value}`);
  }
};

const assertAsciiTagKeys = (
  tags: Record<string, unknown>,
  fieldName: string,
): void => {
  for (const key of Object.keys(tags)) {
    assertAscii(key, `${fieldName} tag key`);
  }
};

const assertKnownId = (
  registry: Set<string>,
  value: string,
  fieldName: string,
): void => {
  if (!registry.has(value)) {
    throw new Error(`${fieldName} references unknown id: ${value}`);
  }
};

const validateEffectBlueprint = (effect: VnEffect, context: string): void => {
  if ("key" in effect) {
    assertAscii(effect.key, `effect.key in ${context}`);
  }
  if ("locationId" in effect) {
    assertAscii(effect.locationId, `effect.locationId in ${context}`);
  }
  if ("eventName" in effect) {
    assertAscii(effect.eventName, `effect.eventName in ${context}`);
    if (effect.tags) {
      assertAsciiTagKeys(effect.tags, `effect.tags in ${context}`);
    }
  }
  if ("caseId" in effect) {
    assertAscii(effect.caseId, `effect.caseId in ${context}`);
  }
  if ("factId" in effect) {
    assertAscii(effect.factId, `effect.factId in ${context}`);
  }
  if ("groupId" in effect) {
    assertAscii(effect.groupId, `effect.groupId in ${context}`);
    assertKnownId(
      CONTENT_IDS.unlockGroups,
      effect.groupId,
      `effect.groupId in ${context}`,
    );
  }
  if ("questId" in effect) {
    assertAscii(effect.questId, `effect.questId in ${context}`);
    assertKnownId(
      CONTENT_IDS.questIds,
      effect.questId,
      `effect.questId in ${context}`,
    );
  }
  if ("characterId" in effect) {
    assertAscii(effect.characterId, `effect.characterId in ${context}`);
    assertKnownId(
      CONTENT_IDS.characterIds,
      effect.characterId,
      `effect.characterId in ${context}`,
    );
  }
  if ("evidenceId" in effect) {
    assertAscii(effect.evidenceId, `effect.evidenceId in ${context}`);
    assertKnownId(
      CONTENT_IDS.evidenceIds,
      effect.evidenceId,
      `effect.evidenceId in ${context}`,
    );
  }
};

const validateSkillCheck = (check: VnSkillCheck, context: string): void => {
  assertAscii(check.id, `skillCheck.id in ${context}`);
  assertAscii(check.voiceId, `skillCheck.voiceId in ${context}`);

  for (const [outcome, branch] of [
    ["success", check.onSuccess],
    ["fail", check.onFail],
  ] as const) {
    if (!branch) {
      continue;
    }
    if (branch.nextNodeId) {
      assertAscii(
        branch.nextNodeId,
        `skillCheck.${outcome}.nextNodeId in ${context}`,
      );
    }
    for (const effect of branch.effects ?? []) {
      validateEffectBlueprint(effect, `skillCheck.${outcome} in ${context}`);
    }
  }
};

const validateScenarioBlueprint = (scenario: ScenarioBlueprint): void => {
  assertAscii(scenario.id, "scenario.id");
  assertAscii(scenario.startNodeId, `scenario(${scenario.id}).startNodeId`);
  for (const nodeId of scenario.nodeIds) {
    assertAscii(nodeId, `scenario(${scenario.id}).nodeId`);
  }
  if (scenario.completionRoute) {
    assertAscii(
      scenario.completionRoute.nextScenarioId,
      `scenario(${scenario.id}).completionRoute.nextScenarioId`,
    );
    for (const flag of scenario.completionRoute.requiredFlagsAll ?? []) {
      assertAscii(
        flag,
        `scenario(${scenario.id}).completionRoute.requiredFlagsAll`,
      );
    }
    for (const flag of scenario.completionRoute.blockedIfFlagsAny ?? []) {
      assertAscii(
        flag,
        `scenario(${scenario.id}).completionRoute.blockedIfFlagsAny`,
      );
    }
  }
};

const validateChoiceBlueprint = (
  choice: ChoiceBlueprint,
  nodeId: string,
): void => {
  assertAscii(choice.id, `choice.id at node ${nodeId}`);
  assertAscii(choice.nextNodeId, `choice.nextNodeId at node ${nodeId}`);

  for (const condition of choice.conditions ?? []) {
    if ("key" in condition) {
      assertAscii(condition.key, `condition.key in choice ${choice.id}`);
    }
    if ("evidenceId" in condition) {
      assertAscii(
        condition.evidenceId,
        `condition.evidenceId in choice ${choice.id}`,
      );
      assertKnownId(
        CONTENT_IDS.evidenceIds,
        condition.evidenceId,
        `condition.evidenceId in choice ${choice.id}`,
      );
    }
    if ("questId" in condition) {
      assertAscii(
        condition.questId,
        `condition.questId in choice ${choice.id}`,
      );
      assertKnownId(
        CONTENT_IDS.questIds,
        condition.questId,
        `condition.questId in choice ${choice.id}`,
      );
    }
    if ("characterId" in condition) {
      assertAscii(
        condition.characterId,
        `condition.characterId in choice ${choice.id}`,
      );
      assertKnownId(
        CONTENT_IDS.characterIds,
        condition.characterId,
        `condition.characterId in choice ${choice.id}`,
      );
    }
    if ("itemId" in condition) {
      assertAscii(condition.itemId, `condition.itemId in choice ${choice.id}`);
    }
  }

  for (const effect of choice.effects ?? []) {
    validateEffectBlueprint(effect, `choice ${choice.id}`);
  }

  if (choice.skillCheck) {
    validateSkillCheck(choice.skillCheck, `choice ${choice.id}`);
  }
};

const validateNodeBlueprint = (node: NodeBlueprint): void => {
  assertAscii(node.id, "node.id");
  assertAscii(node.scenarioId, `node(${node.id}).scenarioId`);
  if (node.characterId) {
    assertAscii(node.characterId, `node(${node.id}).characterId`);
    assertKnownId(
      CONTENT_IDS.characterIds,
      node.characterId,
      `node(${node.id}).characterId`,
    );
  }
  if (node.sourcePathByLocale) {
    for (const locale of Object.keys(node.sourcePathByLocale)) {
      assertAscii(locale, `node(${node.id}).sourcePathByLocale.locale`);
    }
  }

  const autoContinueChoices = node.choices.filter((choice) =>
    choice.id.startsWith(AUTO_CONTINUE_PREFIX),
  );
  if (autoContinueChoices.length > 1) {
    throw new Error(
      `node(${node.id}) has multiple AUTO_CONTINUE choices (${autoContinueChoices.length})`,
    );
  }
  if (autoContinueChoices.length === 1 && node.choices.length !== 1) {
    throw new Error(
      `node(${node.id}) must not mix AUTO_CONTINUE with other explicit choices`,
    );
  }

  for (const choice of node.choices) {
    validateChoiceBlueprint(choice, node.id);
  }
  for (const effect of node.onEnter ?? []) {
    validateEffectBlueprint(effect, `node.onEnter ${node.id}`);
  }
  for (const check of node.passiveChecks ?? []) {
    validateSkillCheck(check, `node.passiveChecks ${node.id}`);
  }
};

const validateMindCase = (mindCase: MindCaseContent): void => {
  assertAscii(mindCase.id, "mindCase.id");
};

const validateMindFact = (
  fact: MindFactContent,
  knownCaseIds: Set<string>,
): void => {
  assertAscii(fact.id, "mindFact.id");
  assertAscii(fact.caseId, `mindFact(${fact.id}).caseId`);
  assertAscii(fact.sourceType, `mindFact(${fact.id}).sourceType`);
  assertAscii(fact.sourceId, `mindFact(${fact.id}).sourceId`);
  assertAsciiTagKeys(fact.tags ?? {}, `mindFact(${fact.id}).tags`);

  if (!knownCaseIds.has(fact.caseId)) {
    throw new Error(
      `mindFact(${fact.id}) references unknown caseId: ${fact.caseId}`,
    );
  }
};

const validateMindHypothesis = (
  hypothesis: MindHypothesisContent,
  knownCaseIds: Set<string>,
  knownFactIds: Set<string>,
): void => {
  assertAscii(hypothesis.id, "mindHypothesis.id");
  assertAscii(hypothesis.caseId, `mindHypothesis(${hypothesis.id}).caseId`);
  assertAscii(hypothesis.key, `mindHypothesis(${hypothesis.id}).key`);

  if (!knownCaseIds.has(hypothesis.caseId)) {
    throw new Error(
      `mindHypothesis(${hypothesis.id}) references unknown caseId: ${hypothesis.caseId}`,
    );
  }

  for (const requiredFactId of hypothesis.requiredFactIds) {
    assertAscii(
      requiredFactId,
      `mindHypothesis(${hypothesis.id}).requiredFactId`,
    );
    if (!knownFactIds.has(requiredFactId)) {
      throw new Error(
        `mindHypothesis(${hypothesis.id}) references unknown factId: ${requiredFactId}`,
      );
    }
  }

  for (const requiredVar of hypothesis.requiredVars) {
    assertAscii(
      requiredVar.key,
      `mindHypothesis(${hypothesis.id}).requiredVar`,
    );
  }

  for (const effect of hypothesis.rewardEffects) {
    validateEffectBlueprint(effect, `mindHypothesis(${hypothesis.id})`);
  }
};

const validateScenarioGraph = (
  scenarioBlueprints: ScenarioBlueprint[],
  nodeBlueprints: NodeBlueprint[],
): void => {
  const scenarioById = new Map(
    scenarioBlueprints.map((scenario) => [scenario.id, scenario]),
  );
  const nodeById = new Map(nodeBlueprints.map((node) => [node.id, node]));
  const listedNodeIds = new Map<string, string>();

  for (const scenario of scenarioBlueprints) {
    if (scenario.completionRoute) {
      const nextScenario = scenarioById.get(
        scenario.completionRoute.nextScenarioId,
      );
      if (!nextScenario) {
        throw new Error(
          `scenario(${scenario.id}) completionRoute points to unknown scenario ${scenario.completionRoute.nextScenarioId}`,
        );
      }
    }

    const startNode = nodeById.get(scenario.startNodeId);
    if (!startNode) {
      throw new Error(
        `scenario(${scenario.id}) startNodeId is missing: ${scenario.startNodeId}`,
      );
    }
    if (startNode.scenarioId !== scenario.id) {
      throw new Error(
        `scenario(${scenario.id}) startNodeId points to node from ${startNode.scenarioId}`,
      );
    }

    for (const nodeId of scenario.nodeIds) {
      const node = nodeById.get(nodeId);
      if (!node) {
        throw new Error(
          `scenario(${scenario.id}) references missing nodeId ${nodeId}`,
        );
      }
      if (node.scenarioId !== scenario.id) {
        throw new Error(
          `scenario(${scenario.id}) nodeId ${nodeId} belongs to ${node.scenarioId}`,
        );
      }
      if (listedNodeIds.has(nodeId)) {
        throw new Error(
          `nodeId ${nodeId} is listed in multiple scenarios (${listedNodeIds.get(nodeId)} and ${scenario.id})`,
        );
      }
      listedNodeIds.set(nodeId, scenario.id);
    }
  }

  for (const node of nodeBlueprints) {
    if (!scenarioById.has(node.scenarioId)) {
      throw new Error(
        `node(${node.id}) references unknown scenarioId ${node.scenarioId}`,
      );
    }
    if (!listedNodeIds.has(node.id)) {
      throw new Error(
        `node(${node.id}) is orphaned and not listed in any scenario.nodeIds`,
      );
    }

    for (const choice of node.choices) {
      const next = nodeById.get(choice.nextNodeId);
      if (!next) {
        throw new Error(
          `choice(${choice.id}) at node(${node.id}) references missing nextNodeId ${choice.nextNodeId}`,
        );
      }
      if (next.scenarioId !== node.scenarioId) {
        throw new Error(
          `choice(${choice.id}) at node(${node.id}) points outside scenario ${node.scenarioId}`,
        );
      }

      for (const [outcome, branch] of [
        ["success", choice.skillCheck?.onSuccess],
        ["fail", choice.skillCheck?.onFail],
      ] as const) {
        if (!branch?.nextNodeId) {
          continue;
        }
        const outcomeNode = nodeById.get(branch.nextNodeId);
        if (!outcomeNode) {
          throw new Error(
            `skillCheck ${choice.skillCheck?.id} ${outcome} branch at node(${node.id}) points to missing node ${branch.nextNodeId}`,
          );
        }
        if (outcomeNode.scenarioId !== node.scenarioId) {
          throw new Error(
            `skillCheck ${choice.skillCheck?.id} ${outcome} branch at node(${node.id}) points outside scenario ${node.scenarioId}`,
          );
        }
      }
    }

    for (const check of node.passiveChecks ?? []) {
      for (const [outcome, branch] of [
        ["success", check.onSuccess],
        ["fail", check.onFail],
      ] as const) {
        if (!branch?.nextNodeId) {
          continue;
        }
        const outcomeNode = nodeById.get(branch.nextNodeId);
        if (!outcomeNode) {
          throw new Error(
            `passive check ${check.id} ${outcome} branch at node(${node.id}) points to missing node ${branch.nextNodeId}`,
          );
        }
        if (outcomeNode.scenarioId !== node.scenarioId) {
          throw new Error(
            `passive check ${check.id} ${outcome} branch at node(${node.id}) points outside scenario ${node.scenarioId}`,
          );
        }
      }
    }
  }
};

const extractTitle = (markdown: string, fallback: string): string => {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) {
    return fallback;
  }

  const candidate = match[1].trim();
  return candidate.length > 0 ? candidate : fallback;
};

const extractBody = (markdown: string, fallback: string): string => {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const lines = withoutFrontMatter
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("#") &&
        !line.startsWith("##") &&
        !line.startsWith("---") &&
        !line.startsWith("id:") &&
        !line.startsWith("type:") &&
        !line.startsWith("phase:") &&
        !line.startsWith("status:") &&
        !line.startsWith("tags:"),
    );

  if (lines.length === 0) {
    return fallback;
  }

  const joined = lines.slice(0, 3).join(" ");
  const normalized = joined.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return fallback;
  }

  return normalized.length > 280
    ? `${normalized.slice(0, 277)}...`
    : normalized;
};

function normalizeChoiceIdFragment(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
}

function isImplicitContinueText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("continue") ||
    normalized.startsWith("продолжить") ||
    normalized.startsWith("weiter") ||
    normalized.startsWith("далее")
  );
}

function toAutoContinueChoiceId(nodeId: string): string {
  return `${AUTO_CONTINUE_PREFIX}${normalizeChoiceIdFragment(nodeId)}`;
}

function normalizeNodeAutoContinue(node: NodeBlueprint): NodeBlueprint {
  if (node.choices.length !== 1) {
    return node;
  }

  const [choice] = node.choices;
  if (choice.id.startsWith(AUTO_CONTINUE_PREFIX)) {
    return node;
  }
  if (choice.conditions || choice.effects || choice.skillCheck) {
    return node;
  }
  if (!isImplicitContinueText(choice.text)) {
    return node;
  }

  return {
    ...node,
    choices: [
      {
        ...choice,
        id: toAutoContinueChoiceId(node.id),
      },
    ],
  };
}

for (const scenario of scenariosWithCase01) {
  validateScenarioBlueprint(scenario);
}

if (
  !scenariosWithCase01.some(
    (scenario) => scenario.id === defaultEntryScenarioId,
  )
) {
  throw new Error(
    `Default entry scenario '${defaultEntryScenarioId}' is missing from snapshot scenarios`,
  );
}

for (const node of nodesWithCase01) {
  validateNodeBlueprint(node);
}

validateScenarioGraph(scenariosWithCase01, nodesWithCase01);

for (const mindCase of mindCases) {
  validateMindCase(mindCase);
}

const knownCaseIds = new Set<string>(mindCases.map((entry) => entry.id));
const knownFactIds = new Set<string>();
for (const fact of mindFacts) {
  validateMindFact(fact, knownCaseIds);
  knownFactIds.add(fact.id);
}

for (const hypothesis of mindHypotheses) {
  validateMindHypothesis(hypothesis, knownCaseIds, knownFactIds);
}

const builtNodes: VnNode[] = nodesWithCase01.map((node) => {
  const resolvedSourcePath = resolveNodeSourcePath(node);
  const markdown = readMarkdown(resolvedSourcePath);
  const title = node.titleOverride ?? extractTitle(markdown, node.id);
  const body =
    node.bodyOverride ??
    extractBody(markdown, node.fallbackBody ?? `Source: ${resolvedSourcePath}`);

  const vnNode: VnNode = {
    id: node.id,
    scenarioId: node.scenarioId,
    title,
    body,
    terminal: node.terminal,
    choices: node.choices,
  };

  if (node.onEnter) {
    vnNode.onEnter = node.onEnter;
  }
  if (node.preconditions) {
    vnNode.preconditions = node.preconditions;
  }
  if (node.passiveChecks) {
    vnNode.passiveChecks = node.passiveChecks;
  }
  if (node.backgroundUrl) {
    vnNode.backgroundUrl = node.backgroundUrl;
  }
  if (node.characterId) {
    vnNode.characterId = node.characterId;
  }

  return vnNode;
});

const builtScenarios: VnScenario[] = scenariosWithCase01.map((scenario) => {
  const vnScenario: VnScenario = {
    id: scenario.id,
    title: scenario.title,
    startNodeId: scenario.startNodeId,
    nodeIds: scenario.nodeIds,
  };

  if (scenario.mode) {
    vnScenario.mode = scenario.mode;
  }
  if (scenario.completionRoute) {
    vnScenario.completionRoute = scenario.completionRoute;
  }
  if (scenario.skillCheckDice) {
    vnScenario.skillCheckDice = scenario.skillCheckDice;
  }
  if (scenario.packId) {
    vnScenario.packId = scenario.packId;
  }
  if (scenario.musicUrl) {
    vnScenario.musicUrl = scenario.musicUrl;
  }
  if (scenario.defaultBackgroundUrl) {
    vnScenario.defaultBackgroundUrl = scenario.defaultBackgroundUrl;
  }

  return vnScenario;
});

const snapshotPayload: VnSnapshot = {
  schemaVersion: 2,
  scenarios: builtScenarios,
  nodes: builtNodes,
  vnRuntime: {
    skillCheckDice: defaultSkillCheckDice,
    defaultEntryScenarioId,
  },
  mindPalace: {
    cases: mindCases,
    facts: mindFacts,
    hypotheses: mindHypotheses,
  },
};

const payloadJson = JSON.stringify(snapshotPayload);
const checksum = createHash("sha256").update(payloadJson, "utf8").digest("hex");

const output = {
  ...snapshotPayload,
  checksum,
  generatedAt: new Date().toISOString(),
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

mkdirSync(path.dirname(publicOutputPath), { recursive: true });
copyFileSync(outputPath, publicOutputPath);

console.log(`Snapshot written to ${outputPath}`);
console.log(`Public copy written to ${publicOutputPath}`);
console.log(`Checksum: ${checksum}`);
console.log(`Narrative locale: ${narrativeLocale}`);
console.log(`Scenarios: ${builtScenarios.length}, Nodes: ${builtNodes.length}`);
console.log(
  `MindPalace -> Cases: ${mindCases.length}, Facts: ${mindFacts.length}, Hypotheses: ${mindHypotheses.length}`,
);
