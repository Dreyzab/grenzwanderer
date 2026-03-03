import type {
  MapAction,
  MapCondition,
  MapSnapshot,
} from "../../src/features/vn/types";

export interface Case01PointSource {
  id: string;
  regionId: string;
  title: string;
  lat: number;
  lng: number;
  description?: string;
  image?: string;
  locationId: string;
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
  detective_case1_hbf_arrival: "sandbox_case01_pilot",
  detective_case1_bank_scene: "sandbox_banker_pilot",
  detective_case1_alt_briefing: "sandbox_dog_pilot",
  detective_case1_mayor_followup: "sandbox_dog_pilot",
  detective_case1_archive_search: "sandbox_dog_pilot",
  detective_case1_lab_analysis: "sandbox_ghost_pilot",
  detective_case1_qr_scan_bank: "sandbox_banker_pilot",
  case1_finale: "sandbox_case01_pilot",
  lead_tailor: "sandbox_dog_pilot",
  lead_apothecary: "sandbox_ghost_pilot",
  lead_pub: "sandbox_ghost_pilot",
  interlude_victoria_street: "sandbox_case01_pilot",
  interlude_lotte_warning: "sandbox_case01_pilot",
  quest_lotte_wires: "sandbox_case01_pilot",
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

const CLOSED_CASES_CONDITION: LegacyMapCondition = {
  type: "logic_and",
  conditions: [
    { type: "flag_is", key: "banker_case_closed", value: true },
    { type: "flag_is", key: "dog_case_closed", value: true },
    { type: "flag_is", key: "ghost_case_closed", value: true },
  ],
};

const RICH_BINDINGS_BY_POINT: Record<string, BindingBlueprint[]> = {
  loc_hbf: [
    {
      id: "bind_hbf_intro_start",
      trigger: "card_primary",
      label: "Review Arrival Brief",
      priority: 130,
      intent: "objective",
      conditions: [
        { type: "flag_is", flagId: "intro_freiburg_done", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_intro_pilot" },
        {
          type: "track_event",
          eventName: "map_hbf_intro_start",
          tags: { location: "hbf" },
        },
      ],
    },
    {
      id: "bind_hbf_case_bridge",
      trigger: "card_primary",
      label: "Open Case Bridge",
      priority: 95,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "intro_freiburg_done", value: true },
        { type: "flag_is", key: "case01_bridge_started", value: false },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_case01_pilot" },
        { type: "set_flag", key: "case01_bridge_started", value: true },
      ],
    },
  ],
  loc_freiburg_bank: [
    {
      id: "bind_bank_start",
      trigger: "card_primary",
      label: "Interview Kessler",
      priority: 130,
      intent: "objective",
      conditions: [{ type: "flag_is", key: "banker_intro_seen", value: false }],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_banker_pilot" },
        { type: "set_quest_stage", questId: "quest_banker", stage: 1 },
      ],
    },
    {
      id: "bind_bank_followup",
      trigger: "card_primary",
      label: "Follow Banker Leads",
      priority: 110,
      intent: "interaction",
      conditions: [
        { type: "quest_stage_gte", questId: "quest_banker", stage: 2 },
        { type: "flag_is", key: "banker_case_closed", value: false },
      ],
      actions: [{ type: "start_scenario", scenarioId: "sandbox_banker_pilot" }],
    },
    {
      id: "bind_bank_close",
      trigger: "card_primary",
      label: "Close Banker Case",
      priority: 90,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "case_banker_theft_solved", value: true },
        { type: "flag_is", key: "banker_case_closed", value: false },
      ],
      actions: [
        { type: "set_quest_stage", questId: "quest_banker", stage: 3 },
        { type: "set_flag", key: "banker_case_closed", value: true },
        { type: "grant_xp", amount: 35 },
      ],
    },
  ],
  loc_rathaus: [
    {
      id: "bind_rathaus_dog_start",
      trigger: "card_primary",
      label: "Open Dog Briefing",
      priority: 125,
      intent: "objective",
      conditions: [
        { type: "flag_is", key: "dog_case_closed", value: false },
        { type: "flag_is", key: "banker_intro_seen", value: true },
      ],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_dog_pilot" },
        { type: "set_quest_stage", questId: "quest_dog", stage: 1 },
      ],
    },
    {
      id: "bind_rathaus_dog_followup",
      trigger: "card_primary",
      label: "Review Registry Leads",
      priority: 110,
      intent: "interaction",
      conditions: [
        { type: "quest_stage_gte", questId: "quest_dog", stage: 2 },
        { type: "flag_is", key: "dog_case_closed", value: false },
      ],
      actions: [{ type: "start_scenario", scenarioId: "sandbox_dog_pilot" }],
    },
    {
      id: "bind_rathaus_registry_unlock",
      trigger: "card_primary",
      label: "Archive Clearance",
      priority: 80,
      intent: "interaction",
      conditions: [
        { type: "flag_is", key: "dog_registry_found", value: true },
        { type: "flag_is", key: "loc_rathaus_unlocked", value: false },
      ],
      actions: [
        { type: "unlock_group", groupId: "loc_rathaus" },
        { type: "set_flag", key: "loc_rathaus_unlocked", value: true },
        { type: "grant_evidence", evidenceId: "ev_bank_master_key" },
      ],
    },
  ],
  loc_workers_pub: [
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
      conditions: [CLOSED_CASES_CONDITION],
      actions: [
        { type: "start_scenario", scenarioId: "sandbox_case01_pilot" },
        { type: "set_flag", key: "freiburg_finale_open", value: true },
      ],
    },
    {
      id: "bind_warehouse_locked_hint",
      trigger: "card_primary",
      label: "Inspect Locked Gate",
      priority: 20,
      intent: "interaction",
      conditions: [{ type: "logic_not", condition: CLOSED_CASES_CONDITION }],
      actions: [
        {
          type: "track_event",
          eventName: "warehouse_finale_locked",
          tags: { pointId: "loc_freiburg_warehouse" },
        },
      ],
    },
  ],
};

export const CASE_01_POINTS: Case01PointSource[] = [
  {
    id: "loc_hbf",
    regionId: "FREIBURG_1905",
    title: "Hauptbahnhof",
    description:
      "Steam-era gateway to Freiburg. Arrivals from Basel and Strasbourg.",
    lat: 47.997791,
    lng: 7.842609,
    image: "/images/locations/loc_hauptbahnhof.webp",
    locationId: "loc_hbf",
    defaultState: "discovered",
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
    image: "/images/locations/loc_bankhaus.webp",
    locationId: "loc_freiburg_bank",
    unlockGroup: "loc_freiburg_bank",
    defaultState: "discovered",
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
    image: "/images/locations/loc_rathaus_archiv.webp",
    locationId: "loc_rathaus",
    unlockGroup: "loc_rathaus",
    defaultState: "discovered",
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
    image: "/images/locations/loc_munster.webp",
    locationId: "loc_munster",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_uni_chem",
    regionId: "FREIBURG_1905",
    title: "Kiliani Laboratory",
    description: "University chemistry lab for forensic analysis.",
    lat: 47.994,
    lng: 7.846,
    image: "/images/locations/loc_uni.webp",
    locationId: "loc_uni_chem",
    defaultState: "discovered",
    legacyScenarioIds: ["detective_case1_lab_analysis"],
  },
  {
    id: "loc_uni_med",
    regionId: "FREIBURG_1905",
    title: "Institute of Hygiene",
    description: "Medical institute focused on serology and lab diagnostics.",
    lat: 47.9935,
    lng: 7.847,
    image: "/images/locations/loc_uni.webp",
    locationId: "loc_uni_med",
    defaultState: "discovered",
    legacyScenarioIds: ["detective_case1_lab_analysis"],
  },
  {
    id: "loc_student_house",
    regionId: "FREIBURG_1905",
    title: "Corps Suevia House",
    description: "Fraternity house in the university quarter.",
    lat: 47.99,
    lng: 7.848,
    image: "/images/locations/loc_student_house.webp",
    locationId: "loc_student_house",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_student"],
  },
  {
    id: "loc_pub_deutsche",
    regionId: "FREIBURG_1905",
    title: "Zum Deutschen Haus",
    description: "Busy inn popular with locals and travelers.",
    lat: 47.992,
    lng: 7.854,
    image: "/images/locations/loc_ganter_brauerei.webp",
    locationId: "loc_pub_deutsche",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_red_light",
    regionId: "FREIBURG_1905",
    title: "Gerberau Canal",
    description: "Tanners quarter where movement is best watched at night.",
    lat: 47.993,
    lng: 7.851,
    image: "/images/locations/loc_suburbs.webp",
    locationId: "loc_red_light",
    defaultState: "discovered",
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
    image: "/images/locations/loc_stuhlinger_warehouse.webp",
    locationId: "loc_freiburg_warehouse",
    defaultState: "locked",
    legacyScenarioIds: ["case1_finale"],
  },
  {
    id: "loc_workers_pub",
    regionId: "FREIBURG_1905",
    title: "The Red Cog Tavern",
    description: "Workers tavern and hub for social leads.",
    lat: 47.999,
    lng: 7.839,
    image: "/images/locations/loc_ganter_brauerei.webp",
    locationId: "loc_workers_pub",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_cleaner", "quest_victoria_poetry"],
  },
  {
    id: "loc_martinstor",
    regionId: "FREIBURG_1905",
    title: "Martinstor",
    description: "Historic city gate with strong foot traffic.",
    lat: 47.9936,
    lng: 7.849,
    image: "/images/locations/loc_munster.webp",
    locationId: "loc_martinstor",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_tourist"],
  },
  {
    id: "loc_schwabentor",
    regionId: "FREIBURG_1905",
    title: "Schwabentor",
    description: "Eastern city gate and surveillance vantage point.",
    lat: 47.9928,
    lng: 7.8545,
    image: "/images/locations/loc_munster.webp",
    locationId: "loc_schwabentor",
    defaultState: "discovered",
    legacyScenarioIds: ["encounter_cleaner"],
  },
  {
    id: "loc_tailor",
    regionId: "FREIBURG_1905",
    title: "Tailor Workshop",
    description: "Disguise and costume workshop tied to lead progression.",
    lat: 47.9935,
    lng: 7.8525,
    image: "/images/locations/loc_student_house.webp",
    locationId: "loc_tailor",
    defaultState: "locked",
    legacyScenarioIds: ["lead_tailor"],
  },
  {
    id: "loc_apothecary",
    regionId: "FREIBURG_1905",
    title: "Lowen Apotheke",
    description: "Pharmacy near the cathedral with chemical evidence links.",
    lat: 47.9952,
    lng: 7.8535,
    image: "/images/locations/loc_uni.webp",
    locationId: "loc_apothecary",
    defaultState: "locked",
    legacyScenarioIds: ["lead_apothecary"],
  },
  {
    id: "loc_pub",
    regionId: "FREIBURG_1905",
    title: "Zum Schlappen",
    description: "Tavern near Martinstor with working-class witnesses.",
    lat: 47.9938,
    lng: 7.8495,
    image: "/images/locations/loc_ganter_brauerei.webp",
    locationId: "loc_pub",
    defaultState: "locked",
    legacyScenarioIds: ["lead_pub"],
  },
  {
    id: "loc_street_event",
    regionId: "FREIBURG_1905",
    title: "Street Encounter",
    description: "Temporary event location for interlude beats.",
    lat: 47.9945,
    lng: 7.8505,
    image: "/images/locations/loc_suburbs.webp",
    locationId: "loc_street_event",
    defaultState: "locked",
    legacyScenarioIds: ["interlude_victoria_street"],
  },
  {
    id: "loc_telephone",
    regionId: "FREIBURG_1905",
    title: "Telegraph Office",
    description: "Message relay and switchboard narrative checkpoint.",
    lat: 47.9965,
    lng: 7.8485,
    image: "/images/locations/loc_rathaus_archiv.webp",
    locationId: "loc_telephone",
    defaultState: "locked",
    legacyScenarioIds: ["interlude_lotte_warning", "quest_lotte_wires"],
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
      defaultState: point.defaultState,
      unlockGroup: point.unlockGroup,
      isHiddenInitially: point.isHiddenInitially,
      bindings: bindings.map((binding) => toSnapshotBinding(binding)),
    };
  }),
});
