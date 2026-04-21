import type {
  MapAction,
  MapCondition,
  MapPointCategory,
  MapSnapshot,
} from "../../src/features/vn/types";
import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
} from "../../src/shared/case01Canon";

export interface Case01PointSource {
  id: string;
  regionId: string;
  title: string;
  lat: number;
  lng: number;
  description?: string;
  image?: string;
  locationId: string;
  category: Exclude<MapPointCategory, "EPHEMERAL">;
  unlockGroup?: string;
  defaultState?: "locked" | "discovered";
  legacyScenarioIds?: string[];
  isHiddenInitially?: boolean;
}

type LegacyFlagCondition = {
  type: "flag_is";
  value: boolean;
  key?: string;
  flagId?: string;
};

type LegacyMapCondition =
  | LegacyFlagCondition
  | { type: "var_gte"; key: string; value: number }
  | { type: "var_lte"; key: string; value: number }
  | { type: "has_item"; itemId: string }
  | { type: "has_evidence"; evidenceId: string }
  | { type: "quest_stage_gte"; questId: string; stage: number }
  | { type: "relationship_gte"; characterId: string; value: number }
  | { type: "favor_balance_gte"; npcId: string; value: number }
  | { type: "agency_standing_gte"; value: number }
  | {
      type: "rumor_state_is";
      rumorId: string;
      status: "registered" | "verified";
    }
  | { type: "career_rank_gte"; rankId: string }
  | { type: "unlock_group_has"; groupId: string }
  | {
      type: "point_state_is";
      state: "locked" | "discovered" | "visited" | "completed";
    }
  | { type: "logic_and"; conditions: LegacyMapCondition[] }
  | { type: "logic_or"; conditions: LegacyMapCondition[] }
  | { type: "logic_not"; condition: LegacyMapCondition };

interface BindingBlueprint {
  id: string;
  trigger: "card_primary" | "card_secondary" | "map_pin" | "auto";
  label: string;
  priority: number;
  intent: "objective" | "interaction" | "travel";
  conditions?: LegacyMapCondition[];
  actions: MapAction[];
}

const normalizeCondition = (condition: LegacyMapCondition): MapCondition => {
  if (condition.type === "flag_is") {
    const key = condition.key ?? condition.flagId;
    if (!key) {
      throw new Error("map condition flag_is requires key or flagId");
    }
    return {
      type: "flag_is",
      key,
      value: condition.value,
    };
  }

  if (condition.type === "logic_and" || condition.type === "logic_or") {
    return {
      type: condition.type,
      conditions: condition.conditions.map((entry) =>
        normalizeCondition(entry),
      ),
    };
  }

  if (condition.type === "logic_not") {
    return {
      type: "logic_not",
      condition: normalizeCondition(condition.condition),
    };
  }

  return condition;
};

const normalizeConditions = (
  conditions: LegacyMapCondition[] | undefined,
): MapCondition[] | undefined => {
  if (!conditions || conditions.length === 0) {
    return undefined;
  }
  return conditions.map((entry) => normalizeCondition(entry));
};

export const CASE_01_REGIONS: MapSnapshot["regions"] = [
  {
    id: "FREIBURG_1905",
    name: "Freiburg im Breisgau (1905)",
    geoCenterLat: 47.9959,
    geoCenterLng: 7.8522,
    zoom: 14.2,
  },
];

export const CASE_01_DEFAULT_REGION_ID = "FREIBURG_1905";

const LEGACY_SCENARIO_TO_CURRENT: Record<string, string> = {
  detective_case1_hbf_arrival: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  detective_case1_bank_scene: CASE01_SCENARIO_IDS.bankInvestigation,
  detective_case1_alt_briefing: CASE01_SCENARIO_IDS.mayorBriefing,
  detective_case1_mayor_followup: CASE01_SCENARIO_IDS.convergence,
  detective_case1_archive_search: CASE01_SCENARIO_IDS.archiveRun,
  detective_case1_lab_analysis: CASE01_SCENARIO_IDS.estateBranch,
  detective_case1_qr_scan_bank: CASE01_SCENARIO_IDS.bankInvestigation,
  case1_finale: CASE01_SCENARIO_IDS.warehouseFinale,
  lead_tailor: CASE01_SCENARIO_IDS.leadTailor,
  lead_apothecary: CASE01_SCENARIO_IDS.leadApothecary,
  lead_pub: CASE01_SCENARIO_IDS.leadPub,
  interlude_victoria_street: CASE01_SCENARIO_IDS.convergence,
  interlude_lotte_warning: CASE01_SCENARIO_IDS.lotteInterlude,
  quest_lotte_wires: CASE01_SCENARIO_IDS.lotteInterlude,
  quest_victoria_poetry: "sandbox_case01_pilot",
  encounter_tourist: "sandbox_intro_pilot",
  encounter_cleaner: "sandbox_intro_pilot",
  encounter_student: "sandbox_intro_pilot",
};

const resolveScenarioId = (
  legacyScenarioIds: readonly string[] | undefined,
  availableScenarioIds: ReadonlySet<string>,
): string | undefined => {
  if (!legacyScenarioIds || legacyScenarioIds.length === 0) {
    return undefined;
  }

  for (const legacyId of legacyScenarioIds) {
    const mapped = LEGACY_SCENARIO_TO_CURRENT[legacyId];
    if (!mapped) {
      continue;
    }
    if (!availableScenarioIds.has(mapped)) {
      continue;
    }
    return mapped;
  }

  return undefined;
};

const AGENCY_BRIEFING_SCENARIO_ID = "sandbox_agency_briefing";
const AGENCY_SERVICE_UNLOCK_SCENARIO_ID = "sandbox_agency_service_unlock";
const STUDENT_HOUSE_SCENARIO_ID = "sandbox_student_house_access";
const AGENCY_PROMOTION_SCENARIO_ID = "sandbox_agency_promotion_review";
const WORKERS_PUB_EVENT_TEMPLATE_ID = "evt_workers_pub_raid";
const ANNA_ACCESS_CONDITION: LegacyMapCondition = {
  type: "logic_or",
  conditions: [
    { type: "favor_balance_gte", npcId: "npc_anna_mahler", value: 1 },
    { type: "agency_standing_gte", value: 15 },
  ],
};

const CASE01_MAINLINE_UNLOCKED_CONDITION: LegacyMapCondition = {
  type: "flag_is",
  key: "case01_onboarding_complete",
  value: true,
};

const CASE01_ANY_TWO_LEADS_CONDITION: LegacyMapCondition = {
  type: "logic_or",
  conditions: [
    {
      type: "logic_and",
      conditions: [
        { type: "flag_is", key: "tailor_lead_complete", value: true },
        { type: "flag_is", key: "apothecary_lead_complete", value: true },
      ],
    },
    {
      type: "logic_and",
      conditions: [
        { type: "flag_is", key: "tailor_lead_complete", value: true },
        { type: "flag_is", key: "pub_lead_complete", value: true },
      ],
    },
    {
      type: "logic_and",
      conditions: [
        { type: "flag_is", key: "apothecary_lead_complete", value: true },
        { type: "flag_is", key: "pub_lead_complete", value: true },
      ],
    },
  ],
};

const CASE01_NO_ROUTE_SELECTED_CONDITION: LegacyMapCondition = {
  type: "var_lte",
  key: "convergence_route",
  value: 0,
};

const CASE01_OFFICIAL_ROUTE_CONDITION: LegacyMapCondition = {
  type: "logic_and",
  conditions: [
    {
      type: "var_gte",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_OFFICIAL,
    },
    {
      type: "var_lte",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_OFFICIAL,
    },
  ],
};

const CASE01_COVERT_ROUTE_CONDITION: LegacyMapCondition = {
  type: "logic_and",
  conditions: [
    {
      type: "var_gte",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_COVERT,
    },
    {
      type: "var_lte",
      key: "convergence_route",
      value: CASE01_ROUTE_VALUE_COVERT,
    },
  ],
};

const RICH_BINDINGS_BY_POINT: Record<string, BindingBlueprint[]> = {
  loc_agency: [
    {
      id: "bind_agency_briefing_start",
      trigger: "card_primary",
      label: "Receive First Briefing",
      priority: 160,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "agency_briefing_complete", value: false },
        { type: "flag_is", key: "case01_onboarding_complete", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: AGENCY_BRIEFING_SCENARIO_ID },
      ],
    },
    {
      id: "bind_agency_caseboard",
      trigger: "card_primary",
      label: "Review Fritz's Brief",
      priority: 80,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "case01_onboarding_complete", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
        },
      ],
    },
    {
      id: "bind_agency_student_intro_service",
      trigger: "card_secondary",
      label: "Call In Anna's Introduction",
      priority: 70,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "agency_briefing_complete", value: true },
        {
          type: "rumor_state_is",
          rumorId: "rumor_bank_rail_yard",
          status: "verified",
        },
        {
          type: "flag_is",
          key: "service_anna_student_intro_unlocked",
          value: false,
        },
        ANNA_ACCESS_CONDITION,
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: AGENCY_SERVICE_UNLOCK_SCENARIO_ID,
        },
      ],
    },
    {
      id: "bind_agency_promotion_review",
      trigger: "card_secondary",
      label: "Review Promotion File",
      priority: 60,
      intent: "interaction",
      conditions: [
        { type: "career_rank_gte", rankId: "junior_detective" },
        {
          type: "flag_is",
          key: "agency_promotion_review_complete",
          value: false,
        },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: AGENCY_PROMOTION_SCENARIO_ID,
        },
      ],
    },
  ],
  loc_hbf: [
    {
      id: "bind_hbf_demo_reward",
      trigger: "card_primary",
      label: "Claim Demo Reward",
      priority: 150,
      intent: "interaction",
      conditions: [{ type: "var_gte", key: "loop_demo_solved", value: 1 }],
      actions: [
        { type: "track_event", eventName: "loop_demo_completed" },
        { type: "grant_xp", amount: 100 },
      ],
    },
    {
      id: "bind_hbf_intro_start",
      trigger: "card_primary",
      label: "Begin Case 01",
      priority: 130,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "case01_onboarding_complete", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
        },
        {
          type: "track_event",
          eventName: "case01_hbf_runtime_entry",
          tags: { location: "hbf" },
        },
      ],
    },
    {
      id: "bind_hbf_case_bridge",
      trigger: "card_primary",
      label: "Review Arrival Notes",
      priority: 95,
      intent: "interaction",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        { type: "flag_is", key: "bank_investigation_complete", value: false },
      ],
      actions: [
        {
          type: "track_event",
          eventName: "case01_hbf_revisited",
          tags: { pointId: "loc_hbf" },
        },
      ],
    },
    {
      id: "bind_hbf_verify_rail_yard_rumor",
      trigger: "card_primary",
      label: "Verify Rail Yard Whisper",
      priority: 118,
      intent: "interaction",
      conditions: [
        {
          type: "rumor_state_is",
          rumorId: "rumor_bank_rail_yard",
          status: "registered",
        },
      ],
      actions: [
        {
          type: "verify_rumor",
          rumorId: "rumor_bank_rail_yard",
          verificationKind: "service_unlock",
        },
        {
          type: "change_agency_standing",
          delta: 10,
          reason: "validated_bank_rail_yard_whisper",
        },
        {
          type: "track_event",
          eventName: "bank_rail_yard_rumor_verified",
          tags: { pointId: "loc_hbf" },
        },
      ],
    },
  ],
  loc_freiburg_bank: [
    {
      id: "bind_bank_start",
      trigger: "card_primary",
      label: "Investigate the Bank",
      priority: 130,
      intent: "objective",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        {
          type: "logic_or",
          conditions: [
            { type: "flag_is", key: "priority_bank_first", value: true },
            { type: "flag_is", key: "mayor_briefing_complete", value: true },
          ],
        },
        {
          type: "flag_is",
          key: "bank_investigation_complete",
          value: false,
        },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
        },
      ],
    },
  ],
  loc_rathaus: [
    {
      id: "bind_rathaus_mayor_start",
      trigger: "card_primary",
      label: "Meet the Mayor",
      priority: 125,
      intent: "objective",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        { type: "flag_is", key: "priority_mayor_first", value: true },
        { type: "flag_is", key: "mayor_briefing_complete", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
        },
      ],
    },
    {
      id: "bind_rathaus_convergence",
      trigger: "card_primary",
      label: "Commit the Route",
      priority: 110,
      intent: "interaction",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        { type: "flag_is", key: "bank_investigation_complete", value: true },
        CASE01_ANY_TWO_LEADS_CONDITION,
        CASE01_NO_ROUTE_SELECTED_CONDITION,
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.convergence,
        },
      ],
    },
    {
      id: "bind_rathaus_archive_run",
      trigger: "card_primary",
      label: "Run the Warrants",
      priority: 80,
      intent: "interaction",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        CASE01_OFFICIAL_ROUTE_CONDITION,
        { type: "flag_is", key: "warrant_ready", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.archiveRun,
        },
      ],
    },
  ],
  loc_workers_pub: [
    {
      id: "bind_pub_covert_route",
      trigger: "card_primary",
      label: "Work the Backchannel",
      priority: 150,
      intent: "objective",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        CASE01_COVERT_ROUTE_CONDITION,
        { type: "flag_is", key: "covert_entry_ready", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.railYardTail,
        },
      ],
    },
    {
      id: "bind_pub_rumor_raid",
      trigger: "card_secondary",
      label: "Follow Fresh Rumor",
      priority: 135,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "agency_briefing_complete", value: true },
        {
          type: "logic_not",
          condition: {
            type: "rumor_state_is",
            rumorId: "rumor_bank_rail_yard",
            status: "verified",
          },
        },
      ],
      actions: [
        {
          type: "spawn_map_event",
          templateId: WORKERS_PUB_EVENT_TEMPLATE_ID,
        },
        {
          type: "track_event",
          eventName: "workers_pub_rumor_spawned",
          tags: { templateId: WORKERS_PUB_EVENT_TEMPLATE_ID },
        },
      ],
    },
    {
      id: "bind_pub_dog_close",
      trigger: "card_primary",
      label: "Confront Handler",
      priority: 90,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "dog_reunion_reached", value: true },
        { type: "flag_is", key: "dog_route_proven", value: true },
        { type: "flag_is", key: "dog_handler_proven", value: true },
        { type: "flag_is", key: "dog_case_closed", value: false },
      ],
      actions: [
        { type: "set_quest_stage", questId: "quest_dog", stage: 3 },
        { type: "set_flag", key: "dog_case_closed", value: true },
        { type: "grant_xp", amount: 40 },
      ],
    },
    {
      id: "bind_pub_ghost_start",
      trigger: "card_primary",
      label: "Start Ghost File",
      priority: 120,
      intent: "objective",
      conditions: [
        { type: "quest_stage_gte", questId: "quest_dog", stage: 2 },
        { type: "flag_is", key: "ghost_case_closed", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_ghost_pilot" },
        { type: "set_quest_stage", questId: "quest_ghost", stage: 1 },
      ],
    },
    {
      id: "bind_pub_ghost_followup",
      trigger: "card_primary",
      label: "Follow Ghost Leads",
      priority: 105,
      intent: "interaction",
      conditions: [
        { type: "quest_stage_gte", questId: "quest_ghost", stage: 2 },
        { type: "flag_is", key: "ghost_case_closed", value: false },
      ],
      actions: [{ type: "start_scenario", scenarioId: "sandbox_ghost_pilot" }],
    },
    {
      id: "bind_pub_ghost_close",
      trigger: "card_primary",
      label: "Close Ghost Case",
      priority: 85,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "ghost_truth_proven", value: true },
        { type: "flag_is", key: "ghost_case_closed", value: false },
      ],
      actions: [
        { type: "set_quest_stage", questId: "quest_ghost", stage: 3 },
        { type: "set_flag", key: "ghost_case_closed", value: true },
        { type: "grant_evidence", evidenceId: "ev_ectoplasm" },
      ],
    },
  ],
  loc_freiburg_warehouse: [
    {
      id: "bind_warehouse_finale",
      trigger: "card_primary",
      label: "Enter Finale",
      priority: 140,
      intent: "objective",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        { type: "flag_is", key: "warehouse_plan_locked", value: true },
        { type: "flag_is", key: "case_resolved", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
        },
        { type: "set_flag", key: "freiburg_finale_open", value: true },
      ],
    },
    {
      id: "bind_warehouse_locked_hint",
      trigger: "card_primary",
      label: "Inspect Locked Gate",
      priority: 20,
      intent: "interaction",
      conditions: [
        {
          type: "logic_not",
          condition: {
            type: "flag_is",
            key: "warehouse_plan_locked",
            value: true,
          },
        },
      ],
      actions: [
        {
          type: "track_event",
          eventName: "warehouse_finale_locked",
          tags: { pointId: "loc_freiburg_warehouse" },
        },
      ],
    },
  ],
  loc_student_house: [
    {
      id: "bind_student_house_access",
      trigger: "card_primary",
      label: "Use Anna's Introduction",
      priority: 110,
      intent: "interaction",
      conditions: [
        {
          type: "flag_is",
          key: "service_anna_student_intro_unlocked",
          value: true,
        },
        ANNA_ACCESS_CONDITION,
      ],
      actions: [
        { type: "start_scenario", scenarioId: STUDENT_HOUSE_SCENARIO_ID },
      ],
    },
    {
      id: "bind_city_student_tip",
      trigger: "card_secondary",
      label: "Talk to Student",
      priority: 70,
      intent: "interaction",
      conditions: [
        {
          type: "flag_is",
          key: "service_anna_student_intro_unlocked",
          value: true,
        },
        { type: "flag_is", key: "city_student_seen", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_city_student_tip" },
      ],
    },
  ],
  loc_red_light: [
    {
      id: "bind_city_cleaner_tip",
      trigger: "card_primary",
      label: "Talk to Cleaner",
      priority: 80,
      intent: "interaction",
      conditions: [{ type: "flag_is", key: "city_cleaner_seen", value: false }],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_city_cleaner_tip" },
      ],
    },
  ],
  loc_martinstor: [
    {
      id: "bind_city_bootblack_tip",
      trigger: "card_primary",
      label: "Talk to Bootblack",
      priority: 80,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "city_bootblack_seen", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_city_bootblack_tip" },
      ],
    },
  ],
  loc_freiburg_estate: [
    {
      id: "bind_estate_trace",
      trigger: "card_primary",
      label: "Trace the Estate Ledger",
      priority: 110,
      intent: "interaction",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        { type: "flag_is", key: "bank_investigation_complete", value: true },
        { type: "flag_is", key: "estate_branch_complete", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.estateBranch,
        },
      ],
    },
  ],
  loc_telephone: [
    {
      id: "bind_telephone_lotte_interlude",
      trigger: "card_primary",
      label: "Answer Lotte's Warning",
      priority: 105,
      intent: "interaction",
      conditions: [
        CASE01_MAINLINE_UNLOCKED_CONDITION,
        CASE01_ANY_TWO_LEADS_CONDITION,
        { type: "flag_is", key: "lotte_interlude_complete", value: false },
      ],
      actions: [
        {
          type: "start_scenario",
          scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
        },
      ],
    },
  ],
};

export const CASE_01_POINTS: Case01PointSource[] = [
  {
    id: "loc_agency",
    regionId: "FREIBURG_1905",
    title: "Grenzwanderer Agency",
    description:
      "Your hidden office and operations hub. Briefings, evidence walls, and trusted informants start here.",
    lat: 47.9952,
    lng: 7.8508,
    image: "/images/locations/loc_agency/loc_agency.webp",
    locationId: "loc_agency",
    category: "HUB",
    defaultState: "discovered",
  },
  {
    id: "loc_hbf",
    regionId: "FREIBURG_1905",
    title: "Hauptbahnhof",
    description:
      "Steam-era gateway to Freiburg. Arrivals from Basel and Strasbourg.",
    lat: 47.997791,
    lng: 7.842609,
    image: "/images/locations/loc_hbf/loc_hauptbahnhof.webp",
    locationId: "loc_hbf",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["detective_case1_hbf_arrival"],
  },
  {
    id: "loc_freiburg_bank",
    regionId: "FREIBURG_1905",
    title: "Bankhaus J.A. Krebs",
    description:
      "Prestigious bank at Munsterplatz, currently under renovation.",
    lat: 47.995574,
    lng: 7.852296,
    image: "/images/locations/loc_freiburg_bank/loc_bankhaus.webp",
    locationId: "loc_freiburg_bank",
    category: "PUBLIC",
    unlockGroup: "loc_freiburg_bank",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: [
      "detective_case1_qr_scan_bank",
      "detective_case1_bank_scene",
    ],
  },
  {
    id: "loc_rathaus",
    regionId: "FREIBURG_1905",
    title: "Rathaus",
    description: "City Hall and records authority for central Freiburg.",
    lat: 47.99629692434917,
    lng: 7.8492596695028,
    image: "/images/locations/loc_rathaus/loc_rathaus_archiv.webp",
    locationId: "loc_rathaus",
    category: "PUBLIC",
    unlockGroup: "loc_rathaus",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: [
      "detective_case1_alt_briefing",
      "detective_case1_mayor_followup",
      "detective_case1_archive_search",
    ],
  },
  {
    id: "loc_munster",
    regionId: "FREIBURG_1905",
    title: "Freiburg Munster",
    description: "Gothic cathedral dominating the city center.",
    lat: 47.9955,
    lng: 7.8529,
    image: "/images/locations/loc_munster/loc_munster.webp",
    locationId: "loc_munster",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_uni_chem",
    regionId: "FREIBURG_1905",
    title: "Kiliani Laboratory",
    description: "University chemistry lab for forensic analysis.",
    lat: 47.994,
    lng: 7.846,
    image: "/images/locations/loc_uni/loc_uni.webp",
    locationId: "loc_uni_chem",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["detective_case1_lab_analysis"],
  },
  {
    id: "loc_uni_med",
    regionId: "FREIBURG_1905",
    title: "Institute of Hygiene",
    description: "Medical institute focused on serology and lab diagnostics.",
    lat: 47.9935,
    lng: 7.847,
    image: "/images/locations/loc_uni/loc_uni.webp",
    locationId: "loc_uni_med",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["detective_case1_lab_analysis"],
  },
  {
    id: "loc_student_house",
    regionId: "FREIBURG_1905",
    title: "Corps Suevia House",
    description: "Fraternity house in the university quarter.",
    lat: 47.99,
    lng: 7.848,
    image: "/images/locations/loc_student_house/loc_student_house.webp",
    locationId: "loc_student_house",
    category: "SHADOW",
    unlockGroup: "loc_student_house",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_student"],
  },
  {
    id: "loc_pub_deutsche",
    regionId: "FREIBURG_1905",
    title: "Zum Deutschen Haus",
    description: "Busy inn popular with locals and travelers.",
    lat: 47.992,
    lng: 7.854,
    image: "/images/locations/loc_pub_deutsche/loc_ganter_brauerei.webp",
    locationId: "loc_pub_deutsche",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_red_light",
    regionId: "FREIBURG_1905",
    title: "Gerberau Canal",
    description: "Tanners quarter where movement is best watched at night.",
    lat: 47.993,
    lng: 7.851,
    image: "/images/locations/loc_misc/loc_suburbs.webp",
    locationId: "loc_red_light",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_cleaner"],
  },
  {
    id: "loc_freiburg_warehouse",
    regionId: "FREIBURG_1905",
    title: "Old Warehouse",
    description:
      "Rail yard storage facility used for late-stage investigation.",
    lat: 48.001,
    lng: 7.838,
    image:
      "/images/locations/loc_freiburg_warehouse/loc_stuhlinger_warehouse.webp",
    locationId: "loc_freiburg_warehouse",
    category: "SHADOW",
    unlockGroup: "loc_freiburg_warehouse",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["case1_finale"],
  },
  {
    id: "loc_freiburg_estate",
    regionId: "FREIBURG_1905",
    title: "Edge Estate",
    description:
      "A private estate used as a quiet relay point for the case's hidden paperwork.",
    lat: 47.9898,
    lng: 7.8612,
    image: "/images/locations/loc_student_house/loc_student_house.webp",
    locationId: "loc_freiburg_estate",
    category: "SHADOW",
    unlockGroup: "loc_freiburg_estate",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["detective_case1_lab_analysis"],
  },
  {
    id: "loc_workers_pub",
    regionId: "FREIBURG_1905",
    title: "The Red Cog Tavern",
    description: "Workers tavern and hub for social leads.",
    lat: 47.999,
    lng: 7.839,
    image: "/images/locations/loc_pub_deutsche/loc_ganter_brauerei.webp",
    locationId: "loc_workers_pub",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_cleaner", "quest_victoria_poetry"],
  },
  {
    id: "loc_martinstor",
    regionId: "FREIBURG_1905",
    title: "Martinstor",
    description: "Historic city gate with strong foot traffic.",
    lat: 47.9936,
    lng: 7.849,
    image: "/images/locations/loc_munster/loc_munster.webp",
    locationId: "loc_martinstor",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_schwabentor",
    regionId: "FREIBURG_1905",
    title: "Schwabentor",
    description: "Eastern city gate and surveillance vantage point.",
    lat: 47.9928,
    lng: 7.8545,
    image: "/images/locations/loc_munster/loc_munster.webp",
    locationId: "loc_schwabentor",
    category: "PUBLIC",
    defaultState: "discovered",
    isHiddenInitially: true,
    legacyScenarioIds: ["encounter_cleaner"],
  },
  {
    id: "loc_tailor",
    regionId: "FREIBURG_1905",
    title: "Tailor Workshop",
    description: "Disguise and costume workshop tied to lead progression.",
    lat: 47.9935,
    lng: 7.8525,
    image: "/images/locations/loc_student_house/loc_student_house.webp",
    locationId: "loc_tailor",
    category: "SHADOW",
    unlockGroup: "loc_tailor",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["lead_tailor"],
  },
  {
    id: "loc_apothecary",
    regionId: "FREIBURG_1905",
    title: "Lowen Apotheke",
    description: "Pharmacy near the cathedral with chemical evidence links.",
    lat: 47.9952,
    lng: 7.8535,
    image: "/images/locations/loc_uni/loc_uni.webp",
    locationId: "loc_apothecary",
    category: "SHADOW",
    unlockGroup: "loc_apothecary",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["lead_apothecary"],
  },
  {
    id: "loc_pub",
    regionId: "FREIBURG_1905",
    title: "Zum Schlappen",
    description: "Tavern near Martinstor with working-class witnesses.",
    lat: 47.9938,
    lng: 7.8495,
    image: "/images/locations/loc_pub_deutsche/loc_ganter_brauerei.webp",
    locationId: "loc_pub",
    category: "SHADOW",
    unlockGroup: "loc_pub",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["lead_pub"],
  },
  {
    id: "loc_telephone",
    regionId: "FREIBURG_1905",
    title: "Telegraph Office",
    description: "Message relay and switchboard narrative checkpoint.",
    lat: 47.9965,
    lng: 7.8485,
    image: "/images/locations/loc_rathaus/loc_rathaus_archiv.webp",
    locationId: "loc_telephone",
    category: "SHADOW",
    unlockGroup: "loc_telephone",
    defaultState: "locked",
    isHiddenInitially: true,
    legacyScenarioIds: ["interlude_lotte_warning", "quest_lotte_wires"],
  },
];

const CASE_01_SHADOW_ROUTES: NonNullable<MapSnapshot["shadowRoutes"]> = [
  {
    id: "route_ghost_undercity",
    regionId: "FREIBURG_1905",
    pointIds: ["loc_munster", "loc_apothecary", "loc_pub"],
    color: "#5d4632",
    revealFlagsAll: ["ghost_route_unlocked"],
  },
  {
    id: "route_finale_stuhlinger",
    regionId: "FREIBURG_1905",
    pointIds: ["loc_agency", "loc_workers_pub", "loc_freiburg_warehouse"],
    color: "#2f3c4f",
    revealFlagsAll: ["freiburg_finale_open"],
  },
];

const CASE_01_QR_CODE_REGISTRY: NonNullable<MapSnapshot["qrCodeRegistry"]> = [
  {
    codeId: "qr_warehouse_dock",
    codeHash:
      "f910aaad92f4ffe866e78870e8ef623e8eb3fa9a0c6739d5cdf48ecf655e7a67",
    redeemPolicy: "once_per_player",
    contentClass: "evidence_fragment",
    policyTier: "once_per_player",
    conditions: [
      {
        type: "geofence_within",
        lat: 48.001,
        lng: 7.838,
        radiusMeters: 90,
      },
    ],
    effects: [{ type: "unlock_group", groupId: "loc_freiburg_warehouse" }],
    requiresFlagsAll: ["agency_briefing_complete"],
  },
];

const CASE_01_MAP_EVENT_TEMPLATES: NonNullable<
  MapSnapshot["mapEventTemplates"]
> = [
  {
    id: WORKERS_PUB_EVENT_TEMPLATE_ID,
    ttlMinutes: 15,
    point: {
      id: "evt_workers_pub_raid_pin",
      title: "Street Raid Lead",
      regionId: "FREIBURG_1905",
      lat: 47.9972,
      lng: 7.8456,
      category: "EPHEMERAL",
      description:
        "A whispered lead points to a raid already unfolding near the rail yards.",
      image: "/images/locations/loc_misc/loc_suburbs.webp",
      locationId: "loc_street_event",
      defaultState: "discovered",
      isHiddenInitially: false,
      bindings: [
        {
          id: "bind_evt_workers_pub_raid_start",
          trigger: "map_pin",
          label: "Investigate",
          priority: 120,
          intent: "interaction",
          actions: [
            { type: "start_scenario", scenarioId: "sandbox_workers_pub_rumor" },
          ],
        },
        {
          id: "bind_evt_workers_pub_raid_travel",
          trigger: "card_secondary",
          label: "Travel",
          priority: 10,
          intent: "travel",
          actions: [{ type: "travel_to", locationId: "loc_street_event" }],
        },
      ],
    },
  },
];

const buildTravelBinding = (point: Case01PointSource): BindingBlueprint => ({
  id: `sys_travel_${point.id}`,
  trigger: "card_secondary",
  label: "Travel",
  priority: 10,
  intent: "travel",
  actions: [{ type: "travel_to", locationId: point.locationId }],
});

const buildFallbackStartBinding = (
  point: Case01PointSource,
  availableScenarioIds: ReadonlySet<string>,
): BindingBlueprint | null => {
  const startScenarioId = resolveScenarioId(
    point.legacyScenarioIds,
    availableScenarioIds,
  );

  if (!startScenarioId) {
    return null;
  }

  return {
    id: `legacy_start_${point.id}`,
    trigger: "card_primary",
    label: "Start Scenario",
    priority: 100,
    intent: "interaction",
    actions: [{ type: "start_scenario", scenarioId: startScenarioId }],
  };
};

const toSnapshotBinding = (
  binding: BindingBlueprint,
): MapSnapshot["points"][number]["bindings"][number] => ({
  id: binding.id,
  trigger: binding.trigger,
  label: binding.label,
  priority: binding.priority,
  intent: binding.intent,
  conditions: normalizeConditions(binding.conditions),
  actions: binding.actions,
});

export const buildCase01MapSnapshot = (
  availableScenarioIds: ReadonlySet<string>,
): MapSnapshot => ({
  defaultRegionId: CASE_01_DEFAULT_REGION_ID,
  regions: CASE_01_REGIONS,
  points: CASE_01_POINTS.map((point) => {
    const richBindings = RICH_BINDINGS_BY_POINT[point.id] ?? [];
    const fallbackBinding =
      richBindings.length === 0
        ? buildFallbackStartBinding(point, availableScenarioIds)
        : null;

    const bindings = [
      ...richBindings,
      ...(fallbackBinding ? [fallbackBinding] : []),
      buildTravelBinding(point),
    ];

    return {
      id: point.id,
      title: point.title,
      regionId: point.regionId,
      lat: point.lat,
      lng: point.lng,
      description: point.description,
      image: point.image,
      locationId: point.locationId,
      category: point.category,
      defaultState: point.defaultState,
      unlockGroup: point.unlockGroup,
      isHiddenInitially: point.isHiddenInitially,
      bindings: bindings.map((binding) => toSnapshotBinding(binding)),
    };
  }),
  shadowRoutes: CASE_01_SHADOW_ROUTES,
  qrCodeRegistry: CASE_01_QR_CODE_REGISTRY,
  mapEventTemplates: CASE_01_MAP_EVENT_TEMPLATES,
  testDefaults: {
    defaultEventTtlMinutes: 15,
  },
});
