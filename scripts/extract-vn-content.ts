import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  MindCaseContent,
  MindFactContent,
  MindHypothesisContent,
  MapAction,
  MapCondition,
  VnDiceMode,
  VnScenarioCompletionRoute,
  VnChoice,
  VnCondition,
  VnEffect,
  VnNode,
  QuestCatalogEntry,
  VnScenario,
  VnSkillCheck,
  VnSnapshot,
} from "../src/features/vn/types";
import { CURRENT_VN_SNAPSHOT_SCHEMA_VERSION } from "../src/features/vn/snapshotSchema";
import { buildOriginChoiceEffects, originProfiles } from "./origins.manifest";
import { CONTENT_IDS } from "./content-ids";
import {
  CONDITION_OPERATORS,
  EFFECT_OPERATORS,
  FLAG_KEYS,
  VAR_KEYS,
  VOICE_IDS,
  suggestClosest,
} from "./content-vocabulary";
import { buildCase01MapSnapshot } from "./data/case_01_points";
import {
  AGENCY_SERVICE_CRITERION_IDS,
  FREIBURG_SOCIAL_CATALOG,
  FREIBURG_SOCIAL_CAREER_RANK_IDS,
  FREIBURG_SOCIAL_NPC_IDS,
  FREIBURG_SOCIAL_RUMOR_IDS,
} from "./data/freiburg_social_catalog";
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
  voicePresenceMode?: VnNode["voicePresenceMode"];
  activeSpeakers?: string[];
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
const SOCIAL_VERIFICATION_KINDS = new Set([
  "evidence",
  "fact",
  "service_unlock",
  "map_unlock",
]);
const RUMOR_TEMPLATE_BY_ID = new Map(
  FREIBURG_SOCIAL_CATALOG.rumors.map((entry) => [entry.id, entry]),
);

const scenarios: ScenarioBlueprint[] = [
  {
    id: "sandbox_loop_demo",
    title: "Loop Demo Pilot",
    startNodeId: "scene_loop_demo_intro",
    mode: "overlay",
    packId: "system_loop_demo",
    nodeIds: ["scene_loop_demo_intro", "scene_loop_demo_end"],
  },
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
    id: "sandbox_agency_briefing",
    title: "Agency Briefing",
    startNodeId: "scene_agency_briefing_intro",
    mode: "overlay",
    packId: "freiburg_agency",
    nodeIds: ["scene_agency_briefing_intro", "scene_agency_briefing_outro"],
  },
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
  {
    id: "sandbox_city_student_tip",
    title: "Living City: Student Tip",
    startNodeId: "scene_city_student_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_student_tip", "scene_city_student_tip_end"],
  },
  {
    id: "sandbox_city_cleaner_tip",
    title: "Living City: Cleaner Tip",
    startNodeId: "scene_city_cleaner_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_cleaner_tip", "scene_city_cleaner_tip_end"],
  },
  {
    id: "sandbox_city_bootblack_tip",
    title: "Living City: Bootblack Tip",
    startNodeId: "scene_city_bootblack_tip",
    mode: "overlay",
    packId: "freiburg_living_city",
    nodeIds: ["scene_city_bootblack_tip", "scene_city_bootblack_tip_end"],
  },
  {
    id: "sandbox_workers_pub_rumor",
    title: "Workers Pub Rumor",
    startNodeId: "scene_workers_pub_rumor",
    mode: "overlay",
    packId: "freiburg_rumors",
    nodeIds: ["scene_workers_pub_rumor", "scene_workers_pub_rumor_end"],
  },
  {
    id: "sandbox_agency_service_unlock",
    title: "Agency Service: Anna's Introduction",
    startNodeId: "scene_agency_service_unlock",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: ["scene_agency_service_unlock", "scene_agency_service_unlock_end"],
  },
  {
    id: "sandbox_student_house_access",
    title: "Student House Access",
    startNodeId: "scene_student_house_access",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: ["scene_student_house_access", "scene_student_house_access_end"],
  },
  {
    id: "sandbox_agency_promotion_review",
    title: "Agency Promotion Review",
    startNodeId: "scene_agency_promotion_review",
    mode: "overlay",
    packId: "freiburg_social",
    nodeIds: [
      "scene_agency_promotion_review",
      "scene_agency_promotion_review_end",
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
    id: "scene_loop_demo_intro",
    scenarioId: "sandbox_loop_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Loop Demo Start",
    bodyOverride: "This is a demo scenario for testing the Mind Palace loop.",
    choices: [
      {
        id: "LOOP_DEMO_CLUE",
        text: "Discover the demo fact",
        choiceType: "action",
        nextNodeId: "scene_loop_demo_end",
        effects: [
          {
            type: "discover_fact",
            caseId: "case_loop_demo",
            factId: "fact_loop_clue",
          },
          { type: "track_event", eventName: "loop_demo_fact_discovered" },
        ],
      },
    ],
  },
  {
    id: "scene_loop_demo_end",
    scenarioId: "sandbox_loop_demo",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_start.md",
    titleOverride: "Loop Demo End",
    bodyOverride:
      "You have discovered the fact. Please check your Mind Palace.",
    terminal: true,
    choices: [],
  },
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
  {
    id: "scene_agency_briefing_intro",
    scenarioId: "sandbox_agency_briefing",
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Agency/scene_agency_briefing_intro.md",
    characterId: "inspector",
    choices: [
      {
        id: "AGENCY_BRIEFING_ACCEPT",
        text: "Take the first assignments and open the city map.",
        nextNodeId: "scene_agency_briefing_outro",
        effects: [
          { type: "set_flag", key: "agency_briefing_complete", value: true },
          { type: "set_quest_stage", questId: "quest_banker", stage: 1 },
          { type: "track_event", eventName: "agency_briefing_completed" },
          { type: "grant_xp", amount: 10 },
        ],
      },
    ],
  },
  {
    id: "scene_agency_briefing_outro",
    scenarioId: "sandbox_agency_briefing",
    sourcePath:
      "40_GameViewer/Case01/Plot/02_Agency/scene_agency_briefing_outro.md",
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
  {
    id: "scene_city_student_tip",
    scenarioId: "sandbox_city_student_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_student_seen", value: true },
      { type: "track_event", eventName: "city_student_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_STUDENT_CONTINUE",
        text: "Leave them be",
        nextNodeId: "scene_city_student_tip_end",
      },
    ],
  },
  {
    id: "scene_city_student_tip_end",
    scenarioId: "sandbox_city_student_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_city_cleaner_tip",
    scenarioId: "sandbox_city_cleaner_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_cleaner_seen", value: true },
      { type: "track_event", eventName: "city_cleaner_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_CLEANER_CONTINUE",
        text: "Move along",
        nextNodeId: "scene_city_cleaner_tip_end",
      },
    ],
  },
  {
    id: "scene_city_cleaner_tip_end",
    scenarioId: "sandbox_city_cleaner_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_city_bootblack_tip",
    scenarioId: "sandbox_city_bootblack_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip.md",
    onEnter: [
      { type: "set_flag", key: "city_bootblack_seen", value: true },
      { type: "track_event", eventName: "city_bootblack_tip_seen" },
    ],
    choices: [
      {
        id: "CITY_BOOTBLACK_CONTINUE",
        text: "Walk away",
        nextNodeId: "scene_city_bootblack_tip_end",
      },
    ],
  },
  {
    id: "scene_city_bootblack_tip_end",
    scenarioId: "sandbox_city_bootblack_tip",
    sourcePath:
      "40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_workers_pub_rumor",
    scenarioId: "sandbox_workers_pub_rumor",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor.md",
    onEnter: [{ type: "track_event", eventName: "workers_pub_rumor_opened" }],
    choices: [
      {
        id: "WORKERS_PUB_RUMOR_PURSUE",
        text: "Cut through the alleys before the lead goes cold.",
        nextNodeId: "scene_workers_pub_rumor_end",
        effects: [
          { type: "grant_xp", amount: 5 },
          { type: "register_rumor", rumorId: "rumor_bank_rail_yard" },
          {
            type: "change_favor_balance",
            npcId: "npc_anna_mahler",
            delta: 1,
            reason: "workers_pub_rumor_chain",
          },
          {
            type: "track_event",
            eventName: "workers_pub_rumor_registered",
            tags: { rumorId: "rumor_bank_rail_yard" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_workers_pub_rumor_end",
    scenarioId: "sandbox_workers_pub_rumor",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor_end.md",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_agency_service_unlock",
    scenarioId: "sandbox_agency_service_unlock",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Service: Anna's Introduction",
    bodyOverride:
      "Anna can still open the student house, but only if your ledger with her or the agency still carries enough weight.",
    characterId: "npc_anna_mahler",
    choices: [
      {
        id: "AGENCY_SERVICE_UNLOCK_CONFIRM",
        text: "Commit Anna's introduction to the banker file.",
        nextNodeId: "scene_agency_service_unlock_end",
        requireAll: [
          {
            type: "rumor_state_is",
            rumorId: "rumor_bank_rail_yard",
            status: "verified",
          },
          {
            type: "flag_equals",
            key: "service_anna_student_intro_unlocked",
            value: false,
          },
        ],
        requireAny: [
          {
            type: "favor_balance_gte",
            npcId: "npc_anna_mahler",
            value: 1,
          },
          {
            type: "agency_standing_gte",
            value: 15,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "service_anna_student_intro_unlocked",
            value: true,
          },
          { type: "unlock_group", groupId: "loc_student_house" },
          {
            type: "change_favor_balance",
            npcId: "npc_anna_mahler",
            delta: -1,
            reason: "student_house_introduction",
          },
          {
            type: "change_agency_standing",
            delta: 5,
            reason: "source_network_preserved",
          },
          {
            type: "record_service_criterion",
            criterionId: "preserved_source_network",
          },
          {
            type: "track_event",
            eventName: "agency_service_student_intro_unlocked",
            tags: { serviceId: "svc_anna_student_intro" },
          },
        ],
      },
      {
        id: "AGENCY_SERVICE_UNLOCK_DELAY",
        text: "Hold the introduction in reserve for now.",
        nextNodeId: "scene_agency_service_unlock_end",
      },
    ],
  },
  {
    id: "scene_agency_service_unlock_end",
    scenarioId: "sandbox_agency_service_unlock",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Desk",
    bodyOverride:
      "The file returns to the board with Anna's channels either committed or kept in reserve.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_student_house_access",
    scenarioId: "sandbox_student_house_access",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor.md",
    titleOverride: "Student House Access",
    bodyOverride:
      "A fraternity porter weighs Anna's name against your badge before deciding whether the door opens.",
    characterId: "npc_anna_mahler",
    preconditions: [
      {
        type: "flag_equals",
        key: "service_anna_student_intro_unlocked",
        value: true,
      },
    ],
    choices: [
      {
        id: "STUDENT_HOUSE_PRESENT_INTRODUCTION",
        text: "Present Anna's introduction and enter the house.",
        nextNodeId: "scene_student_house_access_end",
        requireAll: [
          {
            type: "flag_equals",
            key: "service_anna_student_intro_unlocked",
            value: true,
          },
        ],
        requireAny: [
          {
            type: "favor_balance_gte",
            npcId: "npc_anna_mahler",
            value: 1,
          },
          {
            type: "agency_standing_gte",
            value: 15,
          },
        ],
        effects: [
          { type: "set_flag", key: "student_house_accessed", value: true },
          {
            type: "change_agency_standing",
            delta: 3,
            reason: "student_house_entry_logged",
          },
          {
            type: "change_faction_signal",
            factionId: "underworld",
            delta: 4,
            reason: "student_house_entry",
          },
          {
            type: "track_event",
            eventName: "student_house_access_opened",
            tags: { pointId: "loc_student_house" },
          },
        ],
      },
      {
        id: "STUDENT_HOUSE_BACK_OUT",
        text: "Leave the introduction unused.",
        nextNodeId: "scene_student_house_access_end",
      },
    ],
  },
  {
    id: "scene_student_house_access_end",
    scenarioId: "sandbox_student_house_access",
    sourcePath:
      "40_GameViewer/Case01/Plot/03_Rumors/scene_workers_pub_rumor_end.md",
    titleOverride: "Back On The Street",
    bodyOverride:
      "You leave the student house route with its cost now written into the wider Freiburg file.",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_agency_promotion_review",
    scenarioId: "sandbox_agency_promotion_review",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Agency Promotion Review",
    bodyOverride:
      "The agency board finally reflects that the banker file, the rumor chain, and the source work all landed on one record.",
    choices: [
      {
        id: "AGENCY_PROMOTION_REVIEW_CONFIRM",
        text: "File the promotion review and return to operations.",
        nextNodeId: "scene_agency_promotion_review_end",
        requireAll: [
          { type: "career_rank_gte", rankId: "junior_detective" },
          {
            type: "flag_equals",
            key: "agency_promotion_review_complete",
            value: false,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "agency_promotion_review_complete",
            value: true,
          },
          {
            type: "change_agency_standing",
            delta: 2,
            reason: "promotion_review_filed",
          },
          {
            type: "track_event",
            eventName: "agency_promotion_review_complete",
            tags: { rankId: "junior_detective" },
          },
        ],
      },
    ],
  },
  {
    id: "scene_agency_promotion_review_end",
    scenarioId: "sandbox_agency_promotion_review",
    sourcePath: "40_GameViewer/Sandbox_KA/00_Entry/scene_map_intro.md",
    titleOverride: "Promotion Filed",
    bodyOverride:
      "The promotion file closes cleanly, and the next Freiburg route now sees the rank on your name.",
    terminal: true,
    choices: [],
  },
];

const case01Onboarding = parseCase01Onboarding(storyRoot);
for (const diagnostic of case01Onboarding.diagnostics) {
  if (diagnostic.severity === "warning") {
    console.warn(
      `Case01 parser warning: ${diagnostic.relativePath}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${diagnostic.message}`,
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
    id: "case_loop_demo",
    title: "Loop Demo Case",
  },
  {
    id: "case_banker_theft",
    title: "Banker Ledger Theft",
  },
  {
    id: "case_dog_trail",
    title: "The Dog's Trail",
  },
];

const mindFacts: MindFactContent[] = [
  {
    id: "fact_loop_clue",
    caseId: "case_loop_demo",
    sourceType: "vn_choice",
    sourceId: "sandbox_loop_demo::scene_loop_demo_intro::LOOP_DEMO_CLUE",
    text: "This is a demo fact proving the loop works.",
    tags: {
      theme: "demo",
      reliability: "high",
    },
  },
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
  {
    id: "fact_dog_market_route",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_market_beat2",
    text: "Trader confirms someone matching Dog crossed toward the station.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_dog_station_manifest",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_station_beat2",
    text: "Night train manifests show a passenger fitting Dog's description.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_tailor_invoice",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_tailor_beat2",
    text: "Tailor's secret log shows bespoke trench coats paid by an unknown handler.",
    tags: {
      theme: "finance",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_pub_identification",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_pub_beat2",
    text: "Barman described a handler meeting people looking exactly like Dog.",
    tags: {
      theme: "witness",
      reliability: "medium",
    },
  },
  {
    id: "fact_dog_uni_registry",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_dog_uni",
    text: "University registry lists a researcher missing around the time Dog appeared.",
    tags: {
      theme: "documents",
      reliability: "high",
    },
  },
  {
    id: "fact_dog_reunion_capstone",
    caseId: "case_dog_trail",
    sourceType: "vn_on_enter",
    sourceId: "sandbox_dog_pilot::scene_park_reunion",
    text: "Dog intercepted you in the park, demanding answers about their origin.",
    tags: {
      theme: "witness",
      reliability: "high",
    },
  },
];

const mindHypotheses: MindHypothesisContent[] = [
  {
    id: "hyp_loop_solved",
    caseId: "case_loop_demo",
    key: "loop_demo_solved",
    text: "The loop demo has been completed successfully.",
    requiredFactIds: ["fact_loop_clue"],
    requiredVars: [],
    rewardEffects: [
      { type: "set_var", key: "loop_demo_solved", value: 1 },
      {
        type: "track_event",
        eventName: "mind_case_loop_demo_solved",
        tags: { caseId: "case_loop_demo" },
      },
    ],
  },
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
  {
    id: "hyp_dog_route_reconstruction",
    caseId: "case_dog_trail",
    key: "dog_route_proven",
    text: "The Dog traveled from the university area via the market toward the train station.",
    requiredFactIds: [
      "fact_dog_market_route",
      "fact_dog_station_manifest",
      "fact_dog_uni_registry",
    ],
    requiredVars: [],
    rewardEffects: [
      { type: "set_flag", key: "dog_route_proven", value: true },
      { type: "track_event", eventName: "mind_dog_route_proven" },
    ],
  },
  {
    id: "hyp_dog_handler_exposed",
    caseId: "case_dog_trail",
    key: "dog_handler_proven",
    text: "A proxy handler operates out of the pub, outfitting assets at the tailor. Dog confronted me looking for them.",
    requiredFactIds: [
      "fact_dog_tailor_invoice",
      "fact_dog_pub_identification",
      "fact_dog_reunion_capstone",
    ],
    requiredVars: [
      {
        key: "dog_case_confidence",
        op: "gte",
        value: 0.8,
      },
    ],
    rewardEffects: [
      { type: "set_flag", key: "dog_handler_proven", value: true },
      { type: "track_event", eventName: "mind_dog_handler_proven" },
    ],
  },
];

const questCatalog: QuestCatalogEntry[] = [
  {
    id: "quest_banker",
    title: "Banker File",
    stages: [
      {
        stage: 1,
        title: "Initial Briefing",
        objectiveHint: "Meet Kessler at the bank and open the ledger trail.",
        objectivePointIds: ["loc_freiburg_bank"],
      },
      {
        stage: 2,
        title: "Cross-Check Leads",
        objectiveHint: "Revisit the bank after checking external testimonies.",
        objectivePointIds: ["loc_freiburg_bank", "loc_hbf"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Banker case archived.",
        objectivePointIds: ["loc_freiburg_warehouse"],
      },
    ],
  },
  {
    id: "quest_dog",
    title: "Dog Trail",
    stages: [
      {
        stage: 1,
        title: "Open Dog Lead Board",
        objectiveHint: "Collect initial route intel from Rathaus.",
        objectivePointIds: ["loc_rathaus"],
      },
      {
        stage: 2,
        title: "Converge Leads",
        objectiveHint: "Convene in the park after enough witness routes.",
        objectivePointIds: ["loc_rathaus", "loc_workers_pub"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Dog trail logged and sealed.",
        objectivePointIds: ["loc_workers_pub"],
      },
    ],
  },
  {
    id: "quest_ghost",
    title: "Ghost Dossier",
    stages: [
      {
        stage: 1,
        title: "Estate Survey",
        objectiveHint: "Open the ghost investigation from the workers' tavern.",
        objectivePointIds: ["loc_workers_pub"],
      },
      {
        stage: 2,
        title: "Assemble Proof",
        objectiveHint:
          "Correlate bookshelf and floor evidence before accusation.",
        objectivePointIds: ["loc_workers_pub", "loc_freiburg_bank"],
      },
      {
        stage: 3,
        title: "Case Closed",
        objectiveHint: "Ghost case finalized and written into records.",
        objectivePointIds: ["loc_freiburg_warehouse"],
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

const assertKnownVocabularyKey = (
  registry: Set<string>,
  value: string,
  fieldName: string,
): void => {
  if (registry.has(value)) {
    return;
  }

  const suggestion = suggestClosest(value, registry);
  if (suggestion) {
    throw new Error(
      `${fieldName} references unknown key: ${value}. Did you mean '${suggestion}'?`,
    );
  }
  throw new Error(`${fieldName} references unknown key: ${value}`);
};

const validateConditionOperator = (condition: VnCondition, context: string) => {
  if (!CONDITION_OPERATORS.has(condition.type)) {
    throw new Error(
      `condition.type in ${context} is unsupported: ${condition.type}`,
    );
  }
};

const validateEffectOperator = (effect: VnEffect, context: string) => {
  if (!EFFECT_OPERATORS.has(effect.type)) {
    throw new Error(`effect.type in ${context} is unsupported: ${effect.type}`);
  }
};

const validateConditionBlueprint = (
  condition: VnCondition,
  context: string,
): void => {
  validateConditionOperator(condition, context);
  if ("key" in condition) {
    assertAscii(condition.key, `${context}.key`);
    if (condition.type === "flag_equals") {
      assertKnownVocabularyKey(FLAG_KEYS, condition.key, `${context}.key`);
    }
    if (condition.type === "var_gte" || condition.type === "var_lte") {
      assertKnownVocabularyKey(VAR_KEYS, condition.key, `${context}.key`);
    }
  }
  if ("evidenceId" in condition) {
    assertAscii(condition.evidenceId, `${context}.evidenceId`);
    assertKnownId(CONTENT_IDS.evidenceIds, condition.evidenceId, context);
  }
  if ("questId" in condition) {
    assertAscii(condition.questId, `${context}.questId`);
    assertKnownId(CONTENT_IDS.questIds, condition.questId, context);
  }
  if ("characterId" in condition) {
    assertAscii(condition.characterId, `${context}.characterId`);
    assertKnownId(CONTENT_IDS.characterIds, condition.characterId, context);
  }
  if ("npcId" in condition) {
    assertAscii(condition.npcId, `${context}.npcId`);
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, condition.npcId, `${context}.npcId`);
  }
  if ("rumorId" in condition) {
    assertAscii(condition.rumorId, `${context}.rumorId`);
    assertKnownId(
      FREIBURG_SOCIAL_RUMOR_IDS,
      condition.rumorId,
      `${context}.rumorId`,
    );
  }
  if ("rankId" in condition) {
    assertAscii(condition.rankId, `${context}.rankId`);
    assertKnownId(
      FREIBURG_SOCIAL_CAREER_RANK_IDS,
      condition.rankId,
      `${context}.rankId`,
    );
  }
  if ("itemId" in condition) {
    assertAscii(condition.itemId, `${context}.itemId`);
  }
};

const validateEffectBlueprint = (effect: VnEffect, context: string): void => {
  validateEffectOperator(effect, context);
  if ("key" in effect) {
    assertAscii(effect.key, `effect.key in ${context}`);
    if (effect.type === "set_flag") {
      assertKnownVocabularyKey(
        FLAG_KEYS,
        effect.key,
        `effect.key in ${context}`,
      );
    }
    if (effect.type === "set_var" || effect.type === "add_var") {
      assertKnownVocabularyKey(
        VAR_KEYS,
        effect.key,
        `effect.key in ${context}`,
      );
    }
  }
  if ("locationId" in effect) {
    assertAscii(effect.locationId, `effect.locationId in ${context}`);
    assertKnownId(
      CONTENT_IDS.locationIds,
      effect.locationId,
      `effect.locationId in ${context}`,
    );
  }
  if ("templateId" in effect) {
    assertAscii(effect.templateId, `effect.templateId in ${context}`);
    assertKnownId(
      CONTENT_IDS.mapEventTemplateIds,
      effect.templateId,
      `effect.templateId in ${context}`,
    );
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
  if ("npcId" in effect) {
    assertAscii(effect.npcId, `effect.npcId in ${context}`);
    assertKnownId(
      FREIBURG_SOCIAL_NPC_IDS,
      effect.npcId,
      `effect.npcId in ${context}`,
    );
  }
  if ("rumorId" in effect) {
    assertAscii(effect.rumorId, `effect.rumorId in ${context}`);
    assertKnownId(
      FREIBURG_SOCIAL_RUMOR_IDS,
      effect.rumorId,
      `effect.rumorId in ${context}`,
    );
    if (effect.type === "verify_rumor") {
      if (!SOCIAL_VERIFICATION_KINDS.has(effect.verificationKind)) {
        throw new Error(
          `effect.verificationKind in ${context} is unsupported: ${effect.verificationKind}`,
        );
      }
      const rumorTemplate = RUMOR_TEMPLATE_BY_ID.get(effect.rumorId);
      if (
        rumorTemplate &&
        !rumorTemplate.verifiesOn.includes(effect.verificationKind)
      ) {
        throw new Error(
          `effect.verify_rumor in ${context} uses unsupported verification kind '${effect.verificationKind}' for rumor '${effect.rumorId}'`,
        );
      }
    }
  }
  if ("criterionId" in effect) {
    assertAscii(effect.criterionId, `effect.criterionId in ${context}`);
    assertKnownId(
      AGENCY_SERVICE_CRITERION_IDS,
      effect.criterionId,
      `effect.criterionId in ${context}`,
    );
  }
  if ("factionId" in effect) {
    assertAscii(effect.factionId, `effect.factionId in ${context}`);
  }
  if ("evidenceId" in effect) {
    assertAscii(effect.evidenceId, `effect.evidenceId in ${context}`);
    assertKnownId(
      CONTENT_IDS.evidenceIds,
      effect.evidenceId,
      `effect.evidenceId in ${context}`,
    );
  }
  if ("itemId" in effect) {
    assertAscii(effect.itemId, `effect.itemId in ${context}`);
  }
};

const validateSkillCheck = (check: VnSkillCheck, context: string): void => {
  assertAscii(check.id, `skillCheck.id in ${context}`);
  assertAscii(check.voiceId, `skillCheck.voiceId in ${context}`);
  assertKnownVocabularyKey(
    VOICE_IDS,
    check.voiceId,
    `skillCheck.voiceId in ${context}`,
  );

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
    validateConditionBlueprint(condition, `choice ${choice.id}`);
  }
  for (const condition of choice.visibleIfAll ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.visibleIfAll`);
  }
  for (const condition of choice.visibleIfAny ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.visibleIfAny`);
  }
  for (const condition of choice.requireAll ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.requireAll`);
  }
  for (const condition of choice.requireAny ?? []) {
    validateConditionBlueprint(condition, `choice ${choice.id}.requireAny`);
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

  const activeSkillCheckIds = new Set<string>();
  for (const choice of node.choices) {
    validateChoiceBlueprint(choice, node.id);
    if (choice.skillCheck) {
      if (activeSkillCheckIds.has(choice.skillCheck.id)) {
        throw new Error(
          `node(${node.id}) duplicates active skill check id '${choice.skillCheck.id}'`,
        );
      }
      activeSkillCheckIds.add(choice.skillCheck.id);
    }
  }
  for (const condition of node.preconditions ?? []) {
    validateConditionBlueprint(condition, `node(${node.id}).preconditions`);
  }
  for (const effect of node.onEnter ?? []) {
    validateEffectBlueprint(effect, `node.onEnter ${node.id}`);
  }
  const passiveCheckIds = new Set<string>();
  for (const check of node.passiveChecks ?? []) {
    if (passiveCheckIds.has(check.id)) {
      throw new Error(
        `node(${node.id}) duplicates passive check id '${check.id}'`,
      );
    }
    passiveCheckIds.add(check.id);
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

const validateQuestCatalogEntry = (quest: QuestCatalogEntry): void => {
  assertAscii(quest.id, "questCatalog.id");
  assertKnownId(CONTENT_IDS.questIds, quest.id, "questCatalog.id");

  const seenStages = new Set<number>();
  for (const stage of quest.stages) {
    if (!Number.isInteger(stage.stage) || stage.stage < 1) {
      throw new Error(
        `questCatalog(${quest.id}) has invalid stage ${stage.stage}`,
      );
    }
    if (seenStages.has(stage.stage)) {
      throw new Error(
        `questCatalog(${quest.id}) duplicates stage ${stage.stage}`,
      );
    }
    seenStages.add(stage.stage);

    if (stage.title.trim().length === 0) {
      throw new Error(
        `questCatalog(${quest.id}) stage ${stage.stage} has empty title`,
      );
    }
    if (stage.objectiveHint.trim().length === 0) {
      throw new Error(
        `questCatalog(${quest.id}) stage ${stage.stage} has empty objectiveHint`,
      );
    }

    for (const pointId of stage.objectivePointIds ?? []) {
      assertAscii(pointId, `questCatalog(${quest.id}).objectivePointId`);
    }
  }
};

const validateMapCondition = (
  condition: MapCondition,
  context: string,
): void => {
  if ("key" in condition) {
    assertAscii(condition.key, `${context}.key`);
    if (condition.type === "flag_is") {
      assertKnownVocabularyKey(FLAG_KEYS, condition.key, `${context}.key`);
    }
    if (condition.type === "var_gte" || condition.type === "var_lte") {
      assertKnownVocabularyKey(VAR_KEYS, condition.key, `${context}.key`);
    }
  }
  if ("evidenceId" in condition) {
    assertKnownId(CONTENT_IDS.evidenceIds, condition.evidenceId, context);
  }
  if ("questId" in condition) {
    assertKnownId(CONTENT_IDS.questIds, condition.questId, context);
  }
  if ("characterId" in condition) {
    assertKnownId(CONTENT_IDS.characterIds, condition.characterId, context);
  }
  if ("npcId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, condition.npcId, context);
  }
  if ("rumorId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_RUMOR_IDS, condition.rumorId, context);
  }
  if ("rankId" in condition) {
    assertKnownId(FREIBURG_SOCIAL_CAREER_RANK_IDS, condition.rankId, context);
  }
  if ("groupId" in condition) {
    assertKnownId(CONTENT_IDS.unlockGroups, condition.groupId, context);
  }
  if ("conditions" in condition) {
    for (const nested of condition.conditions) {
      validateMapCondition(nested, `${context}.nested`);
    }
  }
  if ("condition" in condition) {
    validateMapCondition(condition.condition, `${context}.nested`);
  }
};

const validateMapAction = (action: MapAction, context: string): void => {
  if ("locationId" in action) {
    assertAscii(action.locationId, `${context}.locationId`);
    assertKnownId(
      CONTENT_IDS.locationIds,
      action.locationId,
      `${context}.locationId`,
    );
  }
  if ("key" in action) {
    assertAscii(action.key, `${context}.key`);
    if (action.type === "set_flag") {
      assertKnownVocabularyKey(FLAG_KEYS, action.key, `${context}.key`);
    }
  }
  if ("scenarioId" in action) {
    assertAscii(action.scenarioId, `${context}.scenarioId`);
  }
  if ("templateId" in action) {
    assertAscii(action.templateId, `${context}.templateId`);
    assertKnownId(
      CONTENT_IDS.mapEventTemplateIds,
      action.templateId,
      `${context}.templateId`,
    );
  }
  if ("groupId" in action) {
    assertKnownId(CONTENT_IDS.unlockGroups, action.groupId, context);
  }
  if ("questId" in action) {
    assertKnownId(CONTENT_IDS.questIds, action.questId, context);
  }
  if ("evidenceId" in action) {
    assertKnownId(CONTENT_IDS.evidenceIds, action.evidenceId, context);
  }
  if ("characterId" in action) {
    assertKnownId(CONTENT_IDS.characterIds, action.characterId, context);
  }
  if ("npcId" in action) {
    assertKnownId(FREIBURG_SOCIAL_NPC_IDS, action.npcId, context);
  }
  if ("rumorId" in action) {
    assertKnownId(FREIBURG_SOCIAL_RUMOR_IDS, action.rumorId, context);
    if (action.type === "verify_rumor") {
      const rumorTemplate = RUMOR_TEMPLATE_BY_ID.get(action.rumorId);
      if (
        rumorTemplate &&
        !rumorTemplate.verifiesOn.includes(action.verificationKind)
      ) {
        throw new Error(
          `${context} uses unsupported verification kind '${action.verificationKind}' for rumor '${action.rumorId}'`,
        );
      }
    }
  }
  if ("criterionId" in action) {
    if (typeof action.criterionId !== "string") {
      throw new Error(`${context}.criterionId must be a string`);
    }
    assertKnownId(AGENCY_SERVICE_CRITERION_IDS, action.criterionId, context);
  }
  if ("rankId" in action) {
    if (typeof action.rankId !== "string") {
      throw new Error(`${context}.rankId must be a string`);
    }
    assertKnownId(FREIBURG_SOCIAL_CAREER_RANK_IDS, action.rankId, context);
  }
  if ("factionId" in action) {
    assertAscii(action.factionId, `${context}.factionId`);
  }
  if ("eventName" in action) {
    assertAscii(action.eventName, `${context}.eventName`);
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

const collectReachableNodeIds = (
  startNodeId: string,
  nodeById: ReadonlyMap<string, NodeBlueprint>,
): Set<string> => {
  const visited = new Set<string>();
  const queue: string[] = [startNodeId];

  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    if (!currentNodeId || visited.has(currentNodeId)) {
      continue;
    }
    visited.add(currentNodeId);

    const node = nodeById.get(currentNodeId);
    if (!node) {
      continue;
    }

    for (const choice of node.choices) {
      queue.push(choice.nextNodeId);
      if (choice.skillCheck?.onSuccess?.nextNodeId) {
        queue.push(choice.skillCheck.onSuccess.nextNodeId);
      }
      if (choice.skillCheck?.onFail?.nextNodeId) {
        queue.push(choice.skillCheck.onFail.nextNodeId);
      }
    }

    for (const check of node.passiveChecks ?? []) {
      if (check.onSuccess?.nextNodeId) {
        queue.push(check.onSuccess.nextNodeId);
      }
      if (check.onFail?.nextNodeId) {
        queue.push(check.onFail.nextNodeId);
      }
    }
  }

  return visited;
};

const collectContentContractWarnings = (
  scenarioBlueprints: ScenarioBlueprint[],
  nodeBlueprints: NodeBlueprint[],
): string[] => {
  const warnings: string[] = [];
  const nodeById = new Map(nodeBlueprints.map((node) => [node.id, node]));
  const nodesByScenario = new Map<string, NodeBlueprint[]>();
  for (const scenario of scenarioBlueprints) {
    nodesByScenario.set(
      scenario.id,
      nodeBlueprints.filter((node) => node.scenarioId === scenario.id),
    );
  }

  const minNodeRules = new Map<string, number>([
    ["sandbox_banker_pilot", 5],
    ["sandbox_dog_pilot", 12],
    ["sandbox_ghost_pilot", 8],
  ]);

  for (const [scenarioId, minNodes] of minNodeRules) {
    const nodesForScenario = nodesByScenario.get(scenarioId) ?? [];
    if (nodesForScenario.length < minNodes) {
      warnings.push(
        `Scenario ${scenarioId} has ${nodesForScenario.length} nodes (required >= ${minNodes})`,
      );
    }
  }

  for (const scenario of scenarioBlueprints) {
    const nodesForScenario = nodesByScenario.get(scenario.id) ?? [];
    const reachableIds = collectReachableNodeIds(
      scenario.startNodeId,
      nodeById,
    );
    const unreachable = nodesForScenario.filter(
      (node) => !reachableIds.has(node.id),
    );
    if (unreachable.length > 0) {
      warnings.push(
        `Scenario ${scenario.id} contains unreachable nodes: ${unreachable
          .map((node) => node.id)
          .join(", ")}`,
      );
    }

    const terminalCount = nodesForScenario.filter(
      (node) => node.terminal,
    ).length;
    if (terminalCount === 0) {
      warnings.push(`Scenario ${scenario.id} has no terminal nodes`);
    }
  }

  return warnings;
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
  if (
    choice.conditions ||
    choice.visibleIfAll ||
    choice.visibleIfAny ||
    choice.requireAll ||
    choice.requireAny ||
    choice.effects ||
    choice.skillCheck
  ) {
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
const contentContractWarnings = collectContentContractWarnings(
  scenariosWithCase01,
  nodesWithCase01,
);

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

for (const quest of questCatalog) {
  validateQuestCatalogEntry(quest);
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
  if (node.voicePresenceMode) {
    vnNode.voicePresenceMode = node.voicePresenceMode;
  }
  if (node.activeSpeakers) {
    vnNode.activeSpeakers = [...node.activeSpeakers];
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

const availableScenarioIds = new Set(
  builtScenarios.map((scenario) => scenario.id),
);
const mapSnapshot = buildCase01MapSnapshot(availableScenarioIds);

const seenPointIds = new Set<string>();
const seenBindingIds = new Set<string>();
const knownRegionIds = new Set(mapSnapshot.regions.map((region) => region.id));
let conditionDrivenBindingCount = 0;
let pointsWithRichBindings = 0;
for (const point of mapSnapshot.points) {
  if (seenPointIds.has(point.id)) {
    throw new Error(`Map point id is duplicated: ${point.id}`);
  }
  seenPointIds.add(point.id);
  if (!knownRegionIds.has(point.regionId)) {
    throw new Error(
      `Map point ${point.id} references unknown regionId ${point.regionId}`,
    );
  }
  assertKnownId(
    CONTENT_IDS.locationIds,
    point.locationId,
    `map point ${point.id}`,
  );
  if (point.bindings.length === 0) {
    throw new Error(`Map point ${point.id} has no bindings`);
  }

  if (point.bindings.length > 2) {
    pointsWithRichBindings += 1;
  }

  for (const binding of point.bindings) {
    if (seenBindingIds.has(binding.id)) {
      throw new Error(`Map binding id is duplicated: ${binding.id}`);
    }
    seenBindingIds.add(binding.id);
    if ((binding.conditions ?? []).length > 0) {
      conditionDrivenBindingCount += 1;
    }

    for (const condition of binding.conditions ?? []) {
      validateMapCondition(condition, `map binding ${binding.id}`);
    }

    for (const action of binding.actions) {
      validateMapAction(action, `map binding ${binding.id}`);
      if (
        action.type === "start_scenario" &&
        !availableScenarioIds.has(action.scenarioId)
      ) {
        throw new Error(
          `Map binding ${binding.id} references unknown scenarioId ${action.scenarioId}`,
        );
      }
    }
  }
}

const seenShadowRouteIds = new Set<string>();
for (const route of mapSnapshot.shadowRoutes ?? []) {
  if (seenShadowRouteIds.has(route.id)) {
    throw new Error(`Map shadow route id is duplicated: ${route.id}`);
  }
  seenShadowRouteIds.add(route.id);

  if (!knownRegionIds.has(route.regionId)) {
    throw new Error(
      `Map shadow route ${route.id} references unknown regionId ${route.regionId}`,
    );
  }
  if (route.pointIds.length < 2) {
    throw new Error(
      `Map shadow route ${route.id} must contain at least two pointIds`,
    );
  }
  for (const pointId of route.pointIds) {
    if (!seenPointIds.has(pointId)) {
      throw new Error(
        `Map shadow route ${route.id} references unknown pointId ${pointId}`,
      );
    }
  }
  for (const flagKey of route.revealFlagsAll ?? []) {
    assertKnownVocabularyKey(
      FLAG_KEYS,
      flagKey,
      `map shadow route ${route.id}.revealFlagsAll`,
    );
  }
}

const seenQrCodeIds = new Set<string>();
for (const entry of mapSnapshot.qrCodeRegistry ?? []) {
  assertKnownId(
    CONTENT_IDS.mapQrCodeIds,
    entry.codeId,
    `map qr code ${entry.codeId}`,
  );
  if (seenQrCodeIds.has(entry.codeId)) {
    throw new Error(`Map qr code id is duplicated: ${entry.codeId}`);
  }
  seenQrCodeIds.add(entry.codeId);

  for (const flagKey of entry.requiresFlagsAll ?? []) {
    assertKnownVocabularyKey(
      FLAG_KEYS,
      flagKey,
      `map qr code ${entry.codeId}.requiresFlagsAll`,
    );
  }
  for (const effect of entry.effects) {
    validateEffectBlueprint(effect, `map qr code ${entry.codeId}`);
  }
}

const seenMapEventTemplateIds = new Set<string>();
const seenMapEventPointIds = new Set<string>();
for (const template of mapSnapshot.mapEventTemplates ?? []) {
  assertKnownId(
    CONTENT_IDS.mapEventTemplateIds,
    template.id,
    `map event template ${template.id}`,
  );
  if (seenMapEventTemplateIds.has(template.id)) {
    throw new Error(`Map event template id is duplicated: ${template.id}`);
  }
  if (
    seenMapEventPointIds.has(template.point.id) ||
    seenPointIds.has(template.point.id)
  ) {
    throw new Error(
      `Map event template ${template.id} reuses an existing point id: ${template.point.id}`,
    );
  }
  seenMapEventTemplateIds.add(template.id);
  seenMapEventPointIds.add(template.point.id);

  if (template.point.category !== "EPHEMERAL") {
    throw new Error(
      `Map event template ${template.id} must use EPHEMERAL point category`,
    );
  }
  if (!knownRegionIds.has(template.point.regionId)) {
    throw new Error(
      `Map event template ${template.id} references unknown regionId ${template.point.regionId}`,
    );
  }
  assertKnownId(
    CONTENT_IDS.locationIds,
    template.point.locationId,
    `map event template ${template.id}.locationId`,
  );

  for (const binding of template.point.bindings) {
    if (seenBindingIds.has(binding.id)) {
      throw new Error(`Map binding id is duplicated: ${binding.id}`);
    }
    seenBindingIds.add(binding.id);
    for (const condition of binding.conditions ?? []) {
      validateMapCondition(
        condition,
        `map event template ${template.id} binding ${binding.id}`,
      );
    }
    for (const action of binding.actions) {
      validateMapAction(
        action,
        `map event template ${template.id} binding ${binding.id}`,
      );
      if (
        action.type === "start_scenario" &&
        !availableScenarioIds.has(action.scenarioId)
      ) {
        throw new Error(
          `Map event template ${template.id} binding ${binding.id} references unknown scenarioId ${action.scenarioId}`,
        );
      }
    }
  }
}

for (const quest of questCatalog) {
  for (const stage of quest.stages) {
    for (const pointId of stage.objectivePointIds ?? []) {
      if (!seenPointIds.has(pointId)) {
        throw new Error(
          `questCatalog(${quest.id}) stage ${stage.stage} references unknown pointId ${pointId}`,
        );
      }
    }
  }
}

if (conditionDrivenBindingCount < 12) {
  contentContractWarnings.push(
    `Map contract warning: expected >=12 condition-driven bindings, got ${conditionDrivenBindingCount}`,
  );
}
if (pointsWithRichBindings < 5) {
  contentContractWarnings.push(
    `Map contract warning: expected >=5 points with >2 bindings, got ${pointsWithRichBindings}`,
  );
}

const snapshotPayload: VnSnapshot = {
  schemaVersion: CURRENT_VN_SNAPSHOT_SCHEMA_VERSION,
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
  map: mapSnapshot,
  questCatalog,
  socialCatalog: FREIBURG_SOCIAL_CATALOG,
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
console.log(
  `Map -> Points: ${mapSnapshot.points.length}, Bindings: ${mapSnapshot.points.reduce((total, point) => total + point.bindings.length, 0)}, Condition-driven: ${conditionDrivenBindingCount}`,
);

if (contentContractWarnings.length > 0) {
  console.warn("Content contract warnings:");
  for (const warning of contentContractWarnings) {
    console.warn(`  - ${warning}`);
  }
}
