import type { NodeBlueprint, ScenarioBlueprint } from "../vn-blueprint-types";
import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_DINING_FLAGS,
  CASE01_DINING_NODE_IDS,
  CASE01_FINAL_OUTCOME_COMPROMISED,
  CASE01_FINAL_OUTCOME_LAWFUL,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
  CASE01_TRAIN_HUB_ASPECT_RATIO,
  CASE01_TRAIN_HUB_IMAGE_URL,
  CASE01_TRAIN_HUB_NODE_ID,
  CASE01_TRAIN_HUB_SCHEMA_ID,
  CASE01_TRAIN_HUB_VIEW_BOX,
  CASE01_TRAIN_HUB_ZONE_IDS,
  CASE01_TRAIN_HUB_ZONE_PATHS,
} from "../../src/shared/case01Canon";

const officialRouteConditions = [
  {
    type: "var_gte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_OFFICIAL,
  },
  {
    type: "var_lte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_OFFICIAL,
  },
];

const covertRouteConditions = [
  {
    type: "var_gte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_COVERT,
  },
  {
    type: "var_lte" as const,
    key: "convergence_route",
    value: CASE01_ROUTE_VALUE_COVERT,
  },
];

const CASE01_START_VIDEO_BASE_PATH = "/VN/start/video";
const CASE01_START_IMAGE_BASE_PATH = "/VN/start/image";
const CASE01_TRAIN_COMPARTMENT_BG = `${CASE01_START_IMAGE_BASE_PATH}/compartment_cinema.png`;
const CASE01_TRAIN_ASSISTANT_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_assistant.png`;
const CASE01_WITCH_COMPARTMENT_DROWSE_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_compartment_drowse_final.png`;
const CASE01_WITCH_THIRST_CLOSEUP_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_compartment_thirst_closeup_v2.png`;
const CASE01_WITCH_COIN_FLOOR_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_coin_floor.png`;
const CASE01_WITCH_FELIX_COLLAR_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_felix_collar_v2.png`;
const CASE01_WITCH_COMPARTMENT_AFTER_FELIX_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_compartment_after_felix.png`;
const CASE01_TRAIN_DINING_CAR_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car.png`;
const CASE01_TRAIN_DINING_CAR_MOTHER_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_mother.png`;
const CASE01_TRAIN_DINING_CAR_MOTHER_STARE_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_mother_stare.png`;
const CASE01_PLATFORM_STILL_BG = `${CASE01_START_IMAGE_BASE_PATH}/Ankommen.png`;
const CASE01_HBF_BG = `${CASE01_START_IMAGE_BASE_PATH}/HBF.png`;
const CASE01_NEWSBOY_BG = `${CASE01_START_IMAGE_BASE_PATH}/boy_newspaper_styled.png`;
const CASE01_LUGGAGE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_luggage_counter_1776719222396.png`;
const CASE01_POLICE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_police_post_1776719605015.png`;
const CASE01_TRAIN_DINING_CAR_WINE_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_wine.png`;
const CASE01_TRAIN_DINING_CAR_FELIX_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_felix.png`;
// const CASE01_TRAIN_DINING_CAR_OLD_BADENER_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_old_badener.png`;
const CASE01_WITCH_LOTTE_BUFFET_COUNTER_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_buffet_counter.png`;
const CASE01_WITCH_LOTTE_TABLE_FIRST_TALK_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_table_first_talk.png`;
const CASE01_WITCH_LOTTE_TABLE_LIFE_MONOLOGUE_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_table_life_monologue.png`;
const CASE01_WITCH_LOTTE_WARM_HAND_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_warm_hand.png`;
const CASE01_WITCH_LOTTE_NOTEBOOK_SUSPICION_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_notebook_suspicion.png`;
const CASE01_WITCH_LOTTE_FELIX_INTERRUPT_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_felix_arrival_interrupt.png`;
const CASE01_WITCH_LOTTE_GOODBYE_SUNRISE_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_lotte_goodbye_sunrise_platform.png`;
const CASE01_WITCH_SASHA_LUGGAGE_SOFT_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_sasha_luggage_soft.png`;
const CASE01_WITCH_SASHA_LUGGAGE_THIRST_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_sasha_luggage_thirst.png`;
const CASE01_WITCH_SASHA_LUGGAGE_THANK_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_sasha_luggage_thank.png`;
const CASE01_WITCH_SASHA_LUGGAGE_DISMISS_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_sasha_luggage_dismiss.png`;
const CASE01_WITCH_SASHA_SEND_FELIX_AWAY_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_sasha_send_felix_away.png`;
const CASE01_WITCH_HOTEL_CHECKIN_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_hotel_checkin_zum_goldenen_adler.png`;
const CASE01_WITCH_BUREAU_HIDDEN_LIFT_ENTRY_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_bureau_hidden_lift_entry.png`;
const CASE01_WITCH_BUREAU_MASTER_RELIC_CHOICE_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_bureau_master_relic_choice.png`;
const CASE01_WITCH_BUREAU_MASTER_NOTICED_HBF_BLOOD_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_bureau_master_noticed_hbf_blood.png`;
const CASE01_WITCH_BUREAU_EXIT_ESTATE_ROAD_BG = `${CASE01_START_IMAGE_BASE_PATH}/witch_bureau_exit_estate_road.png`;
const CASE01_PLATFORM_FAREWELL_BG = `${CASE01_START_IMAGE_BASE_PATH}/platform_farewell.png`;
const CASE01_ART_BG_BASE_PATH = "/images/scenes/case01";
const CASE01_BG_zum_goldenen_adler_LOBBY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_goldenen_adler_lobby.webp`;
const CASE01_BG_zum_goldenen_adler_BLOTTER = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_goldenen_adler_blotter_timetable.webp`;
const CASE01_BG_TELEGRAPH = `${CASE01_ART_BG_BASE_PATH}/bg_case01_telegraph_switchboard.webp`;
const CASE01_BG_RATHAUS = `${CASE01_ART_BG_BASE_PATH}/bg_case01_rathaus_office_pressure.webp`;
const CASE01_BG_ARCHIVE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_archive_reading_room.webp`;
const CASE01_BG_ARCHIVE_LEDGER = `${CASE01_ART_BG_BASE_PATH}/bg_case01_archive_ledger_table.webp`;
const CASE01_BG_RAIL_YARD = `${CASE01_ART_BG_BASE_PATH}/bg_case01_rail_yard_night.webp`;
const CASE01_BG_TAILOR = `${CASE01_ART_BG_BASE_PATH}/bg_case01_tailor_workshop.webp`;
const CASE01_BG_APOTHECARY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_apothecary_counter.webp`;
const CASE01_BG_ZUM_SCHLAPPEN = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_schlappen_tavern.webp`;
const CASE01_BG_ESTATE_BUREAU = `${CASE01_ART_BG_BASE_PATH}/bg_case01_estate_bureau.webp`;
const CASE01_BG_ESTATE_APPROACH = `${CASE01_ART_BG_BASE_PATH}/bg_case01_estate_approach.webp`;
const CASE01_BG_ESTATE_GATES = `${CASE01_ART_BG_BASE_PATH}/bg_case01_estate_gates.webp`;
const CASE01_BG_BARONESS_STUDY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_baroness_study.webp`;
const CASE01_BG_ESTATE_VAULTS = `${CASE01_ART_BG_BASE_PATH}/bg_case01_estate_vaults.webp`;
const CASE01_BG_GHOST_CELLAR = `${CASE01_ART_BG_BASE_PATH}/bg_case01_ghost_cellar.webp`;
const CASE01_BG_NIGHT_ALLEY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_night_alley.webp`;
const CASE01_BG_HOTEL_BEDROOM = `${CASE01_ART_BG_BASE_PATH}/bg_case01_hotel_bedroom.webp`;
const CASE01_BG_CONVERGENCE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_convergence_city_threshold.webp`;
const CASE01_BG_WAREHOUSE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_wet_timber.webp`;
const CASE01_BG_WAREHOUSE_LAWFUL = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_lawful_seal.webp`;
const CASE01_BG_WAREHOUSE_COMPROMISED = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_compromised_ledger.webp`;
const CASE01_BG_BANK_EXTERIOR = CASE01_BG_CONVERGENCE;
const CASE01_BG_BANK_HALL = CASE01_BG_ARCHIVE;
const CASE01_BG_BANK_OFFICE = CASE01_BG_RATHAUS;
const CASE01_BG_BANK_VAULT = CASE01_BG_WAREHOUSE_LAWFUL;

const trainHubZoneEffect = (
  zoneId: (typeof CASE01_TRAIN_HUB_ZONE_IDS)[keyof typeof CASE01_TRAIN_HUB_ZONE_IDS],
) => ({
  type: "set_hub_zone" as const,
  hubSchemaId: CASE01_TRAIN_HUB_SCHEMA_ID,
  zoneId,
});

const returnToTrainHubChoice = {
  id: "return_to_train_hub",
  text: "Back to the train map",
  nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
} satisfies NodeBlueprint["choices"][number];

const trainHubSchema = {
  id: CASE01_TRAIN_HUB_SCHEMA_ID,
  imageUrl: CASE01_TRAIN_HUB_IMAGE_URL,
  viewBox: CASE01_TRAIN_HUB_VIEW_BOX,
  aspectRatio: CASE01_TRAIN_HUB_ASPECT_RATIO,
  defaultCurrentZoneId: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
  zones: [
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
      label: "Compartment",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.compartment,
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.corridor,
      label: "Corridor",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.corridor,
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
      label: "Dining car",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.dining_car,
      occupants: [
        {
          npcId: "npc_felix_hartmann",
          visibleIfAll: [
            {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metFelix,
              value: true,
            },
          ],
        },
        {
          npcId: "npc_mother_hartmann",
          visibleIfAll: [
            {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metMother,
              value: true,
            },
          ],
        },
      ],
    },
    {
      id: CASE01_TRAIN_HUB_ZONE_IDS.vestibule,
      label: "Vestibule",
      svgPath: CASE01_TRAIN_HUB_ZONE_PATHS.vestibule,
    },
  ],
} satisfies NonNullable<NodeBlueprint["hubSchema"]>;

const CASE01_DINING_FAREWELL_NODE_IDS = {
  silentDefend: "scene_case01_train_dining_car_eleonora_farewell_silent_defend",
  hotelDefend: "scene_case01_train_dining_car_eleonora_farewell_hotel_defend",
  introObserve: "scene_case01_train_dining_car_eleonora_farewell_intro_observe",
  silentObserve: "scene_case01_train_dining_car_eleonora_farewell_silent_observe",
  hotelObserve: "scene_case01_train_dining_car_eleonora_farewell_hotel_observe",
} as const;

export const CASE01_CANON_SCENARIOS: ScenarioBlueprint[] = [
  {
    id: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    title: "Case 01: Freiburg Arrival",
    startNodeId: "scene_case01_opening_arrival_video",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_HBF_BG,
    completionRoutes: [
      {
        nextScenarioId: "sandbox_ghost_pilot",
        requiredFlagsAll: [
          "origin_witch_handoff_done",
          "witch_enter_ghost_sandbox",
        ],
      },
    ],
    nodeIds: [
      "scene_case01_opening_arrival_video",
      "scene_case01_opening_arrival_video_witch",
      "scene_case01_witch_thirst_mask",
      "scene_case01_witch_coin_wake",
      "scene_case01_train_compartment_letter",
      "scene_case01_train_assistant_intro_witch",
      "scene_case01_train_collar_choice_witch",
      "scene_case01_witch_felix_exit",
      "scene_case01_train_compartment_letter_witch",
      "scene_case01_witch_letter_afterthoughts",
      "scene_case01_witch_dining_car_buffet_first_look",
      "scene_case01_witch_lotte_counter_intro",
      "scene_case01_train_dining_car_intro_witch",
      "scene_case01_train_dining_car_lotte_monologue_witch",
      "scene_case01_witch_lotte_monologue_cynic_reaction",
      "scene_case01_witch_lotte_monologue_grief_reaction",
      "scene_case01_witch_lotte_monologue_practical_reaction",
      "scene_case01_train_assistant_intro",
      "scene_case01_train_door_creaks",
      "scene_case01_train_assistant_departure",
      "scene_case01_train_silent_beat",
      CASE01_DINING_NODE_IDS.intro,
      CASE01_DINING_NODE_IDS.mother,
      CASE01_DINING_NODE_IDS.marriageJoke,
      CASE01_DINING_NODE_IDS.silentBranch,
      CASE01_DINING_NODE_IDS.introSelfBranch,
      CASE01_DINING_NODE_IDS.hotelBranch,
      CASE01_DINING_NODE_IDS.wineBeat,
      CASE01_DINING_NODE_IDS.felixInterrupts,
      CASE01_DINING_NODE_IDS.eleonoraFarewell,
      CASE01_DINING_FAREWELL_NODE_IDS.silentDefend,
      CASE01_DINING_FAREWELL_NODE_IDS.hotelDefend,
      CASE01_DINING_FAREWELL_NODE_IDS.introObserve,
      CASE01_DINING_FAREWELL_NODE_IDS.silentObserve,
      CASE01_DINING_FAREWELL_NODE_IDS.hotelObserve,
      CASE01_TRAIN_HUB_NODE_ID,
      "scene_case01_train_compartment_revisit",
      "scene_case01_train_corridor_revisit",
      "scene_case01_train_dining_car_revisit",
      "scene_case01_train_vestibule_revisit",
      "scene_case01_train_ankommen_video",
      "scene_case01_witch_lotte_goodbye_platform",
      "scene_case01_hbf_porter_greeting",
      "scene_case01_corridor_reflection",
      "scene_case01_corridor_reflection_hotel_observe",
      "scene_case01_corridor_reflection_silent_observe",
      "scene_case01_corridor_reflection_intro_observe",
      "scene_case01_corridor_reflection_hotel_defend",
      "scene_case01_corridor_reflection_silent_defend",
      "scene_case01_train_voza_cutscene",
      "scene_case01_train_disembark_journal",
      "scene_case01_train_platform_parting",
      "scene_case01_hbf_echo_intro_self",
      "scene_case01_hbf_echo_hospitality_accepted",
      "scene_case01_beat1_atmosphere",
      "scene_case01_hbf_newsboy_approach",
      "scene_case01_hbf_newsboy_handoff",
      "scene_case01_hbf_newsboy_release",
      "scene_case01_hbf_luggage",
      "scene_case01_hbf_luggage_robbery",
      "scene_case01_hbf_police",
      "scene_case01_hbf_departure",
      "scene_case01_witch_hotel_checkin",
      "scene_case01_hbf_luggage_incident_witch",
      "scene_case01_hbf_luggage_sasha_soft",
      "scene_case01_hbf_luggage_sasha_thank_quietly",
      "scene_case01_hbf_luggage_sasha_dismiss_concern",
      "scene_case01_hbf_luggage_sasha_thirst",
      "scene_case01_hbf_luggage_sasha_send_felix_away",
      "scene_case01_witch_bureau_entry",
      "scene_case01_witch_bureau_master_meeting",
      "scene_case01_witch_bureau_master_noticed_hbf_blood",
      "scene_case01_witch_bureau_exit",
      "scene_case01_witch_estate_handoff",
      "scene_case01_estate_arrival_witch",
      "scene_case01_baroness_office_witch",
      "scene_case01_baroness_office_cut_trigger",
      "scene_case01_baroness_office_feed_coverup",
      "scene_case01_estate_vaults_witch",
      "scene_case01_ghost_showdown_witch",
      "scene_case01_night_alley_witch",
      "scene_case01_night_alley_escalation",
      "scene_case01_hotel_morning_witch",
      "scene_case01_hotel_copper_trace_witch",
      "scene_case01_lobby_crossover_witch",
      "scene_case01_witch_estate_epilogue",
      "scene_case01_witch_finale_closed",
      "scene_case01_witch_finale_to_sandbox",
      "scene_case01_hbf_exit_final",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.mayorBriefing,
    title: "Case 01: Mayor Briefing",
    startNodeId: "scene_case01_mayor_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_RATHAUS,
    nodeIds: [
      "scene_case01_mayor_entry",
      "scene_case01_mayor_independent_footing",
      "scene_case01_rathaus_briefing_full",
      "scene_case01_mayor_felix_aside",
      "scene_case01_mayor_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.bankInvestigation,
    title: "Case 01: Bank Investigation",
    startNodeId: "scene_case01_bank_arrival",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_BANK_EXTERIOR,
    nodeIds: [
      "scene_case01_bank_arrival",
      "scene_case01_bank_manager",
      "scene_case01_bank_clerk",
      "scene_case01_bank_vault",
      "scene_case01_bank_conclusion",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.leadTailor,
    title: "Case 01: Tailor Lead",
    startNodeId: "scene_case01_tailor_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_TAILOR,
    nodeIds: ["scene_case01_tailor_entry", "scene_case01_tailor_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.leadApothecary,
    title: "Case 01: Apothecary Lead",
    startNodeId: "scene_case01_apothecary_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_APOTHECARY,
    nodeIds: ["scene_case01_apothecary_entry", "scene_case01_apothecary_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.leadPub,
    title: "Case 01: Pub Lead",
    startNodeId: "scene_case01_pub_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_ZUM_SCHLAPPEN,
    nodeIds: ["scene_case01_pub_entry", "scene_case01_pub_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.estateBranch,
    title: "Case 01: Estate Trace",
    startNodeId: "scene_case01_estate_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_ESTATE_BUREAU,
    nodeIds: ["scene_case01_estate_entry", "scene_case01_estate_exit"],
  },
  {
    id: CASE01_SCENARIO_IDS.lotteInterlude,
    title: "Case 01: Lotte Interlude",
    startNodeId: "scene_case01_lotte_warning",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_TELEGRAPH,
    nodeIds: [
      "scene_case01_lotte_warning",
      "scene_case01_lotte_schedule_opening",
      "scene_case01_lotte_listener_opening",
      "scene_case01_lotte_trust",
      "scene_case01_lotte_distance",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    title: "Case 01: Zum Goldenen Adler Lodging",
    startNodeId: "scene_case01_zum_goldenen_adler_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    nodeIds: [
      "scene_case01_zum_goldenen_adler_entry",
      "scene_case01_zum_goldenen_adler_lotte_route",
      "scene_case01_zum_goldenen_adler_settle",
      "scene_case01_zum_goldenen_adler_morning",
      "scene_case01_zum_goldenen_adler_morning_depart",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.convergence,
    title: "Case 01: Convergence",
    startNodeId: "scene_case01_convergence_gate",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_CONVERGENCE,
    nodeIds: [
      "scene_case01_convergence_gate",
      "scene_case01_convergence_official",
      "scene_case01_convergence_covert",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.archiveRun,
    title: "Case 01: Archive Warrant Run",
    startNodeId: "scene_case01_archive_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_ARCHIVE,
    nodeIds: [
      "scene_case01_archive_entry",
      "scene_case01_archive_checks",
      "scene_case01_archive_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.railYardTail,
    title: "Case 01: Rail Yard Shadow Tail",
    startNodeId: "scene_case01_rail_entry",
    mode: "overlay",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_RAIL_YARD,
    nodeIds: [
      "scene_case01_rail_entry",
      "scene_case01_rail_tail",
      "scene_case01_rail_exit",
    ],
  },
  {
    id: CASE01_SCENARIO_IDS.warehouseFinale,
    title: "Case 01: Warehouse Finale",
    startNodeId: "scene_case01_warehouse_entry",
    mode: "fullscreen",
    packId: "case01_mainline",
    defaultBackgroundUrl: CASE01_BG_WAREHOUSE,
    nodeIds: [
      "scene_case01_warehouse_entry",
      "scene_case01_sapper_flashback",
      "scene_case01_warehouse_sapper",
      "scene_case01_warehouse_lawful",
      "scene_case01_warehouse_compromised",
    ],
  },
];

export const CASE01_CANON_NODES: NodeBlueprint[] = [
  {
    id: "scene_case01_opening_arrival_video",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Approach by rail",
    bodyOverride: "",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    backgroundVideoUrl: `${CASE01_START_VIDEO_BASE_PATH}/Bahn.mp4`,
    backgroundVideoPosterUrl: CASE01_TRAIN_COMPARTMENT_BG,
    backgroundVideoSoundPrompt: true,
    narrativeLayout: "fullscreen",
    sceneGroupId: "train_bahn_video",
    advanceOnVideoEnd: true,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true,
            },
          },
        ],
      },
      {
        id: "CASE01_WITCH_START_TO_DROWSE",
        text: "Continue.",
        nextNodeId: "scene_case01_opening_arrival_video_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
      },
    ],
  },
  {
    id: "scene_case01_opening_arrival_video_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Полудрема",
    bodyOverride:
      "**[Narrator]**:\nВагон укачивает мягко и настойчиво: вперед-назад, вперед-назад, будто кто-то осторожно стирает границу между сном и явью. Капли дождя постукивают по стеклу мелко и терпеливо; колеса отвечают им глухим перестуком.\n\nЭлеонора Хартманн дремлет сидя. Подбородок не падает, лицо безмятежно, дыхание ровное. Только пальцы под перчатками время от времени сжимаются, выдавая беспокойство, которому нет места на лице.",
    backgroundUrl: CASE01_WITCH_COMPARTMENT_DROWSE_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_DROWSE_TO_THIRST",
        text: "Continue.",
        nextNodeId: "scene_case01_witch_thirst_mask",
      },
    ],
  },
  {
    id: "scene_case01_witch_thirst_mask",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Жажда",
    bodyOverride:
      "**[Narrator]**:\nСон больше не держит. Возвращаются мелочи: влажный холод от окна, слабый запах коньяка, сухость во рту. Голова тяжелая. Тело недовольно, как после вечера, который лучше не вспоминать.\n\n**[inner_cynic]**:\nПохмелье. Прекрасное слово. У него хотя бы есть приличное лекарство.\n\n**[inner_guide]**:\nНе спешите давать этому имя. Иногда имя — первая ложь.\n\n**[Narrator]**:\nГде-то рядом лежит фляжка. Мысль о глотке всплывает сама: ожог в горле, короткое прощение тела, несколько минут покоя. Почти обычное желание. Почти.\n\nПотом за дверью что-то звенит.",
    backgroundUrl: CASE01_WITCH_THIRST_CLOSEUP_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    onEnter: [
      { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_THIRST_TO_COIN",
        text: "Continue.",
        nextNodeId: "scene_case01_witch_coin_wake",
      },
    ],
  },
  {
    id: "scene_case01_witch_coin_wake",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Упавшая монета",
    bodyOverride:
      "**[Narrator]**:\nМонета падает на пол и звенит слишком громко.\n\nЭлеонора открывает глаза. В дверях стоит Феликс: он уже наклонился за мелкой серебряной монетой, но замер, поняв, что разбудил вас. На лице — короткая, почти детская вина, которую взрослый мужчина обычно прячет лучше.\n\n**[Феликс]**:\n— Простите, матушка. Я не хотел...\n\n**[inner_cynic]**:\nСкажите резко. Пусть вздрогнет, и в висках станет тише. Чужая вина — удобное лекарство.\n\n**[inner_leader]**:\nДержите форму. Усмешка вместо удара: достаточно холодно, чтобы поставить границу, достаточно мягко, чтобы не показать Жажду.\n\n**[inner_guide]**:\nЭто Феликс. Он уронил монету, не вас. Если удержите голос, напряжение останется при вас — зато и он останется рядом.",
    backgroundUrl: CASE01_WITCH_COIN_FLOOR_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "WITCH_COIN_REBUKE",
        text: "Оборвать его: «Феликс, вы и мертвого разбудите».",
        nextNodeId: "scene_case01_train_assistant_intro_witch",
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: -1 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: -10 },
          { type: "set_flag", key: "flag_witch_coin_rebuke", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Феликс, вы и мертвого разбудите.\n\n**[Narrator]**:\nФраза выходит прежде, чем он успевает выпрямиться. В висках становится тише. Феликс опускает взгляд и поднимает монету двумя пальцами, стараясь не звякнуть снова.\n\n**[Феликс]**:\n— Разумеется, матушка. Больше не повторится.\n\n**[Narrator]**:\nОн остается у двери: слишком воспитан, чтобы уйти без доклада, и слишком встревожен, чтобы сделать вид, будто просил только прощения."
      },
      {
        id: "WITCH_COIN_DRY_JOKE",
        text: "Сухо отшутиться, оставив раздражение при себе.",
        nextNodeId: "scene_case01_train_assistant_intro_witch",
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "set_flag", key: "flag_witch_coin_joke", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— У вас редкий талант, Феликс. Вы могли бы разбудить даже семейный склеп.\n\n**[Narrator]**:\nШутка выходит сухой, но не злой. Феликс улыбается краем губ и наконец поднимает монету. Жажда остается под кожей: ей не дали привычного выхода.\n\n**[Феликс]**:\n— Тогда буду считать это полезным навыком, матушка.\n\n**[Narrator]**:\nОн не закрывает дверь. Вежливость удерживает его на пороге: у него есть еще одно сообщение, и он ждет подходящей паузы."
      },
      {
        id: "WITCH_COIN_SOFT_ARISTOCRATIC",
        text: "Мягко принять его заботу и не сорваться.",
        nextNodeId: "scene_case01_train_assistant_intro_witch",
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
          { type: "set_flag", key: "flag_witch_coin_soft", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Ничего, дорогой. Монеты для того и падают. Людям лучше не перенимать привычку.\n\n**[Narrator]**:\nФеликс смотрит на вас чуть дольше обычного, будто проверяет, действительно ли ему позволили ошибиться. Выдержка стоит дорого: Жажда не уходит, только отступает и ждет удобного момента.\n\n**[Феликс]**:\n— Я буду осторожнее. Спасибо, матушка.\n\n**[Narrator]**:\nОн задерживается у двери. Взгляд скользит к коридору, потом обратно к вам: за извинением у него явно спрятана просьба."
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Orders from the Agency",
    bodyOverride:
      "Dear detective.\n\nI await your swift arrival in Freiburg. I trust your talent shall reveal the truth behind the bank robbery. Your quarters at 'Zum Goldenen Adler' are prepared.\n\nBut remember... the most obvious path often leads to a dead end.\n\nWith respect,\nMaster",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_LETTER",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_intro",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_letter_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Письмо Бюро",
    bodyOverride:
      "Фрау Хартманн.\n\nБюро ждет вас во Фрайбурге. Дело с банком стало удобной вывеской; под ней есть второй слой. В городе замечены следы духовного вмешательства, и ваш дар может оказаться полезнее любой полицейской сводки.\n\nПосле прибытия можете пройти в наш отдел под вокзалом. Мастер будет там. Если решите сначала заняться Гранд-Эстейт, не тяните: жалобы об «обмане с привидением» пришли от людей, которые обычно не пишут нам вообще.\n\nПроклятие держите коротко. В этом городе лишний глоток и лишнее видение одинаково быстро становятся уликой.\n\nС уважением,\n[fact:Master:case01/master]",
    backgroundUrl: CASE01_WITCH_COMPARTMENT_AFTER_FELIX_BG,
    narrativePresentation: "letter",
    narrativeLayout: "letter_overlay",
    sceneGroupId: "witch_train_compartment",
    letterOverlayRevealDelayMs: 2800,
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_LETTER_TO_AFTERTHOUGHTS",
        text: "Continue.",
        nextNodeId: "scene_case01_witch_letter_afterthoughts",
      }
    ],
  },
  {
    id: "scene_case01_witch_letter_afterthoughts",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "После письма",
    bodyOverride:
      "**[Narrator]**:\nПечать ломается тихо. Вы дочитываете до подписи Мастера, и купе снова становится слишком маленьким: письмо на столе, фляжка рядом, пустое место у двери.\n\nБюро ничего не требует прямо. Это хуже прямого приказа. Прямому приказу можно повиноваться. Осторожной просьбе приходится верить или не верить самой.\n\n**[inner_exile]**:\nВоск помнит руку. Письмо не просто отправили поздно — его держали до последней минуты. Между строк есть след.\n\n**[inner_cynic]**:\nПрекрасная служебная записка. Ни одного крючка на бумаге, зато достаточно вины, чтобы вы сами надели поводок.\n\n**[inner_leader]**:\nСложите письмо. Дело впереди, сын на платформе, город ближе с каждой минутой. Сначала форма. Потом выводы.\n\n**[inner_guide]**:\nКупе стало слишком тесным для этой новости. В вагоне-ресторане есть свет, вино и Лотте — а у Лотте новости редко бывают только светскими.",
    backgroundUrl: CASE01_WITCH_COMPARTMENT_AFTER_FELIX_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    choices: [
      {
        id: "WITCH_LETTER_AFTERTHOUGHT_VEIL_FOCUS",
        text: "[Veil Sight] Коснуться печати и прочесть след между строк.",
        choiceSource: "signature",
        nextNodeId: "scene_case01_witch_dining_car_buffet_first_look",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
          { type: "set_flag", key: "flag_witch_read_envelope_echo", value: true },
          { type: "change_inner_voice_rank", voiceId: "inner_exile", delta: 1 },
        ],
        inlineText:
          "**[attr_spirit]**:\nВоск холодит перчатку. На миг вы видите руку Мастера: письмо запечатано наспех, в коридоре кто-то ждал. Не нападал. Именно ждал.\n\nСлед тонкий, но он цепляется за кожу. Жажда отвечает не болью, а вниманием.",
        innerVoiceHints: [
          {
            voiceId: "inner_exile",
            stance: "supports",
            text: "Если письмо оставило след, значит, оно пришло не одно.",
          },
          {
            voiceId: "inner_leader",
            stance: "opposes",
            text: "Лишнее видение перед разговором с Феликсом выдаст больше, чем даст.",
          },
        ],
      },
      {
        id: "WITCH_LETTER_AFTERTHOUGHT_DRINK_BRANDY",
        text: "[Drinking Flaw] Сделать глоток бренди, прежде чем выйти к людям.",
        choiceSource: "flaw",
        nextNodeId: "scene_case01_witch_dining_car_buffet_first_look",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -15 },
          { type: "add_var", key: "witch_alcohol_aftertaste", value: 1 },
          { type: "set_flag", key: "flag_witch_drank_brandy_early", value: true },
          { type: "change_inner_voice_rank", voiceId: "inner_cynic", delta: 1 },
        ],
        inlineText:
          "**[Narrator]**:\nБренди обжигает горло. Давление под ребрами спадает так быстро, что это почти похоже на благодарность.\n\nПроклятие не исчезает. Оно просто получает другое имя на несколько минут. Когда вы выйдете в вагон-ресторан, голос будет ровнее — и чуть менее точен.",
        innerVoiceHints: [
          {
            voiceId: "inner_cynic",
            stance: "supports",
            text: "Лучше благопристойный ожог в горле, чем голодный взгляд на сына.",
          },
          {
            voiceId: "inner_guide",
            stance: "opposes",
            text: "Облегчение тоже оставляет след. Феликс знает ваш голос слишком хорошо.",
          },
        ],
      },
      {
        id: "WITCH_LETTER_AFTERTHOUGHT_COMPOSE",
        text: "[Composure] Сложить письмо и оставить руки на столе.",
        choiceSource: "voice",
        nextNodeId: "scene_case01_witch_dining_car_buffet_first_look",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "change_inner_voice_rank", voiceId: "inner_leader", delta: 1 },
        ],
        inlineText:
          "**[Narrator]**:\nВы складываете письмо по старым сгибам и кладете ладони рядом с ним. Пальцы хотят двинуться к фляжке или к печати. Вы не позволяете.\n\nНапряжение остается при вас. Зато в вагоне-ресторане Лотте увидит лицо, а не симптом.",
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "Удержанная реакция — тоже действие. Иногда самое дорогое.",
          },
          {
            voiceId: "inner_cynic",
            stance: "opposes",
            text: "Вы называете это выдержкой, потому что слово «голод» звучит грубо.",
          },
        ],
      }
    ],
  },
  {
    id: "scene_case01_witch_dining_car_buffet_first_look",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Буфетная стойка",
    bodyOverride:
      "**[Narrator]**:\nВагон-ресторан встречает вас звоном фарфора, мягким светом ламп и запахом вина, который притворяется лекарством лучше любого врача. У перегородки тянется узкая буфетная стойка: серебряный кофейник, стопка винных карт, бокалы, выстроенные с почти военной дисциплиной.\n\nУ стойки стоит рыжеволосая женщина в темно-зеленом деловом костюме. Шляпка сдвинута на волосок смелее, чем требует приличие; маленький блокнот лежит рядом с ее перчатками. Она говорит с официантом так легко, будто утро уже простило ей все задержки поездов.\n\n**[inner_guide]**:\nЖивое не всегда просит крови. Иногда оно просто стоит у стойки и спорит о сахаре.",
    backgroundUrl: CASE01_WITCH_LOTTE_BUFFET_COUNTER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "WITCH_LOTTE_COUNTER_OBSERVE",
        text: "Осмотреть женщину у буфетной стойки.",
        nextNodeId: "scene_case01_witch_lotte_counter_intro",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -5 },
          { type: "add_var", key: "lotte_warmth", value: 1 },
          { type: "set_flag", key: "flag_witch_lotte_first_seen", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nРыжие волосы выбиваются из-под зеленой шляпки так, будто утро заключило с ними отдельный договор. Костюм сидит строго, почти служебно, но сама женщина улыбается слишком легко для пассажирки, которая едет во Фрайбург в дождь.\n\nЭто мило. Непрактично, возможно. Но мило.\n\nНа одно дыхание Жажда теряет право быть единственным живым чувством в комнате."
      },
      {
        id: "WITCH_LOTTE_COUNTER_APPROACH",
        text: "Подойти к стойке сразу. Утро не станет легче от рассматривания чужой радости.",
        nextNodeId: "scene_case01_witch_lotte_counter_intro",
        effects: [
          { type: "change_inner_voice_rank", voiceId: "inner_leader", delta: 1 },
          { type: "set_flag", key: "flag_witch_lotte_approached_directly", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nВы идете к стойке, не позволяя взгляду задержаться дольше необходимого. Радость незнакомки остается на краю зрения: яркая, непрошеная, слишком бодрая для вашего тела.\n\nФорма прежде всего. Если утро хочет быть милым, пусть делает это без вашего участия."
      },
    ],
  },
  {
    id: "scene_case01_witch_lotte_counter_intro",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Фройляйн Вебер",
    bodyOverride:
      "**[Narrator]**:\nВинная карта лежит перед вами, как маленькое светское испытание. Бренди обещает короткое прощение тела. Белое вино обещает приличную причину держать бокал. Чай обещает только то, что тело будет злиться без свидетелей.\n\n**[inner_cynic]**:\nБренди. Не делайте из утренней боли философию.\n\n**[inner_leader]**:\nБелое вино. Рука на бокале выглядит лучше, чем рука на горле.\n\n**[inner_guide]**:\nЧай. Пусть тело злится. Оно сегодня не председательствует.\n\n**[Лотте]**:\n— Простите. Обычно люди так смотрят на винную карту, когда выбирают не напиток, а алиби. С вами все в порядке?",
    backgroundUrl: CASE01_WITCH_LOTTE_BUFFET_COUNTER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "WITCH_LOTTE_GREETING_COMPOSURE",
        text: "[Composure] Вы очень любезны, фройляйн. Со мной все в порядке.",
        choiceSource: "voice",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "lotte_usefulness", value: 1 },
          { type: "change_inner_voice_rank", voiceId: "inner_leader", delta: 1 },
          { type: "set_flag", key: "flag_witch_lotte_composure_intro", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Вы очень любезны, фройляйн. Со мной все в порядке.\n\n**[Лотте]**:\n— Тогда я сделаю вид, что поверила. Это тоже часть хорошего воспитания.\n\nОна чуть склоняет голову — быстро, светло, без жеманства.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка с дурной привычкой замечать, когда людям нехорошо.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Хороший дом. Туда новости приходят раньше газет. Сядем? За стойкой удобно только тем, кто собирается быстро исчезнуть."
      },
      {
        id: "WITCH_LOTTE_GREETING_HONEST",
        text: "[Honesty] Не совсем. Но я предпочла бы, чтобы это осталось маленьким утренним недоразумением.",
        choiceSource: "voice",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -5 },
          { type: "add_var", key: "lotte_warmth", value: 2 },
          { type: "set_flag", key: "flag_witch_lotte_honest_intro", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Не совсем. Но я предпочла бы, чтобы это осталось маленьким утренним недоразумением.\n\n**[Лотте]**:\n— Тогда начните с воды. Вино пусть подождет, пока недоразумение станет светским.\n\nОна чуть склоняет голову — быстро, светло, без жеманства.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка с дурной привычкой замечать, когда людям нехорошо.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Хороший дом. Там умеют хранить тишину. Иногда это почти забота. Сядем? Вода лучше действует, когда человек не стоит как обвиняемый."
      },
      {
        id: "WITCH_LOTTE_GREETING_SOCIAL",
        text: "[Social] Вы всегда спасаете незнакомок от винных карт?",
        choiceSource: "voice",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "lotte_warmth", value: 1 },
          { type: "set_flag", key: "flag_witch_lotte_social_intro", value: true },
          { type: "set_flag", key: "flag_witch_lotte_spark", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Вы всегда спасаете незнакомок от винных карт?\n\n**[Лотте]**:\n— Только тех, кто смотрит на карту так, будто собирается вызвать ее на дуэль.\n\nОна чуть склоняет голову — быстро, светло, без жеманства.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка с дурной привычкой вмешиваться до представления.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Хороший дом. Старый камень, тяжелые портьеры, гости, которым нравится, когда их не замечают. Выбрано со вкусом — кем бы ни было ваше письмо. Сядем?"
      },
      {
        id: "WITCH_LOTTE_GREETING_CYNIC",
        text: "[Cynic] Если женщина стоит у стойки утром, она либо путешествует, либо уже проиграла спор с собственным телом.",
        choiceSource: "voice",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "add_var", key: "lotte_usefulness", value: 1 },
          { type: "add_var", key: "lotte_suspicion", value: 1 },
          { type: "change_inner_voice_rank", voiceId: "inner_cynic", delta: 1 },
          { type: "set_flag", key: "flag_witch_lotte_cynic_intro", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Если женщина стоит у стойки утром, она либо путешествует, либо уже проиграла спор с собственным телом.\n\n**[Лотте]**:\n— Опасная формулировка. Почти газетная. Я бы сократила, но мысль оставила.\n\nОна чуть склоняет голову — быстро, светло, без жеманства.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка, которая тоже умеет сокращать чужие признания.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Интересный выбор. Не случайный, думаю. Но у случайностей во Фрайбурге дурная привычка: они всегда требуют столик. Сядем?"
      },
      {
        id: "WITCH_LOTTE_GREETING_AUTHORITY",
        text: "[Authority] Я не привыкла обсуждать свое состояние с незнакомыми людьми.",
        choiceSource: "voice",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "lotte_suspicion", value: 1 },
          { type: "set_flag", key: "flag_witch_lotte_authority_intro", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— Я не привыкла обсуждать свое состояние с незнакомыми людьми.\n\n**[Лотте]**:\n— Разумеется. Тогда исправим хотя бы часть ошибки.\n\nОна чуть склоняет голову — быстро, светло, без жеманства.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка, которая вмешалась прежде, чем получила право на беспокойство.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Интересный выбор. Очень хорошо защищает людей, которые предпочитают быть найденными только по собственной воле. Сядем?"
      },
      {
        id: "WITCH_LOTTE_GREETING_BLOOD_SENSE",
        text: "[Blood Sense] У вас очень живой голос.",
        choiceSource: "flaw",
        nextNodeId: "scene_case01_train_dining_car_intro_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -5 },
          { type: "add_var", key: "lotte_suspicion", value: 1 },
          { type: "set_flag", key: "flag_witch_lotte_blood_sense_intro", value: true },
          { type: "set_flag", key: "flag_witch_lotte_noticed_strangeness", value: true },
        ],
        inlineText:
          "**[Элеонора]**:\n— У вас очень живой голос.\n\n**[Лотте]**:\n— Это самый странный комплимент, который мне делали до завтрака. И, боюсь, не самый неточный.\n\nОна чуть склоняет голову — быстро, светло, без жеманства. Но теперь ее взгляд держится на вас на полсекунды дольше.\n\n**[Лотте]**:\n— Лотте Вебер. Телефонная служба Фрайбурга. Временно — пассажирка с голосом, который вы сочли живым.\n\n**[Элеонора]**:\n— Элеонора Хартманн.\n\n**[Лотте]**:\n— Если Фрайбург решит быть невежливым, где вас искать, фрау Хартманн?\n\n**[Элеонора]**:\n— В «Zum Goldenen Adler». Если письмо, которое привезло меня сюда, не решило солгать хотя бы в этой мелочи.\n\n**[Лотте]**:\n— Хороший дом. Там стены слушают лучше, чем говорят. Впрочем, в этом мы с ними, кажется, похожи. Сядем?"
      },
    ],
  },
  {
    id: "scene_case01_train_assistant_intro_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Сын",
    bodyOverride:
      "**[Narrator]**:\nФеликс остается у двери. Монета уже в жилетном кармане, но он не уходит: значит, извинение было только началом.\n\n**[Феликс]**:\n— Матушка, через несколько минут короткая остановка. Я выйду на платформу: газеты, телеграф, объявления Rathaus. Если город уже подал голос, это будет видно до Фрайбурга.\n\n**[Narrator]**:\nОн просит разрешения, глядя не на письмо на столике, а на вас.\n\n**[Элеонора]**:\n— Подойдите, Феликс. Развернитесь.",
    backgroundUrl: CASE01_WITCH_COIN_FLOOR_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_ASSISTANT_TO_COLLAR",
        text: "Continue.",
        nextNodeId: "scene_case01_train_collar_choice_witch",
      }
    ]
  },
  {
    id: "scene_case01_train_collar_choice_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Воротник",
    bodyOverride:
      "**[Narrator]**:\nОн повинуется сразу. Не из страха — из привычки, которую в вашем доме годами называли воспитанием.\n\nВаши пальцы оказываются у его воротника. Шерсть жесткая, влажная от утреннего тумана. Под ней — тепло живой кожи и короткий, сдержанный вдох.\n\nВаш ответ на упавшую монету уже стал правилом. Теперь решите, каким именно.",
    backgroundUrl: CASE01_WITCH_FELIX_COLLAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "WITCH_COLLAR_COMMAND",
        text: "Поправить воротник как приказ и отправить его только за конкретными сводками.",
        nextNodeId: "scene_case01_witch_felix_exit",
        requireAll: [
          { type: "flag_equals", key: "flag_witch_coin_rebuke", value: true },
        ],
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: -1 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: -10 },
          { type: "set_flag", key: "flag_witch_collar_command", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nВы разглаживаете воротник одним резким движением. Это не забота, а порядок.\n\n**[Элеонора]**:\n— Газеты, телеграф, Rathaus. Ничего лишнего. Если станция вздумает устроить беспорядок, вы возвращаетесь в поезд, не доказывая ей обратное.\n\n**[Narrator]**:\nФеликс кивает без спора. Вам становится легче: контроль тоже умеет снимать боль.\n\n**[Феликс]**:\n— Да, матушка. Я понял."
      },
      {
        id: "WITCH_COLLAR_DRY_JOKE",
        text: "Поправить воротник с сухой шуткой и отпустить его за новостями.",
        nextNodeId: "scene_case01_witch_felix_exit",
        requireAll: [
          { type: "flag_equals", key: "flag_witch_coin_joke", value: true },
        ],
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "set_flag", key: "flag_witch_collar_joke", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nВы поправляете воротник двумя пальцами, не задерживаясь у кожи дольше необходимого.\n\n**[Элеонора]**:\n— Если Rathaus уже объявил конец света, начните с воротника. Конец света не повод выглядеть неряшливо.\n\n**[Narrator]**:\nФеликс почти улыбается. Вы отпускаете его, но Жажда остается рядом, как третий пассажир в купе.\n\n**[Феликс]**:\n— Постараюсь встретить конец света прилично, матушка."
      },
      {
        id: "WITCH_COLLAR_RARE_TRUST",
        text: "Поправить воротник мягко и позволить ему действовать самостоятельно.",
        nextNodeId: "scene_case01_witch_felix_exit",
        requireAll: [
          { type: "flag_equals", key: "flag_witch_coin_soft", value: true },
        ],
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 2 },
          { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
          { type: "set_flag", key: "flag_witch_collar_trust", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nВы поправляете воротник аккуратно и убираете руку первой.\n\n**[Элеонора]**:\n— Хорошо. Проверьте газеты и сводки. Возвращайтесь не с тревогой, а с фактами.\n\n**[Narrator]**:\nСекунду Феликс ждет дополнительного приказа. Потом сам расправляет плечи. Движение крошечное, но в нем уже есть самостоятельность.\n\nЖажда недовольна вашей щедростью. Феликс — нет.\n\n**[Феликс]**:\n— Вернусь с фактами, матушка."
      }
    ]
  },
  {
    id: "scene_case01_witch_felix_exit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "До Фрайбурга",
    bodyOverride:
      "**[Narrator]**:\nПоезд сбрасывает ход у маленькой станции, где платформа мокрая, пустая и слишком ранняя для настоящих прощаний. Феликс выходит с поднятым воротником, держа шляпу низко от дождя.\n\nДверь купе закрывается тише, чем открывалась. После него остаются запах дождя на шерсти и маленькое серебряное эхо упавшей монеты.\n\nНа столике лежат письмо, фляжка и ваше отражение в темном стекле. Пока Феликс ищет газеты и сводки, Бюро ждет вашего внимания терпеливее любого сына.\n\n**[inner_guide]**:\nВы задали расстояние между вами. Теперь посмотрите, что осталось рядом.",
    backgroundUrl: CASE01_WITCH_COMPARTMENT_AFTER_FELIX_BG,
    narrativeLayout: "log",
    sceneGroupId: "witch_train_compartment",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_FELIX_EXIT_TO_LETTER",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter_witch",
      }
    ]
  },
  {
    id: "scene_case01_train_dining_car_intro_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Вагон-ресторан",
    bodyOverride:
      "**[Narrator]**:\nУгловой столик принимает вас с готовностью старого сообщника: свет мягче, люди заняты собой, а хорошее вино умеет объяснить многое. Лотте кладет перчатки рядом с маленьким дорожным блокнотом — не прячет, но и не оставляет без присмотра.\n\nОна рассказывает что-то быстро и с удовольствием, будто знакомство уже пережило первую неловкость и теперь может позволить себе легкомыслие.\n\n**[Лотте]**:\n— ...и этот чиновник всерьез грозился засудить телеграфную службу, потому что точки в его депеше показались ему «недостаточно почтительными». Это же просто смешно... Элеонора?",
    backgroundUrl: CASE01_WITCH_LOTTE_TABLE_FIRST_TALK_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "WITCH_LOTTE_INTRO_RATIONAL",
        text: "Ответить светской маской.",
        nextNodeId: "scene_case01_train_dining_car_lotte_monologue_witch",
        effects: [
          { type: "set_flag", key: "flag_witch_lotte_rational", value: true }
        ],
        inlineText:
          "**[Элеонора]**:\n— Паузы редко жалуются, дорогая Лотте. Иногда они просто дают Rathaus время сказать лишнее.\n\n**[Лотте]**:\n— Ты как всегда практична, Элеонора. Хотя подозрительно хорошо осведомлена для пассажирки, которой достался последний столик.\n\n**[Элеонора]**:\n— Во Фрайбурге случайности приходят вовремя.\n\n**[Narrator]**:\nВы улыбаетесь достаточно тепло. Под столом пальцы сжимают шелковый платок: холод еще не ушел."
      },
      {
        id: "WITCH_LOTTE_INTRO_SOMATIC",
        text: "[Veil Sight] Вслушаться в пульсацию крови Лотте и увести тему глубже.",
        nextNodeId: "scene_case01_train_dining_car_lotte_monologue_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -10 },
          { type: "set_flag", key: "flag_witch_lotte_somatic", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nНа миг вы слушаете не слова Лотте, а пульс под ее запястьем. Теплый, быстрый, слишком близкий. Холод в пальцах отступает на один вдох.\n\n**[Элеонора]**:\n— Паузы редко жалуются. Зато в них слышно, где город задержал дыхание.\n\n**[Лотте]**:\n— Ты сегодня особенно загадочна. Словно слышишь Фрайбург сквозь стены. И все же слишком хорошо осведомлена для простой пассажирки.\n\n**[Элеонора]**:\n— Во Фрайбурге случайности приходят вовремя."
      },
      {
        id: "WITCH_LOTTE_INTRO_MARRIAGE",
        text: "Оценить Лотте как потенциальную партию для Феликса.",
        nextNodeId: "scene_case01_train_dining_car_lotte_monologue_witch",
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "set_flag", key: "flag_witch_lotte_marriage_match", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nВы оцениваете Лотте почти против воли: быстрый смех, внимательные глаза, привычка замечать комнату целиком. Феликсу рядом с ней было бы труднее прятаться в послушании.\n\n**[Элеонора]**:\n— Паузы удобны. В них видно, кто спешит заполнить пустоту.\n\n**[Лотте]**:\n— Это ты о моем чиновнике? Или о Феликсе, который до сих пор прячется в коридоре?\n\n**[Элеонора]**:\n— Феликс не прячется. Он выбирает, когда войти. Но немного чужой смелости ему не повредит."
      }
    ]
  },
  {
    id: "scene_case01_train_dining_car_lotte_monologue_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Разговор с Лотте",
    bodyOverride:
      "**[Лотте]**:\n— Посмотри на них, Элеонора. Едут во Фрайбург: дождь, вокзальная еда, чьи-то письма в кармане. А сидят так, будто их обманули с программой спектакля. Ведь уже счастье — проснуться утром живой и куда-то ехать.\n\n**[Narrator]**:\nЛотте кивает на соседний столик, где пожилой господин в традиционном баденском платье смотрит в окно поверх нетронутого завтрака.\n\n**[Лотте]**:\n— Вот он, например. Может быть, ему сегодня впервые за месяц никто не мешает молчать. А он скучает. Я бы на его месте радовалась хотя бы тому, что сердце работает без приказа. Элеонора?",
    backgroundUrl: CASE01_WITCH_LOTTE_TABLE_LIFE_MONOLOGUE_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "WITCH_LOTTE_MONOLOGUE_CYNIC",
        text: "Ответить холодно: темнота хотя бы ничего не требует.",
        nextNodeId: "scene_case01_witch_lotte_monologue_cynic_reaction",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "add_var", key: "lotte_suspicion", value: 1 },
          {
            type: "set_flag",
            key: "flag_witch_lotte_monologue_cynic",
            value: true,
          },
        ],
        inlineText:
          "**[inner_cynic]**:\nОна говорит о жизни так, будто та никому не предъявляет счета. Удобная вера для тех, чья кровь остается на месте.\n\n**[Элеонора]**:\n— Темнота, по крайней мере, не требует благодарности. А жизнь, дорогая, каждый день присылает счет. Не сутулься, пожалуйста.\n\n**[Лотте]**:\n— Умеешь ты налить холодной воды в бокал. Но я все равно рада, что ты здесь.\n\n**[Narrator]**:\nЗа перегородкой щелкает динамик. Кондуктор объявляет: до Фрайбурга двадцать минут. В дверях вагона показывается Феликс, а за его плечом — высокий мужчина в дорожном пальто."
      },
      {
        id: "WITCH_LOTTE_MONOLOGUE_GRIEF",
        text: "Коснуться ее теплой руки, разделяя мгновение, но удерживая дистанцию.",
        nextNodeId: "scene_case01_witch_lotte_monologue_grief_reaction",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -10 },
          { type: "add_var", key: "lotte_warmth", value: 2 },
          {
            type: "set_flag",
            key: "flag_witch_lotte_monologue_grief",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nВы кладете холодные пальцы на ее руку. Тепло Лотте на мгновение возвращает тело на место. Вы вспоминаете мужа не как портрет, а как руку, которая однажды стала холодной в вашей. Потом аккуратно отнимаете ладонь.\n\n**[Элеонора]**:\n— Радость — редкая привычка, Лотте. Береги ее. И сядь ровнее, прошу.\n\n**[Лотте]**:\n— С тобой тепло даже тогда, когда ты делаешь вид, что это дурной тон.\n\n**[Narrator]**:\nРаздается свисток поезда. Кондуктор объявляет скорое прибытие. Дверь вагона-ресторана открывается, и Феликс заходит внутрь, ведя за собой высокого мужчину в дорожном пальто."
      },
      {
        id: "WITCH_LOTTE_MONOLOGUE_PRACTICAL",
        text: "Осадить ее юношеский идеализм практическим замечанием.",
        nextNodeId: "scene_case01_witch_lotte_monologue_practical_reaction",
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_felix_hartmann",
            delta: 1,
          },
          { type: "add_var", key: "lotte_usefulness", value: 1 },
          {
            type: "set_flag",
            key: "flag_witch_lotte_monologue_practical",
            value: true,
          },
        ],
        inlineText:
          "**[Narrator]**:\nВы смотрите на пожилого господина: потертые манжеты, скомканная газета, завтрак, к которому он почти не притронулся.\n\n**[Элеонора]**:\n— Он, возможно, думает о счете за зерно или о письме от врача. Взрослая жизнь редко похожа на гимн, Лотте. И сядь ровнее.\n\n**[Лотте]**:\n— Твои счета победят любую метафизику.\n\n**[Narrator]**:\nКолеса поезда замедляются на стрелках. Кондуктор объявляет о скором прибытии во Фрайбург. В проеме вагона-ресторана появляется Феликс, сопровождаемый высоким господином с внимательным взглядом."
      }
    ]
  },
  {
    id: "scene_case01_witch_lotte_monologue_cynic_reaction",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Записная книжка",
    bodyOverride:
      "**[Narrator]**:\nЛотте опускает взгляд к блокноту. Она не пишет вашего имени; это было бы слишком грубо. Но карандаш ложится между пальцами так естественно, будто всякая улыбка имеет право на полях оставить маленькую помету.\n\n**[inner_cynic]**:\nРадость не мешает ей считать. Это полезно помнить.",
    backgroundUrl: CASE01_WITCH_LOTTE_NOTEBOOK_SUSPICION_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_LOTTE_CYNIC_REACTION",
        text: "Continue.",
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: "scene_case01_witch_lotte_monologue_grief_reaction",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Теплая рука",
    bodyOverride:
      "**[Narrator]**:\nНа мгновение все в вагоне становится проще: дождь за стеклом, фарфор на скатерти, чужое тепло под вашей перчаткой. Лотте не отнимает руку и не требует объяснения.\n\n**[inner_guide]**:\nИногда милость выглядит как человек, который умеет не задавать следующий вопрос.",
    backgroundUrl: CASE01_WITCH_LOTTE_WARM_HAND_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_LOTTE_GRIEF_REACTION",
        text: "Continue.",
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: "scene_case01_witch_lotte_monologue_practical_reaction",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Дверь вагона",
    bodyOverride:
      "**[Narrator]**:\nДверь вагона-ресторана открывается как раз тогда, когда разговор нашел удобную маску. Феликс входит первым, слишком прямо держа плечи. За ним появляется высокий господин в дорожном пальто и с внимательным взглядом.\n\n**[inner_leader]**:\nПрибытие редко приходит одно. Оно приводит свидетелей.",
    backgroundUrl: CASE01_WITCH_LOTTE_FELIX_INTERRUPT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_LOTTE_PRACTICAL_REACTION",
        text: "Continue.",
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: "scene_case01_train_assistant_intro",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nДверь в купе открывается со скрипом, и в проеме возникает высокая фигура с выдающимися скулами, из-за которых вошедший казался намного старше своих лет.\n\n**[Assistant]**:\n— Сэр, я проверил во время остановки: в газетах пусто, по радио тоже тишина.\n\n**[inner_cynic]**:\nТишина — это не отсутствие звука. Это присутствие чьей-то очень дорогой воли.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ASSISTANT_INTRO",
        text: "Continue.",
        nextNodeId: "scene_case01_train_door_creaks",
      },
    ],
  },
  {
    id: "scene_case01_train_door_creaks",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Вы уверены, что это не розыгрыш?",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_LOGIC",
        text: "Письмо доставлено частной службой, бумага и чернила стоят недешево. Розыгрыш обошелся бы слишком дорого.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Вы правы, сэр. Не стали бы они арендовать нам номер просто так.",
        effects: [
          { type: "add_var", key: "attr_logic", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_analyst",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_analyst",
            stance: "supports",
            text: "Холодный расчет прежде всего."
          }
        ]
      },
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_AUTHORITY",
        text: "Не имеет значения, розыгрыш это или нет. Нам бросили вызов, и мы не имеем права его игнорировать.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Полностью согласен, сэр. Мы не можем оставить это без внимания.",
        effects: [
          { type: "add_var", key: "attr_authority", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_leader",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "Дисциплина и долг не терпят сомнений."
          }
        ]
      },
      {
        id: "CASE01_TRAIN_DOOR_CREAKS_INTUITION",
        text: "Что-то мне подсказывает, что за этим письмом кроется нечто гораздо большее, чем кажется на первый взгляд.",
        nextNodeId: "scene_case01_train_assistant_departure",
        inlineText: "**[Assistant]**:\n— Ваше чутье вас редко подводит, сэр. Будем настороже.",
        effects: [
          { type: "add_var", key: "attr_intuition", value: 1 },
          {
            type: "change_inner_voice_rank",
            voiceId: "inner_guide",
            delta: 1,
          },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_guide",
            stance: "supports",
            text: "Слушай свой внутренний голос. Здесь скрыта тайна."
          }
        ]
      }
    ],
  },
  {
    id: "scene_case01_train_assistant_departure",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Мы скоро прибудем на место. Я схожу в вагон-ресторан за матушкой.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_TRAIN_ASSISTANT_LEADER_COMMITMENT",
        text: "Give Felix a clear order: keep the compartment together until Freiburg.",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        visibleIfAll: [
          { type: "inner_voice_rank_gte", voiceId: "inner_leader", value: 1 },
        ],
        innerVoiceHints: [
          {
            voiceId: "inner_leader",
            stance: "supports",
            text: "A group survives the crossing when someone accepts command.",
          },
          {
            voiceId: "inner_cynic",
            stance: "opposes",
            text: "Authority makes you visible before the city has shown its teeth.",
          },
        ],
        effects: [
          {
            type: "discover_fact",
            caseId: "case_bankhaus_krebs_false_trail",
            factId: "fact_inner_leader_route_committed",
          },
          {
            type: "track_event",
            eventName: "inner_leader_train_commitment",
            tags: { voiceId: "inner_leader" },
          },
        ],
      },
      {
        id: "CASE01_TRAIN_ASSISTANT_EAT_TOGETHER",
        text: "Wait for me! I've worked up an appetite - I need a bite to eat.",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_felix_hartmann",
            delta: 1,
          },
        ],
      },
      {
        id: "CASE01_TRAIN_ASSISTANT_MEET_LATER",
        text: "Say nothing",
        nextNodeId: "scene_case01_train_silent_beat",
      },
    ],
  },
  {
    id: "scene_case01_train_silent_beat",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      "**[Narrator]**:\nA short nod. The door slams shut. The rest of the journey you spend in the company of the letter and your growing distrust.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_SILENT_BEAT",
        text: "Continue.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.intro,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      `**[Narrator]**:
Вагон-ресторан встречает вас звоном хрусталя, дорогим табаком и тем особенным утренним светом, в котором случайности выглядят почти прилично. У окна остается один свободный столик, хотя свободным он, кажется, был оставлен заранее.

**[Assistant]**:
— Матушка всегда находит компанию, даже в поезде. Если она уже выбрала вино, значит разговор начался до нашего прихода. Постарайтесь быть... снисходительны к ее прямоте.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_INTRO",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.mother,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.mother,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Narrator]**:
За угловым столиком сидит Элеонора Хартманн. Перед ней белое вино, раскрытая карточка вин и рыжеволосая спутница, чьи перчатки лежат не на коленях, а рядом с маленьким блокнотом. В блокноте нет сплетен: только 08:12, 08:27, 08:41 и одна строка, зачеркнутая так ровно, будто отмененный маршрут тоже можно убрать с лица города.

**[Лотте]**:
— ...и этот чиновник всерьез грозился засудить телеграфную службу, потому что точки в его депеше показались ему «недостаточно почтительными». Я сказала, что паузы, к сожалению, не принимают жалоб.

**[Элеонора]**:
— Паузы вообще редко принимают жалобы. Зато иногда говорят больше слов, особенно если слово проходит через Rathaus раньше объявления.

**[Лотте]**:
— Вы удивительно хорошо осведомлены для пассажирки, которой случайно достался последний столик.

**[Элеонора]**:
— Во Фрайбурге случайности тоже резервируют заранее.

**[Assistant]**:
— Матушка, мы решили выпить перед прибытием. Не представите нас вашей спутнице?`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    onEnter: [
      { type: "set_flag", key: CASE01_DINING_FLAGS.metMother, value: true },
      { type: "set_flag", key: CASE01_DINING_FLAGS.metFelix, value: true },
      { type: "set_flag", key: CASE01_DINING_FLAGS.metRedhead, value: true },
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_CAR_MOTHER",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.marriageJoke,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.marriageJoke,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Элеонора]**:
— Разумеется. Лотте Вебер. О Фрайбурге она знает улицы, людей и такие двери, которые приличные дома предпочитают не замечать. Еще говорят, она помнит не слова, а паузы между звонками, что гораздо опаснее. А это — мой сын Феликс Хартманн. Он смотрит в окно, когда хочет, чтобы разговор обошелся без него.

**[Лотте]**:
— Элеонора делает из меня почти учреждение. На самом деле я всего лишь берегу источники лучше, чем продаю сведения. Это, как выяснилось, редкая городская привычка.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_STARE_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "CASE01_TRAIN_DINING_SILENT",
        text: "Stay silent",
        nextNodeId: CASE01_DINING_NODE_IDS.silentBranch,
      },
      {
        id: "CASE01_TRAIN_DINING_INTRO_SELF",
        text: "Introduce yourself",
        nextNodeId: CASE01_DINING_NODE_IDS.introSelfBranch,
      },
      {
        id: "CASE01_TRAIN_DINING_HOTEL",
        text: "Pardon the interruption - since you know the city so well, have you heard of the Zum Goldenen Adler hotel?",
        nextNodeId: CASE01_DINING_NODE_IDS.hotelBranch,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.silentBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Assistant]**:
— Извините. Это детектив [Name]. Он помогает нам с переездом.

**[Narrator]**:
Феликс произносит «нам» без всякого тепла, но вовремя: неловкость успевает стать его, а не вашей.

**[Лотте]**:
— Тогда будем знакомы. Люди, которые умеют молчать за столом, во Фрайбурге долго не останутся незамеченными. Иногда именно они первыми слышат, где провод дрожит.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_SILENT",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.introSelfBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Detective]**:
— Разрешите представиться. Детектив [Name]. Прибыл во Фрайбург по делу.

**[Narrator]**:
Элеонора повторяет ваше имя беззвучно, одними губами, будто примеряет его к будущей карточке на столе.

**[Лотте]**:
— Лотте Вебер. Рада встрече, детектив. По делу — тоже, раз уж оно привело вас в наш вагон. У дел есть привычка приходить раньше официальных писем.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_INTRO_SELF",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.introducedSelf,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.hotelBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Лотте]**:
— «Zum Goldenen Adler»? Хороший выбор. Старый камень, тяжелые портьеры, постояльцы, которым нравится, когда их не замечают.

**[Narrator]**:
Она произносит название без вопроса. Не вспоминает — сверяет. Элеонора чуть заметно улыбается: для нее это не фокус, а подтверждение, что нужный человек сел за нужный столик.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    choices: [
      {
        id: "AUTO_CONTINUE_DINING_HOTEL",
        text: "Continue.",
        nextNodeId: CASE01_DINING_NODE_IDS.wineBeat,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.askedLodgingRoute,
            value: true,
          },
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.wineBeat,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Элеонора]**:
— Попробуйте. Маркграфлерланд.

**[Narrator]**:
Официант берет бутылку за основание, оставляет этикетку на виду и льет медленно, тонкой ровной струйкой. В конце бутылка едва поворачивается, и скатерть остается чистой.

**[Лотте]**:
— Деньги мне не нужны, если вы к этому ведете.

**[Элеонора]**:
— Нет. Деньги покупают сведения. Мне интереснее люди, которые умеют не выдавать источник. Иногда им требуется не плата, а прикрытие.

**[Лотте]**:
— А вам — предупреждение, если городская сеть начнет шевелиться вокруг Феликса.

**[Элеонора]**:
— Вот теперь это почти похоже на разговор.

**[inner_tradition]**:
Официант не спрашивает. Он знает, в чей бокал лить первым.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_WINE_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    passiveChecks: [
      {
        id: "check_case01_wine_perception",
        voiceId: "attr_perception",
        difficulty: 8,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 5 },
            { type: "set_flag", key: CASE01_DINING_FLAGS.noticedRingRemoved, value: true },
          ],
          inlineText:
            "**[Perception — Успех]**:\nЕё пальцы — ухоженные, но не праздные. На безымянном — след от кольца, снятого недавно. Она привыкла управлять тем, что видят другие.",
        },
      },
    ],
    choices: [
      {
        id: "CASE01_WINE_ACCEPT",
        text: "Принять бокал.",
        nextNodeId: CASE01_DINING_NODE_IDS.felixInterrupts,
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.jokedWithMother, value: true },
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_WINE_DECLINE",
        text: "Вежливо отклониться.",
        nextNodeId: CASE01_DINING_NODE_IDS.felixInterrupts,
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.declinedEleonoraHospitality,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.felixInterrupts,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Лотте]**:
— Некоторые люди узнали о банковском кризисе раньше, чем должны были. Не из газет. Не из банка. По паузам в чужих звонках.

**[Элеонора]**:
— Во Фрайбурге раннее знание почти всегда означает долг.

**[Narrator]**:
Лотте почти спрашивает, знает ли сам Феликс, зачем мать привезла его во Фрайбург. В этот момент за перегородкой щелкает микрофон.

**[Assistant]**:
— Двадцать минут. Пора убирать.

**[Narrator]**:
Элеонора смотрит на сына поверх бокала. Не спорит.

**[Элеонора]**:
— Хорошо. Убирайте.

**[Narrator]**:
Лотте закрывает блокнот синхронно с объявлением — ни секундой раньше, ни секундой позже. На верхней странице успевает мелькнуть не фраза, а дисциплина: 08:12, 08:27, 08:41.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_FELIX_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_felix_hartmann",
    passiveChecks: [
      {
        id: "check_case01_felix_empathy",
        voiceId: "attr_empathy",
        difficulty: 11,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 5 },
            { type: "set_flag", key: CASE01_DINING_FLAGS.noticedFelixApathy, value: true },
          ],
          inlineText:
            "**[Empathy — Успех]**:\nОн не раздражён. Он устал. Устал быть представленным как приложение к матери. Взгляд на часы — не нетерпение, а единственный приличный способ прервать разговор, который за него уже ведут.",
        },
      },
    ],
    choices: [
      {
        id: "CASE01_FELIX_DEFEND",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_NODE_IDS.eleonoraFarewell,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.silentObservation,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
              value: true,
            },
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_DEFEND_SILENT",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.silentDefend,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_DEFEND_HOTEL",
        text: "Поддержать паузу и помочь свернуть разговор.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.hotelDefend,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
        effects: [
          { type: "set_flag", key: CASE01_DINING_FLAGS.defendedFelix, value: true },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.introObserve,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.silentObservation,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
              value: true,
            },
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE_SILENT",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.silentObserve,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_FELIX_OBSERVE_HOTEL",
        text: "Проследить, что именно убирает Лотте.",
        nextNodeId: CASE01_DINING_FAREWELL_NODE_IDS.hotelObserve,
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedZumGoldenenAdler,
            value: true,
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.eleonoraFarewell,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Narrator]**:
Она поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи, [Name]. Фрайбург маленький — а имена в нем ходят быстрее людей.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.silentDefend,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      `**[Narrator]**:
Она поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_SILENT_DEFEND",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_silent_defend",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.hotelDefend,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      `**[Narrator]**:
Она поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи, детектив. «Zum Goldenen Adler» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_HOTEL_DEFEND",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_hotel_defend",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.introObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride:
      `**[Narrator]**:
Вы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Рядом с 08:27 тонко приписано «Bankhaus/Rathaus»; нижняя строка зачеркнута так ровно, будто это не пометка, а отмененный маршрут.

Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи, [Name]. Фрайбург маленький — а имена в нем ходят быстрее людей.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_INTRO_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_intro_observe",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.silentObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Narrator]**:
Вы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Рядом с 08:27 тонко приписано «Bankhaus/Rathaus»; нижняя строка зачеркнута так ровно, будто это не пометка, а отмененный маршрут.

Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_SILENT_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_silent_observe",
      },
    ],
  },
  {
    id: CASE01_DINING_FAREWELL_NODE_IDS.hotelObserve,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: `**[Narrator]**:
Вы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Рядом с 08:27 тонко приписано «Bankhaus/Rathaus»; ниже стоит «Zum Goldenen Adler» и ваше имя, еще без титула.

Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолетно, будто поправляя воротник, но взгляд ее остается на Лотте.

**[Лотте]**:
— До встречи, детектив. «Zum Goldenen Adler» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.

**[Narrator]**:
Договор не произнесен вслух: Лотте получает обещание прикрытия, если проводная сеть станет опасной для ее источников; Элеонора получает право быть предупрежденной, если эта сеть шевельнется вокруг Феликса.

**[Элеонора]**:
— Фрайбург нас ждет. Впрочем, Фрайбург всегда ждет.`,
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "npc_mother_hartmann",
    choices: [
      {
        id: "AUTO_CONTINUE_ELEONORA_FAREWELL_HOTEL_OBSERVE",
        text: "Continue.",
        nextNodeId: "scene_case01_corridor_reflection_hotel_observe",
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nВ купе тихо. Только ритм рельсов и мысли, которые ещё не оформились в вопросы.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_silent_defend",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nФеликс не поблагодарил. Но он заметил — это видно по тому, как он НЕ посмотрел в вашу сторону при прощании. Молчание тоже разведка. Они говорили — вы слушали. Теперь вопрос: что из услышанного пригодится.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_SILENT_DEFEND",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_hotel_defend",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nФеликс не поблагодарил. Но он заметил — это видно по тому, как он НЕ посмотрел в вашу сторону при прощании.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_HOTEL_DEFEND",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_intro_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nУсталость Феликса бросалась в глаза. Двадцать минут до Фрайбурга — и он считает каждую.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_INTRO_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_silent_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nМолчание тоже разведка. Они говорили — вы слушали. Теперь вопрос: что из услышанного пригодится.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_SILENT_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },
  {
    id: "scene_case01_corridor_reflection_hotel_observe",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor Reflection",
    bodyOverride:
      "**[Narrator]**:\nВ купе тихо. Только ритм рельсов и мысли о гостинице «Zum Goldenen Adler», которая вас ожидает.\n\n**[inner_intuition]**:\nТри попутчика. Один обед. Достаточно ли этого, чтобы понять — стоит ли им доверять? Или правильнее — стоит ли, чтобы они начали доверять вам?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_CORRIDOR_REFLECTION_HOTEL_OBSERVE",
        text: "Поезд замедляется.",
        nextNodeId: CASE01_TRAIN_HUB_NODE_ID,
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
    ],
  },

  {
    id: CASE01_TRAIN_HUB_NODE_ID,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Train Map",
    bodyOverride:
      "**[Narrator]**:\nThe train sways underfoot. Fog gathers against the windows, and Freiburg is close enough now to feel like a decision rather than a destination.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "log",
    interactionMode: "hub",
    hubPresentation: "inline_panel",
    sceneGroupId: "train_corridor",
    hubSchema: trainHubSchema,
    choices: [
      {
        id: "hub_to_compartment_revisit",
        text: "Return to the compartment",
        nextNodeId: "scene_case01_train_compartment_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.compartment,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
      },
      {
        id: "hub_to_corridor_revisit",
        text: "Step into the corridor",
        nextNodeId: "scene_case01_train_corridor_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.corridor,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
      },
      {
        id: "hub_to_dining_first_visit",
        text: "Find Felix in the dining car",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.metMother,
              value: true,
            },
          },
        ],
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
          priority: 20,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
      },
      {
        id: "hub_to_dining_revisit",
        text: "Look back into the dining car",
        nextNodeId: "scene_case01_train_dining_car_revisit",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.metMother,
            value: true,
          },
        ],
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.diningCar,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
      },
      {
        id: "hub_to_vestibule_revisit",
        text: "Check the vestibule",
        nextNodeId: "scene_case01_train_vestibule_revisit",
        hotspot: {
          zoneId: CASE01_TRAIN_HUB_ZONE_IDS.vestibule,
          priority: 10,
        },
        effects: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.vestibule)],
      },
      {
        id: "hub_continue_to_arrival",
        text: "Prepare for arrival",
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: "scene_case01_train_compartment_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Compartment",
    bodyOverride:
      "**[Narrator]**:\nYour compartment is quiet again. The letter waits where you left it, folded with bureaucratic precision.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_compartment",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.compartment)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_corridor_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Corridor",
    bodyOverride:
      "**[Narrator]**:\nThe corridor narrows each passing thought. Beyond the glass, the countryside blurs into grey-green lines.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_corridor",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.corridor)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_dining_car_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Dining Car",
    bodyOverride:
      "**[Narrator]**:\nThe dining car has settled into polite aftermath: cooling cups, folded napkins, and the trace of a conversation that ended too neatly.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.diningCar)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_vestibule_revisit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Vestibule",
    bodyOverride:
      "**[Narrator]**:\nCold air leaks around the carriage door. The metal handle trembles with every turn of the wheels.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_vestibule",
    onEnter: [trainHubZoneEffect(CASE01_TRAIN_HUB_ZONE_IDS.vestibule)],
    choices: [{ ...returnToTrainHubChoice }],
  },
  {
    id: "scene_case01_train_ankommen_video",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Approach to Freiburg",
    bodyOverride: "",
    backgroundVideoUrl: `${CASE01_START_VIDEO_BASE_PATH}/Ankommen.mp4`,
    backgroundVideoPosterUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "fullscreen",
    sceneGroupId: "train_ankommen_video",
    advanceOnVideoEnd: true,
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_ANKOMMEN_VIDEO",
        text: "Continue.",
        nextNodeId: "scene_case01_train_voza_cutscene",
      },
    ],
  },
  {
    id: "scene_case01_train_voza_cutscene",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Platform Landing",
    bodyOverride:
      "**[Narrator]**:\nПар бьёт в лицо — отдых кончился. Вокзал грубый: чугунные балки, стекло в копоти, носильщики с тележками; пахнет углём и мокрой шерстью.\n\nЧасы над перроном показывают 08:47. Город уже на ногах — и не обязан был подстраиваться под ваше пробуждение.\n\n**[attr_encyclopedia]**:\nНеоренессанс. Построено при расширении Баденских железных дорог. Базель в часе пути, Страсбург — в двух. Для контрабанды и побегов — идеальный узел.",
    backgroundVideoUrl: `${CASE01_START_VIDEO_BASE_PATH}/Video_voza_na_peronu.mp4`,
    backgroundVideoPosterUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_platform_landing",
    passiveChecks: [
      {
        id: "check_voza_spot_fritz",
        voiceId: "attr_perception",
        difficulty: 6,
        showChancePercent: false,
        isPassive: true,
        onSuccess: {
          effects: [
            { type: "grant_xp", amount: 3 },
            { type: "set_flag", key: "flag_spotted_fritz_early", value: true },
          ],
          inlineText:
            "**[Perception — Успех]:**\nВ толпе — форма. Не железнодорожная: полицейская. Кто-то ждёт, и ждёт именно вас. Рука в кармане, взгляд по перрону — ищет не вагон, а лицо.",
        },
      }
    ],
    choices: [
      {
        id: "CHOICE_VOZA_TO_HBF_DETECTIVE",
        text: "Сойти на платформу.",
        nextNodeId: "scene_case01_hbf_porter_greeting",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true
            }
          }
        ]
      },
      {
        id: "CHOICE_VOZA_TO_HBF_WITCH_LOTTE_GOODBYE",
        text: "Сойти на платформу.",
        nextNodeId: "scene_case01_witch_lotte_goodbye_platform",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
          {
            type: "flag_equals",
            key: "flag_witch_lotte_monologue_grief",
            value: true,
          },
        ],
      },
      {
        id: "CHOICE_VOZA_TO_HBF_WITCH",
        text: "Сойти на платформу.",
        nextNodeId: "scene_case01_hbf_luggage_incident_witch",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: "origin_witch",
            value: true
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "flag_witch_lotte_monologue_grief",
              value: true,
            },
          },
        ],
      }
    ],
  },
  {
    id: "scene_case01_witch_lotte_goodbye_platform",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Прояснение",
    bodyOverride:
      "**[Narrator]**:\nФрайбург встречает не дождем, а его окончанием. Вода еще стекает с ребер стеклянной крыши, перрон блестит черным серебром, но над вокзалом уже светлеет небо. Первые лучи восходящего солнца осторожно ложатся на пар, мокрые камни и края чемоданов.\n\nДетектив и Феликс уже попрощались: детектив вернулся в вагон за вещами, а Феликс, задержавшись у вас только на один поклон, сказал, что пойдет искать Сашу, семейного носильщика.\n\n**[Феликс]**:\n— Матушка, встретимся у стойки выдачи багажа.\n\nОн уходит в сторону багажных тележек, слишком прямо держа плечи. На мгновение рядом остается только Лотте, утренний свет и то странное облегчение, которое появляется, когда разговор заканчивается раньше, чем успел солгать.\n\n**[Лотте]**:\n— Вот и все. Дождь кончился, а я почти не успела сказать, что рада знакомству.\n\n**[Элеонора]**:\n— Вы уже сказали. В вагоне-ресторане это прозвучало достаточно ясно.\n\n**[Лотте]**:\n— Тогда скажу тише. Если «Zum Goldenen Adler» окажется слишком молчаливым, на телефонной станции иногда есть свободный стул и кофе, который можно пить только из уважения к службе.\n\n**[Элеонора]**:\n— А если Фрайбург окажется слишком разговорчивым?\n\n**[Лотте]**:\n— Тогда я услышу первой. И, возможно, не запишу всего, что не следует.\n\n**[Narrator]**:\nОна улыбается без легкомыслия. Вы не обнимаетесь; это было бы слишком просто и слишком заметно. Но когда Лотте делает шаг назад, утро не становится холоднее.\n\n**[Элеонора]**:\n— Берегите свою радость, Лотте.\n\n**[Лотте]**:\n— А вы — себя, Элеонора. У вас это получается хуже, чем держать осанку.",
    backgroundUrl: CASE01_WITCH_LOTTE_GOODBYE_SUNRISE_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_LOTTE_GOODBYE_PLATFORM",
        text: "Continue.",
        nextNodeId: "scene_case01_hbf_luggage_incident_witch",
        effects: [
          { type: "add_var", key: "lotte_warmth", value: 1 },
          {
            type: "set_flag",
            key: "flag_witch_lotte_good_parting",
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_hbf_porter_greeting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "The Porter",
    bodyOverride: "",
    backgroundUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    choices: [
      {
        id: "CHOICE_PORTER_HOSPITALITY",
        text: "Continue.",
        nextNodeId: "scene_case01_train_disembark_journal",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          }
        ],
        inlineText: "**[Носильщик]**:\n— Добро пожаловать во Фрайбург, господин. Экипаж госпожи Хартманн ожидает у южного выхода. Позвольте ваш багаж?\n\n**[Narrator]**:\nОн кланяется — не глубоко, но с той профессиональной точностью, которая выдаёт привычку обслуживать тех, кто платит золотом."
      },
      {
        id: "CHOICE_PORTER_DEFAULT",
        text: "Continue.",
        nextNodeId: "scene_case01_train_disembark_journal",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
              value: true,
            }
          }
        ],
        inlineText: "**[Носильщик]**:\n— Извозчики слева, господин. Не задерживайте проход.\n\n**[Narrator]**:\nОн проходит мимо, даже не взглянув на вас. Во Фрайбурге уважение — это валюта, которую вы ещё не заработали."
      }
    ]
  },
  {
    id: "scene_case01_train_disembark_journal",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "On the platform",
    bodyOverride:
      "The platform receives you like a room that was warned in advance.\n\nOne part of your mind starts counting exits, uniforms, luggage carts, the honest geometry of escape. Another part notices the silence first: no public outrage, no raised voices, no appetite for scandal. Freiburg has decided to keep its pulse hidden.\n\nA third, less useful but never absent, whispers that the city already knows your name and resents you for arriving late.\n\nGood. Let it resent. Silence is still testimony, if you stand inside it long enough.",
    backgroundUrl: CASE01_PLATFORM_STILL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    characterId: "inspector",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_DISEMBARK_JOURNAL",
        text: "Continue.",
        nextNodeId: "scene_case01_train_platform_parting",
      },
    ],
  },
  {
    id: "scene_case01_train_platform_parting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Parting",
    bodyOverride: "**[Элеонора]**:\n— Что ж, Феликс. Фрайбург не терпит опозданий. Детектив, присмотрите за ним. Он склонен теряться в… деталях, забывая о главном.\n\n**[Лотте]**:\n— На перроне лучше не останавливаться, детектив. Здесь даже прощания занимают очередь.\n\n**[Narrator]**:\nОни уходят в толпу — Элеонора и Лотте, плечом к плечу, негромко разговаривая. Рыжие волосы Лотте — последнее яркое пятно в сером паре перрона. За ними остаётся запах дорогого табака и след невысказанных обещаний.",
    backgroundUrl: CASE01_PLATFORM_FAREWELL_BG,
    narrativeLayout: "log",
    sceneGroupId: "platform_disembark",
    choices: [
      {
        id: "CHOICE_PARTING_INTRO_SELF_ECHO",
        text: "Continue.",
        nextNodeId: "scene_case01_hbf_echo_intro_self",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.introducedSelf,
            value: true,
          },
        ],
      },
      {
        id: "CHOICE_PARTING_ACCEPTED_HOSPITALITY_ECHO",
        text: "Continue.",
        nextNodeId: "scene_case01_hbf_echo_hospitality_accepted",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
            value: true,
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.introducedSelf,
              value: true,
            },
          },
        ],
      },
      {
        id: "CHOICE_PARTING_SECRET",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.introducedSelf,
              value: true,
            },
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
              value: true,
            },
          },
          {
            type: "logic_or",
            conditions: [
              {
                type: "flag_equals",
                key: CASE01_DINING_FLAGS.jokedWithMother,
                value: true,
              },
              {
                type: "flag_equals",
                key: CASE01_DINING_FLAGS.silentObservation,
                value: true,
              },
            ],
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "mother_redhead_secret_potential",
            value: true,
          },
        ],
      },
      {
        id: "CHOICE_PARTING_NORMAL",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "logic_or",
              conditions: [
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.jokedWithMother,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.silentObservation,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.introducedSelf,
                  value: true,
                },
                {
                  type: "flag_equals",
                  key: CASE01_DINING_FLAGS.acceptedEleonoraHospitality,
                  value: true,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_hbf_echo_intro_self",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Name in Circulation",
    bodyOverride:
      "A porter checks a card before you can give your name. He does not greet you as a stranger; he makes room as if the station has already been told where to place you.\n\nIt is useful, in the way a locked door is useful when someone else holds the key.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_HBF_ECHO_INTRO_SELF",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_echo_hospitality_accepted",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Hartmann Courtesy",
    bodyOverride:
      "A porter tips his cap before you ask for help. 'The Hartmann party has already passed word,' he says, and lifts your bag with the care reserved for property that belongs near influence.\n\nThe courtesy saves a minute. It also tells you whose shadow reached the platform first.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_HBF_ECHO_HOSPITALITY_ACCEPTED",
        text: "Continue.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_beat1_atmosphere",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Hauptbahnhof, Freiburg",
    bodyOverride:
      "Steam folds around the iron columns and the first rush of arriving passengers. A boy with newspapers cuts between trunks like a thought no one can pin down. Somewhere farther down the platform, metal tags knock softly against a luggage grille, and beyond that a police post studies the crowd with professional boredom.\n\nFreiburg has not greeted you. It has merely failed to hide.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "CASE01_BEAT1_NEWSBOY",
        text: "Speak to the newspaper boy.",
        nextNodeId: "scene_case01_hbf_newsboy_approach",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: "freiburg_case01_mainline_active",
            value: true,
          },
        ],
      },
      {
        id: "CASE01_BEAT1_LUGGAGE",
        text: "Go to the luggage counter.",
        nextNodeId: "scene_case01_hbf_luggage",
      },
      {
        id: "CASE01_BEAT1_POLICE",
        text: "Approach the railway police post.",
        nextNodeId: "scene_case01_hbf_police",
      },
      {
        id: "CASE01_BEAT1_EXIT_NON_WITCH",
        text: "Step out into the city.",
        nextNodeId: "scene_case01_hbf_departure",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true,
            },
          },
        ],
      },
      {
        id: "CASE01_BEAT1_EXIT_WITCH",
        text: "Step out into the city.",
        nextNodeId: "scene_case01_hbf_luggage_incident_witch",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: "origin_witch",
            value: true,
          },
        ],
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_approach",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Evening edition",
    bodyOverride: "The boy is nervous. He grips the thin, hurried evening edition like a shield. You notice the bank's name -- Bankhaus J.A. Krebs -- in the headlines. It's too early for official news, too specific for rumor.\n\nSomeone wanted this story told before the dust even settled.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_INVESTIGATE",
        text: "Try to get a closer look at the boy's behavior.",
        nextNodeId: "scene_case01_hbf_newsboy_handoff",
        passiveChecks: [
          {
            id: "check_newsboy_nerves",
            voiceId: "attr_perception",
            difficulty: 8,
            isPassive: true,
            onSuccess: {
              effects: [{ type: "grant_xp", amount: 5 }],
            },
          },
        ],
      },
      {
        id: "CASE01_NEWSBOY_RELEASE",
        text: "Just buy a paper and move on.",
        nextNodeId: "scene_case01_hbf_newsboy_release",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_handoff",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "As you reach for a paper, the boy's hand trembles. He's not just selling news; he's watching for someone. Felix leans in, a silent shadow that makes the boy stiffen further.\n\n'Go,' you mutter. He doesn't wait for a second invitation.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_HANDOFF_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_release",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "You take the paper. The ink is still fresh enough to smudge your gloves. The boy scurries away into the steam without looking back.",
    backgroundUrl: CASE01_NEWSBOY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_newsboy",
    choices: [
      {
        id: "CASE01_NEWSBOY_RELEASE_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Luggage Counter",
    bodyOverride:
      "The clerk is counting brass tags. A heavy wooden crate marked for Bankhaus J.A. Krebs sits on a trolley, arriving from Strasbourg under priority seal. It's unusual for a local bank to receive such a delivery on a Sunday morning.\n\nThe clerk notices you lingering and shifts a clipboard to cover the manifest.",
    backgroundUrl: CASE01_LUGGAGE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_luggage",
    choices: [
      {
        id: "CASE01_LUGGAGE_PRESS",
        text: "Press the clerk about the Strasbourg shipment.",
        nextNodeId: "scene_case01_hbf_luggage_robbery",
        passiveChecks: [
          {
            id: "check_luggage_clerk_fear",
            voiceId: "attr_social",
            difficulty: 10,
            isPassive: true,
          },
        ],
      },
      {
        id: "CASE01_LUGGAGE_RETURN",
        text: "Step back to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage_robbery",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    bodyOverride:
      "The clerk's eyes dart toward the police post. 'I don't know anything about Strasbourg,' he mutters. 'Only that the bank requested priority. If you want to know more, go to the source.'\n\nHe turns his back on you, ending the conversation with a sharp snap of his ledger.",
    backgroundUrl: CASE01_LUGGAGE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_luggage",
    choices: [
      {
        id: "CASE01_LUGGAGE_ROBBERY_RETURN",
        text: "Return to the platform.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_police",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Police Post",
    bodyOverride:
      "Two officers are deep in low-voiced conversation. They mention an 'open vault' and a 'silent alarm' that didn't ring. Their posture is rigid, eyes scanning the crowd with more than just regular vigilance.\n\nThey are waiting for someone. Or preventing someone from leaving.",
    backgroundUrl: CASE01_POLICE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_police",
    choices: [
      {
        id: "CASE01_POLICE_RETURN",
        text: "Mingle back into the crowd.",
        nextNodeId: "scene_case01_beat1_atmosphere",
      },
    ],
  },
  {
    id: "scene_case01_hbf_departure",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Leaving the Hauptbahnhof",
    bodyOverride:
      "You shoulder through the tide of travelers - timetables, porters and polite lies that pretend to be small talk.\n\nThe glass doors spill you into Freiburg. Two fronts are burning: the bank robbery and the political pressure from the Rathaus. For Eleonora Hartmann, a third front waits in the old estate: a real spirit and the living hands that learned to hide behind it.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    onEnter: [
      {
        type: "set_flag",
        key: "case01_onboarding_complete",
        value: true,
      },
      { "type": "set_flag", "key": "intro_freiburg_done", "value": true },
      { "type": "set_flag", "key": "case01_priority_locked", "value": true },
      { "type": "unlock_group", groupId: "loc_freiburg_bank" },
      { "type": "unlock_group", groupId: "loc_rathaus" },
      { "type": "track_event", eventName: "case01_hbf_departure" },
    ],
    choices: [
      {
        id: "CASE01_HBF_EXIT_BANK",
        text: "The bank first. Follow the money.",
        nextNodeId: "scene_case01_hbf_exit_final",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true,
            },
          },
        ],
        effects: [
          { type: "set_flag", key: "priority_bank_first", value: true },
          {
            type: "set_flag",
            key: "priority_mayor_first",
            value: false,
          },
        ],
      },
      {
        id: "CASE01_HBF_EXIT_RATHAUS",
        text: "The Rathaus first. Follow the power.",
        nextNodeId: "scene_case01_hbf_exit_final",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "origin_witch",
              value: true,
            },
          },
        ],
        effects: [
          {
            type: "set_flag",
            key: "priority_mayor_first",
            value: true,
          },
          { "type": "set_flag", "key": "priority_bank_first", "value": false },
        ],
      },
      {
        id: "CASE01_HBF_EXIT_WITCH_HOTEL_CHECKIN",
        text: "Сначала заселиться в «Zum Goldenen Adler» и оставить багаж.",
        nextNodeId: "scene_case01_witch_hotel_checkin",
        visibleIfAll: [
          { type: "flag_equals", key: "origin_witch", value: true },
        ],
      },
    ],
  },
  {
    id: "scene_case01_witch_hotel_checkin",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "«Zum Goldenen Adler»",
    onEnter: [
      { type: "set_flag", key: "witch_hotel_checked_in", value: true },
    ],
    bodyOverride:
      "**[Narrator]**:\nЭкипаж довозит Хартманнов до «Zum Goldenen Adler» прежде, чем Фрайбург успевает окончательно проснуться. В холле пахнет мокрой шерстью, полированным деревом и кофе, который здесь подают так тихо, будто даже чашки подписали соглашение о неразглашении.\n\nПортье кладет на стойку два ключа. Потом третий — без номера, старый, тяжелый, с потемневшим латунным кольцом. Он не объясняет. Не спрашивает. Только на мгновение опускает глаза к регистрационной книге.\n\nФеликс забирает бумаги и старается выглядеть так, будто номер, сундуки и расписание завтрака — это полноценный план новой жизни. Саша ставит багаж так, чтобы закрыть вас от лишних взглядов.\n\n**[Элеонора]**:\n— Феликс, проверьте комнаты. Саша, проследите, чтобы сундуки подняли без суеты. Я скоро вернусь.\n\n**[Феликс]**:\n— Матушка, вы опять по делам?\n\n**[Элеонора]**:\n— Во Фрайбурге дела обычно приходят раньше визитных карточек.\n\n**[inner_guide]**:\nСначала дом для Феликса. Потом Бюро. Так ложь становится почти заботой.",
    backgroundUrl: CASE01_WITCH_HOTEL_CHECKIN_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_checkin",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_HOTEL_TO_BUREAU",
        text: "Оставить Феликса с Сашей и принять вызов Бюро.",
        nextNodeId: "scene_case01_witch_bureau_entry",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage_incident_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Стойка выдачи багажа",
    onEnter: [
      { type: "set_flag", key: "met_sasha_servant_intro", value: true },
    ],
    bodyOverride:
      "**[Narrator]**:\nСтойка выдачи багажа просыпается раньше города: мокрые бирки, скрип тележек, служащий с чернильными пальцами и очередь людей, которые уже устали быть вежливыми.\n\nСаша стоит у тележки Хартманнов. Крупный, собранный, в темном дорожном пальто без лишней отделки. Старый шрам на лице не делает его суровее; скорее объясняет, почему он не тратит движений зря.\n\nОн замечает Элеонору раньше, чем Феликс успевает поднять руку для приветствия. Взгляд у Саши спокойный, но слишком внимательный для обычного слуги: он знает признаки ее слабости, хотя не знает их настоящего имени.",
    backgroundUrl: CASE01_LUGGAGE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    characterId: "npc_sasha_hartmann_servant",
    choices: [
      {
        id: "AUTO_WITCH_HBF_SASHA_SOFT",
        text: "Подойти к Саше у багажной тележки.",
        nextNodeId: "scene_case01_hbf_luggage_sasha_soft",
        visibleIfAll: [
          { type: "var_lte", key: "witch_blood_curse_pressure", value: 44 },
        ],
      },
      {
        id: "AUTO_WITCH_HBF_SASHA_THIRST",
        text: "Подойти к Саше у багажной тележки.",
        nextNodeId: "scene_case01_hbf_luggage_sasha_thirst",
        visibleIfAll: [
          { type: "var_gte", key: "witch_blood_curse_pressure", value: 45 },
        ],
      }
    ]
  },
  {
    id: "scene_case01_hbf_luggage_sasha_soft",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Саша у багажа",
    bodyOverride:
      "**[Narrator]**:\nФеликс уже нашел Сашу и теперь делает вид, что не рад этому слишком явно. Саша легко снимает тяжелый сундук с тележки, проверяет латунный засов и ставит багаж так, чтобы Элеоноре не пришлось протискиваться через очередь.\n\n**[Феликс]**:\n— Матушка, Саша здесь. Детектив вернулся в вагон за вещами, я подумал...\n\n**[Саша]**:\n— Правильно подумали, барин Феликс.\n\nГоворит он негромко и без улыбки, но в этой короткой фразе есть привычка прикрывать чужую неловкость как часть службы. Затем Саша смотрит на Элеонору — не в глаза, а чуть ниже, на дыхание, на пальцы в перчатках, на ту долю усталости, которую хорошие сыновья предпочитают не замечать.\n\n**[Саша]**:\n— Госпоже лучше пройти к экипажу без остановок. Я разберусь с квитанциями.",
    backgroundUrl: CASE01_WITCH_SASHA_LUGGAGE_SOFT_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "WITCH_HBF_SASHA_ACCEPT_COVER",
        text: "Позволить Саше уладить багаж и сохранить обычное утро.",
        nextNodeId: "scene_case01_hbf_departure",
        effects: [
          { type: "change_relationship", characterId: "npc_sasha_hartmann_servant", delta: 10 },
          { type: "grant_xp", amount: 10 },
          { type: "set_flag", key: "flag_witch_helped_sasha_hbf", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nВы киваете так, будто это обычное распоряжение, а не помощь. Саша принимает эту форму без обиды: берет квитанции, закрывает собой чужие взгляды и одним движением поправляет сундук, который Феликс пытался сдвинуть плечом.\n\n**[Саша]**:\n— К экипажу, госпожа. Я догоню с вещами.\n\n**[inner_guide]**:\nНе всякое спасение требует признательности вслух. Иногда достаточно человека, который заметил слабость и не назвал ее при всех."
      },
      {
        id: "WITCH_HBF_SASHA_THANK_QUIETLY",
        text: "Тихо поблагодарить Сашу, чтобы Феликс не услышал лишнего.",
        nextNodeId: "scene_case01_hbf_luggage_sasha_thank_quietly",
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_sasha_hartmann_servant",
            delta: 12,
          },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "grant_xp", amount: 10 },
          { type: "set_flag", key: "flag_witch_helped_sasha_hbf", value: true }
        ]
      },
      {
        id: "WITCH_HBF_SASHA_DISMISS_CONCERN",
        text: "Холодно пресечь заботу: «Саша, занимайтесь вещами».",
        nextNodeId: "scene_case01_hbf_luggage_sasha_dismiss_concern",
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_sasha_hartmann_servant",
            delta: -3,
          }
        ]
      }
    ],
  },
  {
    id: "scene_case01_hbf_luggage_sasha_thank_quietly",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Тихая благодарность",
    bodyOverride:
      "**[Элеонора]**:\n— Благодарю, Саша. Вы всё еще замечаете больше, чем положено.\n\n**[Саша]**:\n— Так спокойнее дому, госпожа.\n\n**[Narrator]**:\nОн говорит это без подобострастия. Не «вам», не «барину», не «семье» — дому. Тому месту, где его когда-то спрятали и где он с тех пор научился закрывать двери вовремя.\n\nФеликс слышит только тон, не смысл. Этого достаточно: он перестает суетиться и берет шляпу двумя руками.\n\n**[inner_guide]**:\nТепло можно принять без долга, если не делать из него сцену.",
    backgroundUrl: CASE01_WITCH_SASHA_LUGGAGE_THANK_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_HBF_SASHA_THANK_QUIETLY",
        text: "Продолжить к экипажу.",
        nextNodeId: "scene_case01_hbf_departure",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage_sasha_dismiss_concern",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Форма важнее заботы",
    bodyOverride:
      "**[Элеонора]**:\n— Саша, занимайтесь вещами. Мое самочувствие не требует обсуждения на вокзале.\n\n**[Саша]**:\n— Как прикажете, госпожа.\n\n**[Narrator]**:\nОн отступает на полшага и больше не смотрит на ваши руки. Это не обида и не страх; скорее привычка человека, который умеет выполнить приказ, даже когда считает его неразумным.\n\n**[inner_cynic]**:\nОтлично. Тепло убрано с дороги. Теперь утро снова принадлежит форме.",
    backgroundUrl: CASE01_WITCH_SASHA_LUGGAGE_DISMISS_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_HBF_SASHA_DISMISS_CONCERN",
        text: "Продолжить к экипажу.",
        nextNodeId: "scene_case01_hbf_departure",
      },
    ],
  },
  {
    id: "scene_case01_hbf_luggage_sasha_thirst",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Рука Саши",
    bodyOverride:
      "**[Narrator]**:\nФеликс тянет тяжелый сундук с багажной тележки, но латунный засов заедает. Саша кладет руку поверх его руки — не грубо, только останавливая лишнее усилие.\n\n**[Саша]**:\n— Позвольте мне, барин.\n\nЗасов поддается со скрежетом. Острый край цепляет Сашину ладонь, и кровь выступает сразу, густая и темная на старой коже. Он не шипит, не отдергивает руку, только сжимает пальцы так ровно, будто боль — это вещь, которую можно поставить в сторону.\n\nВ висках у Элеоноры поднимается стук. Жажда узнает теплую кровь раньше, чем разум успевает назвать имя.\n\n**[inner_cynic]**:\nДомашняя кровь. Верная кровь. Она сама пришла к руке.\n\n**[inner_guide]**:\nОн знает симптомы, не тайну. Не превращай его заботу в свидетельство против себя.",
    backgroundUrl: CASE01_WITCH_SASHA_LUGGAGE_THIRST_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "WITCH_HBF_BLOOD_ABSORB",
        text: "[Blood Absorption] Незаметно коснуться латунного засова и впитать свежие капли крови.",
        nextNodeId: "scene_case01_hbf_departure",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -20 },
          { type: "add_var", key: "witch_blood_power", value: 1 },
          { type: "add_var", key: "witch_blood_debt", value: 16 },
          { type: "set_flag", key: "flag_witch_absorbed_hbf_blood", value: true },
          { type: "set_flag", key: "ghost_sasha_testimony_compromised", value: true },
          { type: "change_relationship", characterId: "npc_sasha_hartmann_servant", delta: -15 }
        ],
        inlineText:
          "**[Narrator]**:\nПальцы в тонкой лайковой перчатке скользят по холодной латуни. Горячая влага исчезает с металла быстрее, чем должна. Облегчение приходит тихо, почти прилично, и от этого становится хуже.\n\nСаша смотрит на свою ладонь, потом на вас. Он не понимает, что произошло. Но он понимает достаточно, чтобы больше не принимать ваше молчание за слабость.\n\n**[inner_cynic]**:\nОн выдержит. Такие всегда выдерживают. Вопрос только в том, что они потом помнят."
      },
      {
        id: "WITCH_HBF_WARM_VETO_TEND_HAND",
        text: "[Тёплое Вето] Перетянуть Сашину ладонь собственным платком — без расчёта.",
        nextNodeId: "scene_case01_hbf_departure",
        // Warm Veto: visible always, locks (greys) at 0 volition tokens — "кем она могла бы быть".
        // Spends resource_volition_token (humanity budget), NOT resource_fate_token (DM intervention).
        requireAll: [
          { type: "var_gte", key: "resource_volition_token", value: 1 }
        ],
        effects: [
          { type: "add_var", key: "resource_volition_token", value: -1 },
          { type: "change_psyche_axis", axis: "y", delta: 5 },
          { type: "change_relationship", characterId: "npc_sasha_hartmann_servant", delta: 15 },
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 2 },
          { type: "grant_xp", amount: 10 },
          { type: "set_flag", key: "flag_witch_helped_sasha_hbf", value: true },
          { type: "set_flag", key: "flag_witch_warm_veto_sasha_hbf", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nВы делаете то, чего фрау в лайковых перчатках не делает на людях: опускаетесь к чужой руке. Жажда воет, требует, считает капли — а вы достаете свой платок, не его, и перетягиваете ладонь Саши ровно, как умеют только те, кто сам когда-то ждал чужой помощи и не дождался.\n\n**[inner_manipulator]**:\nЧто ты делаешь? Кровь сама пришла к руке. Это убыток без выгоды, и половина зала видит, как ты унижаешься.\n\n**[inner_guide]**:\nПусть видят. Это стоит тебе сил, которых почти нет, — и именно поэтому это все еще ты, а не то, что внутри.\n\n**[Саша]**:\n— Не нужно, госпожа.\n\n**[Элеонора]**:\n— Нужно. Держите руку ровно.\n\n**[Narrator]**:\nОн замолкает. Феликс смотрит во все глаза — мать на одном колене у руки слуги, — но Саша уже понял что-то, чему пока нет названия: эту женщину голод еще не доел."
      },
      {
        id: "WITCH_HBF_BLOOD_IGNORE",
        text: "Сдержать зов и позволить Саше прикрыть неловкость.",
        nextNodeId: "scene_case01_hbf_departure",
        effects: [
          { type: "change_relationship", characterId: "npc_felix_hartmann", delta: 1 },
          { type: "change_relationship", characterId: "npc_sasha_hartmann_servant", delta: 10 },
          { type: "grant_xp", amount: 10 },
          { type: "set_flag", key: "flag_witch_helped_sasha_hbf", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nВы не смотрите на кровь. Это требует больше силы, чем отдать приказ. Саша замечает, как напряглись ваши пальцы, и без вопроса разворачивается так, чтобы закрыть ладонь от Феликса.\n\n**[Саша]**:\n— Пустяки. Старый засов. Барин Феликс, подайте квитанцию.\n\nОн перевязывает руку собственным платком, быстро и туго. Военной истории он не рассказывает; она и так видна в том, как он терпит боль и не делает из нее события.\n\n**[inner_guide]**:\nОн прикрыл вас, не зная от чего. Это доверие еще можно сохранить."
      },
      {
        id: "WITCH_HBF_SEND_FELIX_AWAY",
        text: "Отослать Феликса к экипажу и дать Саше самому закрыть происшествие.",
        nextNodeId: "scene_case01_hbf_luggage_sasha_send_felix_away",
        effects: [
          {
            type: "change_relationship",
            characterId: "npc_sasha_hartmann_servant",
            delta: 8,
          },
          { type: "set_flag", key: "flag_witch_helped_sasha_hbf", value: true }
        ]
      }
    ]
  },
  {
    id: "scene_case01_hbf_luggage_sasha_send_felix_away",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Без лишних глаз",
    bodyOverride:
      "**[Элеонора]**:\n— Феликс, проверьте экипаж. Если кучер спит, разбудите его вежливо. Если не понимает вежливости — по-хартманновски.\n\n**[Феликс]**:\n— Да, матушка.\n\n**[Narrator]**:\nОн уходит слишком быстро, благодарный за ясное поручение. Когда его шаги растворяются в шуме вокзала, Саша затягивает платок на ладони и впервые смотрит прямо.\n\n**[Саша]**:\n— Сегодня лучше без лишних глаз, госпожа.\n\n**[Элеонора]**:\n— Вы заметили?\n\n**[Саша]**:\n— Симптомы. Не причину.\n\n**[Narrator]**:\nОн не просит объяснений. Это почти хуже вопроса: доверие без любопытства тяжелее удержать, чем страх.",
    backgroundUrl: CASE01_WITCH_SASHA_SEND_FELIX_AWAY_BG,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_HBF_SASHA_SEND_FELIX_AWAY",
        text: "Продолжить к экипажу.",
        nextNodeId: "scene_case01_hbf_departure",
      },
    ],
  },
  {
    id: "scene_case01_witch_bureau_entry",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Секретный отдел Бюро",
    bodyOverride:
      "**[Narrator]**:\nДождь у вокзала шумит над головой, когда неприметная дверь между газетным киоском и багажной конторой открывается без ручки. За ней не лестница, а узкий механический лифт: латунные рычаги, масляный запах, стеклянная шкала с делениями, которых нет ни в одном городском плане.\n\nКабина опускается в темноту под Фрайбургом. На стенах мелькают архивные печати, высушенная лаванда и старые карточки с именами людей, которые предпочли бы остаться слухами.\n\n**[inner_guide]**:\nЗдесь безопаснее, чем на улице. Но безопасность Бюро похожа на запертую книгу: она защищает только тех, кто знает, какую страницу нельзя открывать.",
    backgroundUrl: CASE01_WITCH_BUREAU_HIDDEN_LIFT_ENTRY_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_BUREAU_ENTRY",
        text: "Войти в кабинет Мастера.",
        nextNodeId: "scene_case01_witch_bureau_master_meeting",
      },
    ],
  },
  {
    id: "scene_case01_witch_bureau_master_meeting",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Встреча с Мастером",
    onEnter: [
      { type: "set_flag", key: "met_bureau_master_intro", value: true },
    ],
    bodyOverride:
      "**[Master]**:\n— Проходите, дитя. Фрайбург любит притворяться городом расписаний и счетов, но сегодня он говорит языком холодных комнат и неучтенной крови.\n\n**[Narrator]**:\nМастер сидит за массивным столом из темного дуба. Рядом с ним под стеклянным колпаком лежит тусклый, сочащийся багровым светом осколок древнего алтарного камня — сырой оккультный реликт, от которого пахнет старой медью и грозой. Рядом стоит склянка с официальным, стерильным химическим составом Бюро — подавителем проклятия.\n\nМастер отворачивается к шкафу, чтобы достать документы дела Гранд-Эстейт. На мгновение ты остаешься один на один с его столом.\n\n**[inner_cynic]**:\nПодавитель излечит симптомы и успокоит огонь в венах, но сделает твою силу блеклой. А вот этот осколок... один короткий жест, одно прикосновение — и его сырая мощь станет твоей. Но если Мастер заметит колебание завесы, твоему положению в Бюро конец.",
    backgroundUrl: CASE01_WITCH_BUREAU_MASTER_RELIC_CHOICE_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT",
        text: "[Chemical Suppressant] Выпить официальную сыворотку Бюро со стола.",
        nextNodeId: "scene_case01_witch_bureau_exit",
        visibleIfAll: [
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: "flag_witch_absorbed_hbf_blood",
              value: true,
            },
          },
        ],
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -25 },
          { type: "set_flag", key: "flag_witch_took_suppressant", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nТы откупориваешь флакон и выпиваешь безвкусную, ледяную жидкость. Внутренний зверь разочарованно затихает, скованный алхимическими цепями Бюро. Жилы пустеют, но голова становится кристально чистой.\n\n**[Master]**:\n*(поворачиваясь с папкой документов)*\n— Разумный выбор, Элеонора. Дисциплина — наше главное оружие против безумия ковенов. Гранд-Эстейт требует точности. Найдите правду и не позволяйте Проклятию Крови решать за вас."
      },
      {
        id: "WITCH_BUREAU_MASTER_DRINK_SUPPRESSANT_NOTICED",
        text: "[Chemical Suppressant] Выпить сыворотку, пока Мастер изучает след крови.",
        nextNodeId: "scene_case01_witch_bureau_master_noticed_hbf_blood",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: "flag_witch_absorbed_hbf_blood",
            value: true,
          },
        ],
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -25 },
          { type: "set_flag", key: "flag_witch_took_suppressant", value: true },
          {
            type: "set_flag",
            key: "flag_witch_master_noticed_hbf_blood",
            value: true,
          }
        ]
      },
      {
        id: "WITCH_BUREAU_MASTER_SIPHON_RELIC",
        text: "[Stealth / Occultism] Секретно поглотить силу реликта, пока Мастер отвернулся.",
        nextNodeId: "scene_case01_witch_bureau_exit",
        skillCheck: {
          id: "check_witch_steal_relic",
          voiceId: "attr_spirit",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_witch_bureau_exit",
            effects: [
              { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
              { type: "add_var", key: "witch_blood_power", value: 2 },
              { type: "grant_xp", amount: 20 },
              { type: "set_flag", key: "flag_witch_siphoned_relic", value: true }
            ],
            inlineText:
              "**[Narrator]**:\nТвоя рука молниеносно скользит к стеклянному колпаку. Ты едва касаешься холодного стекла, но твоя воля пробивает преграду. Багровое свечение реликта мгновенно втягивается в твои пальцы. Твои вены вздуваются от дикой, необузданной силы, проклятие крови воет от восторга.\n\nТы успеваешь убрать руку за мгновение до того, как Мастер поворачивается. Он бросает быстрый взгляд на прибор на столе, хмурится, но ничего не говорит.\n\n**[inner_cynic]**:\nПрекрасно. Сила бурлит в теле. Ты готова к любым кошмарам Гранд-Эстейт."
          },
          onFail: {
            nextNodeId: "scene_case01_witch_bureau_exit",
            effects: [
              { type: "add_var", key: "witch_blood_curse_pressure", value: 20 },
              { type: "add_var", key: "witch_blood_power", value: 2 },
              { type: "add_var", key: "checks_failed", value: 1 },
              { type: "set_flag", key: "flag_witch_siphoned_relic", value: true },
              { type: "set_flag", key: "flag_witch_master_suspicious", value: true }
            ],
            inlineText:
              "**[Narrator]**:\nТы тянешься к реликту, но впитывание происходит слишком резко. Воздух в кабинете с сухим треском электризуется, латунные стрелки приборов на столе сходят с ума. Мастер оборачивается на звук.\n\nЕго глаза сужаются, когда он видит твои пальцы, еще окутанные багровой дымкой, и поблекший, серый камень под стеклом.\n\n**[Master]**:\n— Глупо, Элеонора. Очень глупо. Воровство у Бюро — это не просто дерзость, это долг, который ты будешь выплачивать собственной кровью. Запомни это.\n\n**[inner_guide]**:\nМастер всё понял. Твой секрет раскрыт, а доверие Бюро подорвано."
          }
        }
      },
      {
        id: "WITCH_BUREAU_MASTER_COMPOSURE",
        text: "Сохранять спокойствие и ждать возвращения Мастера.",
        nextNodeId: "scene_case01_witch_bureau_exit",
        inlineText:
          "**[Narrator]**:\nТы стоишь неподвижно, сложив руки на сумочке. Ни склянка, ни реликт не заставляют тебя дрогнуть. Мастер поворачивается с папкой в руках, удовлетворенно кивая твоему спокойствию.\n\n**[Master]**:\n— Ваша выдержка делает вам честь, Элеонора. В Гранд-Эстейт вам понадобится именно такая холодная голова. Не поддавайтесь панике, найдите обе правды и возвращайтесь с отчетом."
      }
    ]
  },
  {
    id: "scene_case01_witch_bureau_master_noticed_hbf_blood",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Мастер заметил",
    bodyOverride:
      "**[Narrator]**:\nТы откупориваешь флакон и выпиваешь безвкусную, ледяную жидкость. Подавитель ложится в кровь ледяной пленкой, но облегчение приходит неровно: в нем мешается чужое тепло, взятое у багажной тележки.\n\nМастер поворачивается с папкой и останавливается на полуслове. Его взгляд не падает на твои губы или перчатки — он смотрит чуть левее, туда, где воздух вокруг тебя еще помнит недавнее насыщение.\n\n**[Master]**:\n— Вы уже питались сегодня.\n\n**[Элеонора]**:\n— Я стабилизировала состояние до прибытия.\n\n**[Master]**:\n— Так обычно говорят те, кто не хочет произносить слово «сорвалась». Заменитель вы получите всё равно. Но, Элеонора, Бюро замечает не кровь. Бюро замечает, когда агент начинает считать чужую кровь бытовой мелочью.\n\n**[Narrator]**:\nОн не повышает голос и не делает записи при вас. От этого замечание становится неприятнее: оно уже записано где-то до чернил.\n\n**[inner_guide]**:\nОн заметил. Пока это предупреждение, не приговор.",
    backgroundUrl: CASE01_WITCH_BUREAU_MASTER_NOTICED_HBF_BLOOD_BG,
    characterId: "npc_bureau_master",
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_BUREAU_MASTER_NOTICED_HBF_BLOOD",
        text: "Принять заменитель и выйти из кабинета.",
        nextNodeId: "scene_case01_witch_bureau_exit",
      },
    ],
  },
  {
    id: "scene_case01_witch_bureau_exit",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Напутствие",
    bodyOverride:
      "**[Narrator]**:\nМастер делает жест рукой, отпуская вас. Потайной ход выводит не обратно к билетным кассам, а к узкой служебной двери под аркой, откуда видна дорога к окраине города.\n\nТам, за мокрыми садами и темными аллеями, стоит Гранд-Эстейт. Дом ждет не обвинителя и не спасителя, а свидетельницу, способную выдержать две истины сразу.\n\n**[inner_guide]**:\nЗавеса там истончилась. Пора узнать, кто умер, кто лжет и кто пьет страх вместо вина.",
    backgroundUrl: CASE01_WITCH_BUREAU_EXIT_ESTATE_ROAD_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    onEnter: [
      { type: "set_flag", key: "origin_witch_handoff_done", value: true },
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_BUREAU_EXIT",
        text: "Направиться к Гранд-Эстейт.",
        nextNodeId: "scene_case01_witch_estate_handoff",
      },
    ],
  },
  {
    id: "scene_case01_witch_estate_handoff",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Дорога к Гранд-Эстейт",
    bodyOverride:
      "**[Narrator]**:\nФрайбург остается за спиной: мокрые стекла вокзала, газетные крики, городская суета, которая делает вид, что мир состоит только из расписаний.\n\nДорога к Гранд-Эстейт темнеет между садами. Над крышами особняка висит неподвижная полоса тумана, слишком ровная для погоды. Там есть дух. И там есть живые люди, которым этот дух очень удобен.\n\n**[inner_guide]**:\nТеперь начинается расследование, Элеонор. Сначала слушаем дом. Потом — тех, кто научился говорить его голосом.",
    backgroundUrl: CASE01_BG_ESTATE_APPROACH,
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    onEnter: [
      { type: "set_flag", key: "origin_witch_handoff_done", value: true },
    ],
    choices: [
      {
        id: "AUTO_CONTINUE_WITCH_ESTATE_HANDOFF",
        text: "Прибыть к воротам поместья.",
        nextNodeId: "scene_case01_estate_arrival_witch",
      },
    ],
  },
  {
    id: "scene_case01_hbf_exit_final",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Freiburg",
    bodyOverride: "The station is behind you. The city is ahead.",
    backgroundUrl: CASE01_HBF_BG,
    narrativeLayout: "log",
    sceneGroupId: "hbf_hall",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_case01_mayor_entry",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Mayor's Office",
    bodyOverride:
      "The mayor does not offer you a chair until he has decided what sort of investigator you are. He wants the panic contained, the council reassured, and the bank matter finished before the newspapers decide it was an inside job with friends in City Hall.\n\n'I asked the police to attach a scientific observer,' he says. 'They refused my daughter on grounds of decorum.'\n\nThe door opens before the Polizeidirektor can enjoy the word. Victoria Sterling enters with a sealed sample tube, a strip of black-yellow postal twine, and the look of a woman who has already heard every objection twice.\n\n'The route was bent before the gas reached the bank,' she says. 'If you want a robbery, gentlemen, you will have to explain why it travelled like a delivery.'",
    choices: [
      {
        id: "CASE01_MAYOR_INDEPENDENT_FOOTING",
        text: "Let the Rathaus note that you arrived without Hartmann sponsorship.",
        nextNodeId: "scene_case01_mayor_independent_footing",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.declinedEleonoraHospitality,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_MAYOR_PRESS",
        text: "Ask why the Polizeidirektor refused Victoria's findings.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
        effects: [
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "grant_evidence", evidenceId: "ev_bureau_control_code" },
          {
            type: "discover_fact",
            caseId: "case_bankhaus_krebs_false_trail",
            factId: "fact_mayor_control_code",
          },
          { type: "grant_xp", amount: 5 },
        ],
      },
      {
        id: "CASE01_MAYOR_VICTORIA_ROUTE",
        text: "Let Victoria finish the postal-chain argument before anyone interrupts.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
        effects: [
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_independent_footing",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Independent Footing",
    bodyOverride:
      "The mayor's secretary notices the absence before the mayor admits it. No Hartmann carriage waits outside, no borrowed calling card lies on the tray, no soft introduction has crossed the desk ahead of you.\n\n'Good,' the mayor says at last. 'Then for the next few minutes this can remain a municipal conversation.'\n\nIt is not warmth. It is a cleaner ledger.",
    choices: [
      {
        id: "CASE01_MAYOR_INDEPENDENT_TO_DOSSIER",
        text: "Take the cleaner footing and ask what the Rathaus is most afraid of.",
        nextNodeId: "scene_case01_rathaus_briefing_full",
      },
    ],
  },
  {
    id: "scene_case01_rathaus_briefing_full",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_mayor_briefing/scene_case01_rathaus_briefing_full.md",
    titleOverride: "The Rathaus Summit",
    bodyOverride:
      "The Oberbuergermeister taps his signet ring against the oak. Victoria stands by the window, a silent analyst in a field uniform. Felix waits with the dossier.\n\n'Bankhaus J.A. Krebs is a pillar of Freiburg,' the Mayor says. 'If a wagon vanishes there, it is a scandal we cannot afford.'",
    backgroundUrl: CASE01_BG_RATHAUS,
    choices: [
      {
        id: "RATHAUS_ACCEPT_PARTNERSHIP",
        text: "I accept. Victoria's expertise is the edge this case needs.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "RATHAUS_PROFESSIONAL_ONLY",
        text: "I will take the writ and the consultant. Let's keep this strictly professional.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
      {
        id: "RATHAUS_SKEPTICAL",
        text: "Is this a request for an investigator or a babysitter, Herr Oberbuergermeister?",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "change_relationship", characterId: "victoria_sterling", delta: -1 },
          { type: "add_tension", amount: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_dossier",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Political Pressure",
    bodyOverride:
      "The Polizeidirektor calls Victoria 'Frau Sterling' as if widowhood is a more acceptable credential than chemistry. Her jaw tightens only once. The mayor does not look at her when he answers; that is how you learn the request is personal before it is political.\n\nHe gives you three things and pretends they are one: a permit to press deeper into the records later, a warning that Galdermann has friends who pay for silence, and an unofficial attachment of Victoria as private scientific consultant under your responsibility.",
    characterId: "victoria_sterling",
    choices: [
      {
        id: "CASE01_MAYOR_FELIX_ASIDE",
        text: "Let Felix read the official cover before you accept it.",
        nextNodeId: "scene_case01_mayor_felix_aside",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.defendedFelix,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_MAYOR_RESPECT_VICTORIA",
        text: "Recognize Victoria's chain of custody as the strongest evidence in the room.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "CASE01_MAYOR_PATRONIZE_VICTORIA",
        text: "Accept the Oberbuergermeister's daughter as a liability you will manage.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: -1 },
        ],
      },
      {
        id: "CASE01_MAYOR_PRESS_WITH_VICTORIA",
        text: "Use Victoria's postal route to force the Rathaus into a stronger writ.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "add_tension", amount: 1 },
        ],
      },
      {
        id: "CASE01_MAYOR_TO_BANK",
        text: "Accept Victoria as a neutral expert and move to the bank.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_var", key: "official_writ_strength", value: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_felix_aside",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Felix Reads the Cover",
    bodyOverride:
      "Felix takes the permit as if it might bruise. He reads the mayor's phrasing twice, once for law and once for cowardice, then glances at Victoria's sample tube.\n\n'This gives you doors,' he says quietly. 'Not protection. If the Rathaus needs distance later, every sentence here already knows how to step away from you.'\n\nHe hands it back before anyone can ask whether he was helping you, warning himself, or telling Victoria that the city will use her work before it respects it.",
    characterId: "npc_felix_hartmann",
    choices: [
      {
        id: "CASE01_MAYOR_FELIX_TO_BANK",
        text: "Take Felix's reading and move to the bank with official cover.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "set_flag", key: "police_refused_victoria", value: true },
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_respected", value: true },
          { type: "set_var", key: "official_writ_strength", value: 2 },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
    ],
  },
  {
    id: "scene_case01_mayor_exit",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Official Writ",
    bodyOverride:
      "By the time you leave, you have enough paper to open doors, enough political pressure to know those same doors may close behind you, and enough ambiguity for the Rathaus to deny it ever appointed Victoria Sterling at all.\n\nThat is the bargain: she enters the bank as your private scientific consultant, not as an officer.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "mayor_briefing_complete", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_bank" },
      {
        type: "track_event",
        eventName: "case01_mayor_briefing_complete",
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_bank_arrival",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_bank_arrival.md",
    titleOverride: "Bankhaus J.A. Krebs",
    bodyOverride:
      "Cold air clings to the marble steps of Bankhaus J.A. Krebs. Victoria Sterling is already beside the crooked postal car, not touching the handle, counting the knots in the black-yellow postal twine as if each one has sworn a separate oath.\n\nInside, clerks lower their eyes on schedule. Someone has already decided which version of the robbery the room should survive. With Victoria beside you, the room has to recalculate who is allowed to notice the chemistry.",
    backgroundUrl: CASE01_BG_BANK_EXTERIOR,
    characterId: "victoria_sterling",
    choices: [
      {
        id: "CASE01_BANK_NOTE_LOBBY_COPPER",
        text: "Mention the metallic note from the lobby to Victoria before going in.",
        nextNodeId: "scene_case01_bank_manager",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_lobby_crossover_seen_by_detective", value: true },
          { type: "flag_equals", key: "flag_witch_copper_smell", value: true },
        ],
        effects: [
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
        inlineText:
          "**[Detective]**:\n— Frau Sterling. The lobby at the Adler this morning carried a metallic note. Not the postal car. Closer to old copper.\n\n**[Victoria Sterling]**:\n— Then it is not from the gas. Gas does not bring its own metal. Whoever left that trace in your lobby was not at this bank — but they were near a wound. File it next to my husband's case, please. Not in the same drawer; just nearby.\n\n**[Narrator]**:\nShe does not look up from the twine. The marble steps have already heard worse confessions, but Victoria's first list of suspects has just grown by one unnamed entry.",
      },
      {
        id: "CASE01_BANK_OVERNIGHT_INCIDENT",
        text: "Listen to the clerks whispering about overnight news before approaching.",
        nextNodeId: "scene_case01_bank_manager",
        visibleIfAll: [
          { type: "var_gte", key: "heat", value: 2 },
        ],
        inlineText:
          "**[Narrator]**:\nTwo clerks at the brass railing keep their voices below the lobby acoustic, but the marble is honest.\n\n**[Clerk A]**:\n— … the gendarmes were on the Salzstrasse alley before sunrise. A man, throat torn, pockets emptied save a token marked with the Krebs cant.\n\n**[Clerk B]**:\n— Strassenleute. They never used to come this near to a Hartmann hotel.\n\n**[Narrator]**:\nThe Bankhaus name above your shoulder no longer reads as merely the family business. Whoever moved on the bank last week is not the only Krebs ledger active in Freiburg tonight.",
      },
      {
        id: "CASE01_BANK_WITH_VICTORIA",
        text: "Bring Victoria inside and watch who recalculates around the gas story.",
        nextNodeId: "scene_case01_bank_manager",
        effects: [
          { type: "set_flag", key: "victoria_introduced", value: true },
          { type: "set_flag", key: "victoria_seen_in_bank", value: true },
          { type: "change_relationship", characterId: "victoria_sterling", delta: 1 },
        ],
      },
      {
        id: "CASE01_BANK_SOLO",
        text: "Enter first and make Victoria hold the postal car outside.",
        nextNodeId: "scene_case01_bank_manager",
      },
    ],
  },
  {
    id: "scene_case01_bank_manager",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_manager_dialogue.md",
    characterId: "npc_heinrich_galdermann",
    titleOverride: "Prokurist Galdermann",
    bodyOverride:
      "Heinrich Galdermann receives you with a smile polished for committees and a handkerchief already damp at the fold. He calls the open vault an internal matter, nudges suspicion toward frightened clerks, and slides the official robbery report over the grossbuch before asking whether Fritz Muller's sealed statements reached you intact. The question arrives too early.",
    backgroundUrl: CASE01_BG_BANK_OFFICE,
    choices: [
      {
        id: "CASE01_BANK_MANAGER_PRESS",
        text: "Press Galdermann on Hartmann and Fritz Muller's sealed statements.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
      {
        id: "CASE01_BANK_MANAGER_BYPASS",
        text: "Let Galdermann talk until his procedure starts contradicting itself.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_clerk",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_clerk_dialogue.md",
    titleOverride: "Ernst Vogel",
    bodyOverride:
      "Ernst Vogel has the pale obedience of a man who was told which truth would keep his job. He swears the vault was locked, then admits Hartmann's access was never questioned. Only when you stop rescuing him from silence does Gustav's black silhouette surface.",
    backgroundUrl: CASE01_BG_BANK_HALL,
    choices: [
      {
        id: "CASE01_BANK_CLERK_READ",
        text: "Read Vogel's fear before you read his statement.",
        nextNodeId: "scene_case01_bank_vault",
        skillCheck: {
          id: "check_case01_clerk_empathy",
          voiceId: "attr_empathy",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_vault",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_vault",
          },
        },
        effects: [{ type: "set_flag", key: "clerk_interviewed", value: true }],
      },
      {
        id: "CASE01_BANK_CLERK_MOVE",
        text: "Take the silhouette and move to the vault.",
        nextNodeId: "scene_case01_bank_vault",
        effects: [{ type: "set_flag", key: "clerk_interviewed", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_vault",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_vault_inspection.md",
    titleOverride: "Vault Inspection",
    bodyOverride:
      "The vault door hangs open without force. Velvet dust clings where no customer should stand, and a sweet chemical grit sits in the lock throat. Metal has no loyalty; it simply refuses Galdermann's tidy story.\n\nVictoria Sterling stops speaking when a pale residue clings to her sample knife. She has seen that notation once before in the sealed remains of her husband's case. The match is not an answer. It is only the old wound learning a new address.",
    backgroundUrl: CASE01_BG_BANK_VAULT,
    choices: [
      {
        id: "CASE01_BANK_VAULT_LOCK",
        text: "Work the lock and catalogue the insider trace.",
        nextNodeId: "scene_case01_bank_conclusion",
        skillCheck: {
          id: "check_case01_vault_logic",
          voiceId: "attr_logic",
          difficulty: 10,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_conclusion",
            effects: [{ type: "set_flag", key: "found_velvet", value: true }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_conclusion",
          },
        },
        effects: [{ type: "set_flag", key: "vault_inspected", value: true }],
      },
      {
        id: "CASE01_BANK_VAULT_AIR",
        text: "Trust the chemical wrongness in the vault air.",
        nextNodeId: "scene_case01_bank_conclusion",
        skillCheck: {
          id: "check_case01_vault_intuition",
          voiceId: "attr_intuition",
          difficulty: 12,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_bank_conclusion",
            effects: [{ type: "set_flag", key: "found_residue", value: true }],
          },
          onFail: {
            nextNodeId: "scene_case01_bank_conclusion",
          },
        },
        effects: [{ type: "set_flag", key: "vault_inspected", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_bank_conclusion",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_bank_conclusion.md",
    titleOverride: "Three Open Leads",
    bodyOverride:
      "On the table, three things refuse to become one story: torn velvet, sweet chemical grit, and Gustav's name moving through the night. Victoria looks first to the cloth because grief wants a face. Then she reins herself back to procedure: disguise, supply route, tavern traffic.",
    terminal: true,
    onEnter: [
      {
        type: "set_flag",
        key: "bank_investigation_complete",
        value: true,
      },
      { type: "unlock_group", groupId: "loc_tailor" },
      { type: "unlock_group", groupId: "loc_apothecary" },
      { type: "unlock_group", groupId: "loc_pub" },
      { type: "unlock_group", groupId: "loc_rathaus" },
      { type: "unlock_group", groupId: "loc_freiburg_estate" },
      { type: "unlock_group", groupId: "loc_telephone" },
      { type: "grant_xp", amount: 20 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_tailor_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadTailor,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_tailor.md",
    titleOverride: "Tailor Workshop",
    bodyOverride:
      "Herr Klein recognizes the cut of the torn velvet immediately, but not before trying to pretend it is ordinary stage cloth. Hartmann paid for a disguise runner, Box 217 stored it, and somebody with bank access wanted to walk through the city wearing someone else's class.",
    choices: [
      {
        id: "CASE01_TAILOR_COMPLETE",
        text: "Take the costume ledger copy and fold the identity trail into the case.",
        nextNodeId: "scene_case01_tailor_exit",
      },
    ],
  },
  {
    id: "scene_case01_tailor_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadTailor,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_tailor.md",
    titleOverride: "Identity Bundle Locked",
    bodyOverride:
      "The tailor does not want his name in the file. You do not need it there yet. What matters is the route: disguise, cash runner, Hartmann.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "tailor_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_apothecary_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadApothecary,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
    titleOverride: "Lowen Apotheke",
    bodyOverride:
      "The apothecary does not deny the compound once you name its smell. The residue is real, the purchase route runs through university stock, and the order was signed under cover of a sender name no honest clerk would trust twice.",
    choices: [
      {
        id: "CASE01_APOTHECARY_COMPLETE",
        text: "Record the formula trail and move the chemical bundle forward.",
        nextNodeId: "scene_case01_apothecary_exit",
      },
    ],
  },
  {
    id: "scene_case01_apothecary_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadApothecary,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_apothecary.md",
    titleOverride: "Chemical Bundle Locked",
    bodyOverride:
      "By the time you leave, the residue is no longer mysterious. It is logistical, expensive, and routed through people who expected the chemistry to look more important than the theft.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "apothecary_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_pub_entry",
    scenarioId: CASE01_SCENARIO_IDS.leadPub,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_pub.md",
    titleOverride: "Zum Schlappen",
    bodyOverride:
      "The tavern keeper watches the room before answering. Once Gustav Brandt realizes you can offer protection instead of theater, he confirms Hartmann's name, a warehouse window, and a disguised runner moving under worker cover after curfew.",
    choices: [
      {
        id: "CASE01_PUB_COMPLETE",
        text: "Take Gustav's timing window and close the logistics bundle.",
        nextNodeId: "scene_case01_pub_exit",
      },
    ],
  },
  {
    id: "scene_case01_pub_exit",
    scenarioId: CASE01_SCENARIO_IDS.leadPub,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lead_pub.md",
    titleOverride: "Logistics Bundle Locked",
    bodyOverride:
      "You leave the pub with the first route to the warehouse that sounds like a schedule instead of a rumor. Somebody is moving people, ledgers, and disguises on the same night rhythm.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "pub_lead_complete", value: true },
      { type: "grant_xp", amount: 10 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_estate_entry",
    scenarioId: CASE01_SCENARIO_IDS.estateBranch,
    sourcePath: "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro.md",
    titleOverride: "Estate Ledger",
    bodyOverride:
      "The estate is not haunted. It is staged. Someone used a private villa outside the main routes to store telegraph copies, costume receipts, and a payment log written in the careful half-code of people who expect the clerk to die before the archive survives.",
    choices: [
      {
        id: "CASE01_ESTATE_TRACE",
        text: "Take rubbings of the bureau ledger and keep the route off the official sheet.",
        nextNodeId: "scene_case01_estate_exit",
        effects: [{ type: "set_flag", key: "bureau_trace_found", value: true }],
      },
    ],
  },
  {
    id: "scene_case01_estate_exit",
    scenarioId: CASE01_SCENARIO_IDS.estateBranch,
    sourcePath:
      "40_GameViewer/Sandbox_KA/Plot/03_Ghost/scene_estate_intro_beat1.md",
    titleOverride: "Bureau Thread Confirmed",
    bodyOverride:
      "The ledger does not name the organization outright, but it names enough participants to prove the bank theft was cover for a bureau-grade transfer network. The case is suddenly larger than the man who will wear it in public.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "estate_branch_complete", value: true },
      { type: "grant_xp", amount: 15 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_lotte_warning",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Lotte on the Wire",
    bodyOverride:
      "The telephone line hisses before Lotte Weber speaks. She has seen switchboard traffic redirect itself around your questions, which means somebody knows the investigation is narrowing. Her warning is plain: if you keep pulling the thread in daylight, the city will pull back in uniform.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "LOTTE_LEDGER_ECHO",
        text: "Lotte's Note.",
        nextNodeId: "scene_case01_lotte_warning",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          }
        ],
        inlineText: "**[Лотте]**:\n— Я видела, как вы смотрели на моё расписание в поезде, детектив. Надеюсь, вы нашли там то, что искали. Или хотя бы то, что поможет вам не опаздывать."
      },
      {
        id: "CASE01_LOTTE_CONFRONT_SCHEDULE",
        text: "Ask why her train notes kept time instead of names.",
        nextNodeId: "scene_case01_lotte_schedule_opening",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.noticedLotteSchedule,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_LOTTE_LISTENER_OPENING",
        text: "Let the silence do some of the work before you answer.",
        nextNodeId: "scene_case01_lotte_listener_opening",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.silentObservation,
            value: true,
          },
          {
            type: "logic_not",
            condition: {
              type: "flag_equals",
              key: CASE01_DINING_FLAGS.noticedLotteSchedule,
              value: true,
            },
          },
        ],
      },
      {
        id: "CASE01_LOTTE_TRUST",
        text: "Thank her and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_DISTANCE",
        text: "Keep it professional and tell her to stay off the record.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_listener_opening",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Listener on the Wire",
    bodyOverride:
      "You do not fill the hiss with a question. For three seconds the line carries only the room around her: switchboard clicks, paper shifting, one careful breath.\n\n'Still listening,' Lotte says. 'Good. Most men only pause long enough to reload their own certainty.'\n\nThe warning has not changed, but its first edge is yours now.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "CASE01_LOTTE_LISTENER_TRUST",
        text: "Keep the line open and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_LISTENER_DISTANCE",
        text: "Keep the silence professional and tell her to stay off the record.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_schedule_opening",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Time on the Wire",
    bodyOverride:
      "**[Detective]**:\n-- In the train, you were not taking notes. You were keeping time.\n\n**[Lotte]**:\n-- Time keeps itself. I only mark when people pretend they arrived by chance.\n\nThe line hisses around her answer. She does not deny the schedule; she only waits to see whether you understand what a schedule can accuse.",
    characterId: "npc_weber_dispatcher",
    choices: [
      {
        id: "CASE01_LOTTE_SCHEDULE_TRUST",
        text: "Use the timing and ask for one more quiet relay.",
        nextNodeId: "scene_case01_lotte_trust",
      },
      {
        id: "CASE01_LOTTE_SCHEDULE_DISTANCE",
        text: "Keep the timing off the record and set a boundary.",
        nextNodeId: "scene_case01_lotte_distance",
      },
    ],
  },
  {
    id: "scene_case01_lotte_trust",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Channel Preserved",
    bodyOverride:
      "Lotte does not soften, but she does stay on the line. The warning becomes a working channel instead of a courtesy.",
    terminal: true,
    characterId: "npc_weber_dispatcher",
    onEnter: [
      { type: "set_flag", key: "lotte_interlude_complete", value: true },
      { type: "set_flag", key: "lotte_warning_heeded", value: true },
      {
        type: "change_relationship",
        characterId: "npc_weber_dispatcher",
        delta: 1,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_lotte_distance",
    scenarioId: CASE01_SCENARIO_IDS.lotteInterlude,
    sourcePath: "40_GameViewer/Case01/Plot/04_Leads/scene_lotte_interlude.md",
    titleOverride: "Channel Narrowed",
    bodyOverride:
      "She accepts the distance faster than you wanted her to. The warning stands, but the next call will cost more trust than this one did.",
    terminal: true,
    characterId: "npc_weber_dispatcher",
    onEnter: [
      { type: "set_flag", key: "lotte_interlude_complete", value: true },
      { type: "set_flag", key: "lotte_warning_heeded", value: false },
      {
        type: "change_relationship",
        characterId: "npc_weber_dispatcher",
        delta: -1,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_zum_goldenen_adler_entry",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_entry.md",
    titleOverride: "Zum Goldenen Adler",
    bodyOverride:
      "The inn keeps its warmth behind polished wood and practiced discretion. Your room is reserved, your name is legible in the register, and the clerk has already decided which parts of your arrival are ordinary enough to say aloud.",
    choices: [
      {
        id: "CASE01_zum_goldenen_adler_LOTTE_ROUTE",
        text: "Ask why the route was ready before you arrived.",
        nextNodeId: "scene_case01_zum_goldenen_adler_lotte_route",
        visibleIfAll: [
          {
            type: "flag_equals",
            key: CASE01_DINING_FLAGS.askedLodgingRoute,
            value: true,
          },
        ],
      },
      {
        id: "CASE01_zum_goldenen_adler_SETTLE",
        text: "Take the room and keep the inn out of the file for now.",
        nextNodeId: "scene_case01_zum_goldenen_adler_settle",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_lotte_route",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_lotte_route.md",
    titleOverride: "Route Already Marked",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_BLOTTER,
    bodyOverride:
      "The clerk lowers his eyes to the register. 'Fraulein Weber asked whether the room would be aired before the noon rush. She did not ask twice.'\n\nOn the blotter lies a timetable corner, folded once. 08:41 is underlined; not in ink, but by pressure.\n\nFreiburg has not followed you. Not yet. It has simply prepared a chair where your question said you might sit.",
    choices: [
      {
        id: "CASE01_zum_goldenen_adler_ROUTE_SETTLE",
        text: "Leave the timetable where it is and take the key.",
        nextNodeId: "scene_case01_zum_goldenen_adler_settle",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_settle",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_settle.md",
    titleOverride: "Key Taken",
    bodyOverride:
      "The key is plain brass, heavier than it looks. Whatever else Zum Goldenen Adler knows, it can wait behind a locked door while the city begins to spend its morning.",
    choices: [
      {
        id: "CASE01_zum_goldenen_adler_SETTLE_TO_MORNING",
        text: "Take coffee in the lobby before the day begins.",
        nextNodeId: "scene_case01_zum_goldenen_adler_morning",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_morning",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_morning.md",
    titleOverride: "Lobby, Morning Coffee",
    bodyOverride:
      "Morning sets the lobby into a measured rhythm: the clerk at the desk, an old porter sweeping the threshold, the day's paper folded twice and placed beside your cup. The fire is low and the carpet still holds yesterday's footprints.\n\nA woman descends from the upper floor. Black travel dress, Hartmann rings catching the sconce-light, a posture that does not adjust for staircases. You have seen her before — the dining car the day before, the noble who asked you, with a smile too even for hospitality, to keep an eye on her son Felix.\n\nShe is half a flight away. The lobby is small enough that it will not pass for coincidence.",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    narrativeLayout: "log",
    sceneGroupId: "hotel_lobby",
    choices: [
      {
        id: "DETECTIVE_LOBBY_OBSERVE",
        text: "[Crime Scene Reconstruction] Read her morning before she reads yours.",
        nextNodeId: "scene_case01_zum_goldenen_adler_morning_depart",
        effects: [
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_detective", value: true },
        ],
        inlineText:
          "**[Reconstruction]**:\nHem disturbed at the right side — once, sharply, last night. Glove cuff at her left wrist is fresh, the right is yesterday's. The pulse at her temple is one count slow for a woman descending a staircase: she is composing it. No widow's mourning crepe, but the ring on her index finger has lost a polish point — a clean hand made unclean once and washed too well. The file in your memory writes her down without asking your permission.",
      },
      {
        id: "DETECTIVE_LOBBY_NEWSPAPER",
        text: "Return to the newspaper. Strangers in inns are not your case.",
        nextNodeId: "scene_case01_zum_goldenen_adler_morning_depart",
        effects: [
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_detective", value: true },
        ],
        inlineText:
          "**[Narrator]**:\nThe column under your thumb is about the postal car at the bank. You do not look up. You let the inn be the inn. But the metallic note in the air behind you arrives at the page a full second before her shadow does, and the part of you that earns its salary writes both into the same line of the same notebook.",
      },
      {
        id: "DETECTIVE_LOBBY_GREET",
        text: "Rise a quarter inch and offer the small civility she expects.",
        nextNodeId: "scene_case01_zum_goldenen_adler_morning_depart",
        effects: [
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_detective", value: true },
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_witch", value: true },
        ],
        inlineText:
          "**[Detective]**:\n— Frau Hartmann. Good morning. Felix marked the 08:41 timetable correctly.\n\n**[Eleonora]**:\n— Detective. Good morning. I hope Freiburg has been hospitable.\n\n**[Narrator]**:\nThe paper goes down only as far as politeness requires and comes back up. Whatever else you have learned in this lobby, you have learned it before either of you spoke.",
      },
    ],
  },
  {
    id: "scene_case01_zum_goldenen_adler_morning_depart",
    scenarioId: CASE01_SCENARIO_IDS.lodgingZumGoldenenAdler,
    sourcePath: "40_GameViewer/Case01/_runtime/case01_lodging_zum_goldenen_adler/scene_case01_zum_goldenen_adler_morning.md",
    titleOverride: "Out into the City",
    bodyOverride:
      "The cup goes back to the saucer empty. The lobby keeps its rhythm whether you stay or leave, and the city outside has its own appointments. You take the key off the hook, fold the paper under your arm, and step out into Freiburg's working morning.",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    narrativeLayout: "log",
    sceneGroupId: "hotel_lobby",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_case01_convergence_gate",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_rathaus_hearing.md",
    titleOverride: "Convergence Gate",
    bodyOverride:
      "With at least two bundles locked, the case stops being a hunt for fragments and becomes a choice of pressure. You can force the records open through the Rathaus, or move through the workers and shadow traffic before the official story catches up.",
    choices: [
      {
        id: "CASE01_CONVERGENCE_OFFICIAL",
        text: "Commit to the official route through the Rathaus.",
        nextNodeId: "scene_case01_convergence_official",
      },
      {
        id: "CASE01_CONVERGENCE_COVERT",
        text: "Commit to the covert route through the workers' channel.",
        nextNodeId: "scene_case01_convergence_covert",
      },
    ],
  },
  {
    id: "scene_case01_convergence_official",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_rathaus_hearing.md",
    titleOverride: "Official Route Set",
    bodyOverride:
      "You choose paper, seals, and public leverage. The next move will be legal on its face and expensive in every other sense.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "convergence_gate_seen", value: true },
      {
        type: "set_var",
        key: "convergence_route",
        value: CASE01_ROUTE_VALUE_OFFICIAL,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_convergence_covert",
    scenarioId: CASE01_SCENARIO_IDS.convergence,
    sourcePath:
      "40_GameViewer/Case01/Plot/05_Convergence/scene_workers_backchannel.md",
    titleOverride: "Covert Route Set",
    bodyOverride:
      "You choose informants, timing, and deniable access. The next move will be faster, dirtier, and much harder to explain afterward.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "convergence_gate_seen", value: true },
      {
        type: "set_var",
        key: "convergence_route",
        value: CASE01_ROUTE_VALUE_COVERT,
      },
    ],
    choices: [],
  },
  {
    id: "scene_case01_archive_entry",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Archive Warrant Run",
    bodyOverride:
      "The archive keeper does not resist the warrant. He resists the pace. Every registry you ask for creates another way to lose the night, unless you can chain the documents together faster than the bank can move its own answer into the file.",
    characterId: "npc_archivist_otto",
    choices: [
      {
        id: "CASE01_ARCHIVE_SORT",
        text: "Chain the warrants and force the archive to answer as one system.",
        nextNodeId: "scene_case01_archive_checks",
        skillCheck: {
          id: "check_case01_archive_logic",
          voiceId: "attr_logic",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_archive_checks",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_archive_checks",
            effects: [{ type: "add_tension", amount: 1 }],
          },
        },
      },
    ],
  },
  {
    id: "scene_case01_archive_checks",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Fail-Forward Records",
    backgroundUrl: CASE01_BG_ARCHIVE_LEDGER,
    bodyOverride:
      "Three ledgers later, the archive gives way. The warehouse is no longer rumor. It is an address, a delivery window, and a signature chain pointing back to Galdermann's side of the case.",
    choices: [
      {
        id: "CASE01_ARCHIVE_LOCK",
        text: "Lock the warrant package and move on the warehouse.",
        nextNodeId: "scene_case01_archive_exit",
      },
    ],
  },
  {
    id: "scene_case01_archive_exit",
    scenarioId: CASE01_SCENARIO_IDS.archiveRun,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_archive_warrant_run.md",
    titleOverride: "Official Entry Ready",
    bodyOverride:
      "The paperwork is finally sharp enough to cut with. You can hit the warehouse in daylight and call it lawful when the shouting starts.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "warrant_ready", value: true },
      { type: "set_flag", key: "warehouse_plan_locked", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_warehouse" },
    ],
    choices: [],
  },
  {
    id: "scene_case01_rail_entry",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Rail Yard Tail",
    bodyOverride:
      "The yard is moving even before midnight. Workers who never saw you before decide not to remember you, and that is the best kind of permission you are going to get on this route.",
    choices: [
      {
        id: "CASE01_RAIL_BLEND",
        text: "Blend with the shift change and follow the shadow traffic.",
        nextNodeId: "scene_case01_rail_tail",
        skillCheck: {
          id: "check_case01_rail_stealth",
          voiceId: "attr_stealth",
          difficulty: 11,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_rail_tail",
            effects: [{ type: "grant_xp", amount: 10 }],
          },
          onFail: {
            nextNodeId: "scene_case01_rail_tail",
            effects: [{ type: "add_heat", amount: 1 }],
          },
        },
      },
    ],
  },
  {
    id: "scene_case01_rail_tail",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Covert Entry Window",
    bodyOverride:
      "The tail confirms what the pub only suggested: the warehouse is live, the guards are being rotated, and one quiet breach is still possible before the ledgers leave the district.",
    choices: [
      {
        id: "CASE01_RAIL_LOCK",
        text: "Keep the route quiet and move before dawn.",
        nextNodeId: "scene_case01_rail_exit",
      },
    ],
  },
  {
    id: "scene_case01_rail_exit",
    scenarioId: CASE01_SCENARIO_IDS.railYardTail,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_rail_yard_shadow_tail.md",
    titleOverride: "Covert Entry Ready",
    bodyOverride:
      "You now have a real breach window. It will never look clean, but it will get you inside before the official story can catch the evidence.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "covert_entry_ready", value: true },
      { type: "set_flag", key: "warehouse_plan_locked", value: true },
      { type: "unlock_group", groupId: "loc_freiburg_warehouse" },
    ],
    choices: [],
  },
  {
    id: "scene_case01_warehouse_entry",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Warehouse Door",
    bodyOverride:
      "The warehouse smells of wet timber, ledger ink, and a job that expected to end before witnesses arrived. Galdermann is not alone, but he is the one who understands what the room means if you leave with the right papers.",
    choices: [
      {
        id: "CASE01_WAREHOUSE_TRACE_SAPPER_OFFICIAL",
        text: "Hold the room under warrant and identify the trained hand behind the cut.",
        nextNodeId: "scene_case01_sapper_flashback",
        visibleIfAll: [...officialRouteConditions],
      },
      {
        id: "CASE01_WAREHOUSE_TRACE_SAPPER_COVERT",
        text: "Keep the ledger quiet and identify the trained hand behind the cut.",
        nextNodeId: "scene_case01_sapper_flashback",
        visibleIfAll: [...covertRouteConditions],
      },
    ],
  },
  {
    id: "scene_case01_sapper_flashback",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/_runtime/case01_warehouse_finale/scene_case01_sapper_flashback.md",
    titleOverride: "The Clean Cut",
    characterId: "npc_albrecht_stoll",
    bodyOverride:
      "The memory comes out of order: a chemical glove, a packed charge, magnesium and iron oxide weighed twice by lamplight. The bank box blooms white-hot, but the room is left standing. A postman's coat sits badly on military shoulders. The spent canister is tied with black-yellow twine from habit, not panic. This was not a burglar's violence. It was an engineer's cut.",
    onEnter: [
      { type: "set_flag", key: "case01_sapper_profiled", value: true },
      { type: "set_flag", key: "false_trail_post_route_refuted", value: true },
    ],
    choices: [
      {
        id: "CASE01_SAPPER_FLASHBACK_LOGIC",
        text: "(Logic) A daytime breach on that timetable needs a trained demolition hand.",
        nextNodeId: "scene_case01_warehouse_sapper",
      },
      {
        id: "CASE01_SAPPER_FLASHBACK_PERCEPTION",
        text: "(Perception) The slag ratio and the burned cuffs are the same signature.",
        nextNodeId: "scene_case01_warehouse_sapper",
      },
    ],
  },
  {
    id: "scene_case01_warehouse_sapper",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/_runtime/case01_warehouse_finale/scene_case01_warehouse_sapper.md",
    titleOverride: "The Technical Guard",
    characterId: "npc_albrecht_stoll",
    bodyOverride:
      "Galdermann is not alone. The second man stands like a position to be held: broad shoulders, chemical gloves still on, a postman's coat that cannot teach his body to stop being an officer. He looks at the slag photographs and relaxes into recognition. \"You found the cut,\" he says. \"Then you know I left the building standing. A thief would have wrecked the room.\" He denies being a thief, not the thermite.",
    choices: [
      {
        id: "CASE01_WAREHOUSE_SAPPER_LAWFUL",
        text: "Seal the floor, call the warrant, and force a lawful close.",
        nextNodeId: "scene_case01_warehouse_lawful",
        visibleIfAll: [...officialRouteConditions],
      },
      {
        id: "CASE01_WAREHOUSE_SAPPER_NEGOTIATE",
        text: "Use the bureau ledger and force a compromised truth instead of a public one.",
        nextNodeId: "scene_case01_warehouse_compromised",
        visibleIfAll: [...covertRouteConditions],
      },
    ],
  },
  {
    id: "scene_case01_warehouse_lawful",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Lawful Close",
    backgroundUrl: CASE01_BG_WAREHOUSE_LAWFUL,
    bodyOverride:
      "Galdermann folds when the warrant lands and the archive chain holds. The case closes in public, the network survives offstage, and the University thread is all that remains obvious enough to chase next.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "case_resolved", value: true },
      { type: "set_flag", key: "case01_resolved_lawful", value: true },
      {
        type: "set_flag",
        key: "case02_hook_university_network",
        value: true,
      },
      {
        type: "set_var",
        key: "case01_final_outcome",
        value: CASE01_FINAL_OUTCOME_LAWFUL,
      },
      { type: "grant_xp", amount: 25 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_warehouse_compromised",
    scenarioId: CASE01_SCENARIO_IDS.warehouseFinale,
    sourcePath:
      "40_GameViewer/Case01/Plot/06_Resolution/scene_warehouse_finale.md",
    titleOverride: "Compromised Truth",
    backgroundUrl: CASE01_BG_WAREHOUSE_COMPROMISED,
    bodyOverride:
      "You close the visible case, but only by leaving the bureau thread alive enough to watch. Galdermann becomes the public culprit, the network goes to ground, and the University connection is now the only doorway that still opens forward.",
    terminal: true,
    onEnter: [
      { type: "set_flag", key: "case_resolved", value: true },
      { type: "set_flag", key: "case01_resolved_compromise", value: true },
      {
        type: "set_flag",
        key: "case02_hook_university_network",
        value: true,
      },
      {
        type: "set_var",
        key: "case01_final_outcome",
        value: CASE01_FINAL_OUTCOME_COMPROMISED,
      },
      { type: "grant_xp", amount: 25 },
    ],
    choices: [],
  },
  {
    id: "scene_case01_estate_arrival_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Поместье Гранд-Эстейт",
    bodyOverride:
      "**[Narrator]**:\nСумерки лениво опускаются на Фрайбург, когда твой экипаж подъезжает к кованым воротам поместья Гранд-Эстейт. Феликс остался в отеле «Zum Goldenen Adler» распаковывать чемоданы, полностью уверенный, что его мать занимается скучными юридическими тонкостями.\n\nОн не знает о твоей двойной жизни. Он не знает о секретном Бюро по борьбе с мистикой. Для него Фрайбург — это шанс на новую жизнь. Для тебя — новое поле битвы.\n\nТы расправляешь складки своего пальто, прижимая к груди кожаную папку с официальной печатью прикомандированного инспектора Бюро. Баронесса Элиза уже ждет тебя в своем кабинете.",
    backgroundUrl: CASE01_BG_ESTATE_GATES,
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "AUTO_CONTINUE_ESTATE_ARRIVAL_WITCH",
        text: "Войти в поместье.",
        nextNodeId: "scene_case01_baroness_office_witch"
      }
    ]
  },
  {
    id: "scene_case01_baroness_office_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Кабинет Баронессы",
    bodyOverride:
      "**[Narrator]**:\nВ кабинете Баронессы тепло и пахнет дорогим воском. Камин тихо потрескивает, отбрасывая длинные тени на дубовые панели. Баронесса Элиза фон Альтенбург — властная женщина с холодным прищуром — сидит за массивным столом, перебирая письма костяным ножом для бумаги.\n\n**[Баронесса Элиза]**:\n— Рада приветствовать вас, госпожа Вэнс. В Бюро прислали весьма... выдающегося инспектора. Признаться, я удивлена, что ваше ведомство заинтересовалось моими делами. Или слухи о «холодных сквозняках» в погребе теперь приравнены к государственной измене?",
    backgroundUrl: CASE01_BG_BARONESS_STUDY,
    characterId: "npc_baroness_elise",
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "WITCH_BARONESS_PRESS",
        text: "«Бюро расследует любые аномалии, Баронесса. Особенно те, что мешают экспорту.»",
        nextNodeId: "scene_case01_baroness_office_cut_trigger",
        inlineText:
          "**[Элеонора]**:\n— Бюро расследует любые аномалии, Баронесса. Особенно те, что мешают вашему экспорту. Давайте опустим формальности. Что именно произошло в вашем погребе?\n\n**[Narrator]**:\nБаронесса бледнеет, но быстро берет себя в руки. Шантаж Бюро пугает её сильнее, чем мертвецы."
      },
      {
        id: "WITCH_BARONESS_BRIBE",
        text: "Предложить Баронессе негласный компромисс.",
        nextNodeId: "scene_case01_baroness_office_cut_trigger",
        effects: [
          { type: "set_flag", key: "flag_witch_baroness_deal", value: true }
        ],
        inlineText:
          "**[Элеонора]**:\n— Давайте будем откровенны. Я могу составить отчет так, что Бюро спишет всё на температурные перепады... Если вы поможете списать долги моей семьи в Банкхаусе Кребса.\n\n**[Баронесса Элиза]** *(понижая голос)*:\n— Вы на редкость практичная женщина, Элеонора. Считайте, что сделка заключена... Но сперва избавьте меня от Фридриха в погребе. Он мешает моим людям."
      }
    ]
  },
  {
    id: "scene_case01_baroness_office_cut_trigger",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Порез",
    bodyOverride:
      "**[Narrator]**:\nБаронесса Элиза с силой проводит костяным ножом по плотному конверту очередного письма. Внезапно лезвие срывается и глубоко врезается в её указательный палец. Она с шипением роняет нож.\n\n**[Баронесса Элиза]**:\n— Ах!.. Черт бы взял эту дешевую бумагу...\n\n**[Narrator]**:\nНа лакированное дерево стола начинает быстро капать густая, ярко-алая кровь. В прохладной тишине кабинета ты буквально физически чувствуешь исходящий от неё соматический жар.\n\nВ твоем сознании мгновенно вспыхивает ледяной огонь Зверя. Пальцы сводит судорогой от Жажды проклятия.",
    backgroundUrl: CASE01_BG_BARONESS_STUDY,
    characterId: "npc_baroness_elise",
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "WITCH_BARONESS_RESIST_SUPPRESSANT",
        text: "[Composure] Сдержать Зверя (Супрессант активен).",
        nextNodeId: "scene_case01_estate_vaults_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_took_suppressant", value: true }
        ],
        passiveChecks: [
          {
            id: "check_baroness_resist_easy",
            voiceId: "attr_composure",
            difficulty: 4,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              effects: [
                { type: "add_var", key: "witch_blood_curse_pressure", value: 20 },
                { type: "set_flag", key: "flag_witch_somatic_exhaustion", value: true }
              ],
              inlineText:
                "**[Composure — Успех]**:\nСупрессант Мастера действует. Ты сжимаешь кулаки, усмиряя вспышку Жажды. Твое лицо остается безупречной маской благородства. Ты протягиваешь ей свой платок.\n\n**[Элеонора]**:\n— Позвольте, Баронесса. Рана глубокая. Будьте осторожны с серебряными лезвиями.\n\n**[Narrator]**:\nТы сохраняешь идеальную маску, но тело сковывает дикий озноб: ты получаешь дебафф «Соматическое истощение» (-2 к физическим действиям в подземельях)."
            },
            onFail: {
              effects: [
                { type: "set_flag", key: "flag_witch_baroness_suspicious", value: true }
              ],
              inlineText:
                "**[Composure — Провал]**:\nДаже под супрессантом твои глаза хищно расширяются, впиваясь в рану. Твои руки дрожат. Баронесса замечает этот жуткий, нечеловеческий взгляд и в испуге прижимает порезанную руку к груди, бледнея от подозрения."
            }
          }
        ]
      },
      {
        id: "WITCH_BARONESS_RESIST_RELIC",
        text: "[Composure] Сдержать Зверя (Зверь взвинчен реликвией).",
        nextNodeId: "scene_case01_estate_vaults_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_siphoned_relic", value: true }
        ],
        passiveChecks: [
          {
            id: "check_baroness_resist_hard",
            voiceId: "attr_composure",
            difficulty: 9,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              effects: [
                { type: "add_var", key: "witch_blood_curse_pressure", value: 20 },
                { type: "set_flag", key: "flag_witch_somatic_exhaustion", value: true }
              ],
              inlineText:
                "**[Composure — Успех]**:\nНевероятным усилием воли ты подавляешь бешеный рев Зверя внутри. Руки каменеют, но фасад сохранен. Ты протягиваешь ей платок.\n\n**[Элеонора]**:\n— Возьмите, Баронесса. Это согреет рану. Нож слишком острый.\n\n**[Narrator]**:\nТы сохранила Маскарад, но твое тело истощено борьбой с проклятием: ты получаешь дебафф «Соматическое истощение» (-2 к физическим действиям в подземельях)."
            },
            onFail: {
              effects: [
                { type: "set_flag", key: "flag_witch_baroness_suspicious", value: true }
              ],
              inlineText:
                "**[Composure — Провал]**:\nСила реликвии бьет по венам, лишая контроля. Твои губы приоткрываются, обнажая клыки. Баронесса видит твое искаженное жаждой лицо и в ужасе отскакивает от стола, прижимая раненый палец к груди."
            }
          }
        ]
      },
      {
        id: "WITCH_BARONESS_FEED",
        text: "[Somatic Feed] Поддаться Жажде и слизать свежую кровь.",
        nextNodeId: "scene_case01_baroness_office_feed_coverup",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -25 }
        ],
        inlineText:
          "**[Narrator]**:\nЗверь побеждает. Сделав молниеносное движение, ты перехватываешь её руку и прижимает раненый палец к своим губам. Горячая, сладкая кровь обжигает язык, мгновенно принося блаженное облегчение и гася пожар проклятия.\n\nБаронесса застывает в немом ужасе, бледная как смерть, пытаясь вырвать ладонь. Ты должна немедленно спасти Маскарад!"
      }
    ]
  },
  {
    id: "scene_case01_baroness_office_feed_coverup",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Маскарад",
    bodyOverride:
      "**[Narrator]**:\nБаронесса Элиза в ужасе смотрит на тебя, её дыхание прерывистое, она готова закричать и позвать слуг. У тебя есть секунды, чтобы оправдать свое чудовищное поведение.",
    backgroundUrl: CASE01_BG_BARONESS_STUDY,
    characterId: "npc_baroness_elise",
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "WITCH_BARONESS_COVER_PROTOCOL",
        text: "«Это стандартный эктоплазменный протокол Бюро...» (Ложь про тест).",
        nextNodeId: "scene_case01_estate_vaults_witch",
        passiveChecks: [
          {
            id: "check_baroness_cover_deception",
            voiceId: "attr_deception",
            difficulty: 6,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              inlineText:
                "**[Deception — Успех]**:\nТы холодно отпускаешь её руку и уверенно заявляешь:\n\n**[Элеонора]**:\n— Успокойтесь, Баронесса. Это стандартная эктоплазменная проба Бюро. Кровь на серебряном ноже — идеальный проводник. Я должна была лично убедиться, что дух счетовода не оставил на вас соматического следа. Рана чиста, опасности нет.\n\n**[Narrator]**:\nБаронесса шокирована «дикими методами» тайного ведомства, но верит твоему ледяному авторитету. Она молча забинтовывает палец."
            },
            onFail: {
              effects: [
                { type: "set_flag", key: "flag_witch_baroness_suspicious", value: true }
              ],
              inlineText:
                "**[Deception — Провал]**:\nТвой голос дрожит от остаточного экстаза. Баронесса не верит ни одному слову. Она считает тебя безумной оккультисткой и приказывает слугам вывести тебя, запирая архивы на ключ."
            }
          }
        ]
      },
      {
        id: "WITCH_BARONESS_COVER_SUGGESTION",
        text: "[Suggestion] Использовать выпитую кровь для стирания памяти.",
        nextNodeId: "scene_case01_estate_vaults_witch",
        passiveChecks: [
          {
            id: "check_baroness_cover_suggestion",
            voiceId: "attr_intuition",
            difficulty: 5,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              inlineText:
                "**[Suggestion — Успех]**:\nСвежая кровь Баронессы в твоих жилах открывает прямой канал к её разуму. Ты заглядываешь в её расширенные зрачки и шепчешь соматический приказ:\n\n**[Элеонора]**:\n— Элиза... Посмотрите на меня. Вы просто порезались ножом. Я протянула вам платок. Вы вытерли кровь. Ничего больше не произошло...\n\n**[Narrator]**:\nВзгляд Баронессы стекленеет. Она моргает, её дыхание выравнивается. Она берет твой платок, искренне веря, что ты просто помогла ей. Кошмарное мгновение стерто из её памяти!"
            },
            onFail: {
              effects: [
                { type: "set_flag", key: "flag_witch_baroness_suspicious", value: true }
              ],
              inlineText:
                "**[Suggestion — Провал]**:\nТвоя воля наталкивается на жесткий блок её собственного эго. Баронесса с криком вырывает руку, зовет охрану и приказывает запереть перед тобой все двери подземелий."
            }
          }
        ]
      }
    ]
  },
  {
    id: "scene_case01_estate_vaults_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Холодные Архивы",
    bodyOverride:
      "**[Narrator]**:\nСпустившись под каменные своды поместья Гранд-Эстейт, ты оказываешься в холодных архивах. Стены покрыты инеем, изо рта идет пар.\n\nЕсли ты страдаешь от «Соматического истощения» (активно сдерживала Зверя), твои руки дрожат от озноба, что накладывает штраф -2 к любым действиям скрытности (Stealth) или взлома (Intrusion). Однако онемение тела дает тебе полный иммунитет к духовным ледяным ловушкам призрака.\n\nТебе нужно согреться, чтобы вернуть ловкость. В темных углах коридора шныряют жирные крысы, а в кладовой впереди возится Саша: проверяет служебный замок и слушает дом так, будто пустые стены тоже умеют отдавать приказы.",
    backgroundUrl: CASE01_BG_ESTATE_VAULTS,
    characterId: "npc_sasha_hartmann_servant",
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "WITCH_VAULTS_FEED_RATS",
        text: "[Agility] Поймать крысу в углах подземелья и выпить её тепло.",
        nextNodeId: "scene_case01_ghost_showdown_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -10 },
          { type: "set_flag", key: "flag_witch_somatic_exhaustion", value: false }
        ],
        inlineText:
          "**[Narrator]**:\nТы бесшумно бросаешься на шорох и сжимаешь пальцы на теплом, пищащем тельце грызуна. Укус — и горячая животная кровь возвращает тепло твоим онемевшим рукам. Озноб и дебафф проходят. Это омерзительно, но спасительно для Маскарада."
      },
      {
        id: "WITCH_VAULTS_FEED_SASHA",
        text: "[Somatic Feed] Подстеречь в темноте Сашу и забрать его тепло.",
        nextNodeId: "scene_case01_ghost_showdown_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -25 },
          { type: "set_flag", key: "flag_witch_somatic_exhaustion", value: false },
          { type: "set_flag", key: "flag_witch_attacked_sasha", value: true },
          { type: "set_flag", key: "ghost_sasha_testimony_compromised", value: true },
          { type: "change_relationship", characterId: "npc_sasha_hartmann_servant", delta: -40 },
          { type: "change_faction_signal", factionId: "house_of_pledges", delta: -5, reason: "Witch fed on Sasha in the estate vaults" }
        ],
        inlineText:
          "**[Narrator]**:\nЗверь требует человеческого тепла. Ты настигаешь Сашу в темном проходе между стеллажами. Он разворачивается быстрее обычного слуги, но проклятие быстрее: ладонь зажимает ему рот, и ты делаешь жадный глоток жизни из сонной артерии.\n\nСаша не кричит. Он опускается на одно колено, тяжело дыша, и смотрит на вас без просьбы о объяснении. Дебафф снят, но рядом остается молчаливый свидетель, чье доверие сломано."
      },
      {
        id: "WITCH_VAULTS_PROCEED_COLD",
        text: "Продолжить исследование подземелий, преодолевая холод.",
        nextNodeId: "scene_case01_ghost_showdown_witch",
        inlineText:
          "**[Narrator]**:\nТы решаешь терпеть. Ты идешь сквозь морозные архивы со сжатыми зубами, дрожащими пальцами пытаясь перебирать старые бумаги в поисках скрытой латунной шкатулки с двойным дном."
      }
    ]
  },
  {
    id: "scene_case01_ghost_showdown_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Призрак Счетовода",
    onEnter: [
      { type: "set_flag", key: "met_friedrich_wagner_intro", value: true },
    ],
    bodyOverride:
      "**[Narrator]**:\nВ глубине самого холодного ледника ты находишь скрытую латунную шкатулку Баронессы. Но как только твои пальцы касаются замка, температура в помещении падает до абсолютного нуля. Иней мгновенно покрывает твои ресницы.\n\nПеред тобой из ледяного пара материализуется светящийся синевой дух Фридриха Вагнера — бывшего счетовода поместья. Его глаза пусты и покрыты льдом.\n\nОн был заперт в этой камере насмерть теневыми партнерами Баронессы из Bankhaus J.A. Krebs после того, как нашел леджер контрабанды. Баронесса знала об этом, выдала его партнерам и скрыла убийство. Дух жаждет правосудия.",
    backgroundUrl: CASE01_BG_GHOST_CELLAR,
    characterId: "npc_friedrich_wagner",
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    choices: [
      {
        id: "WITCH_GHOST_JUSTICE",
        text: "«Я клянусь разорить Баронессу и её партнеров по закону Бюро.» (Путь Правосудия).",
        nextNodeId: "scene_case01_night_alley_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -30 },
          { type: "set_flag", key: "flag_witch_ghost_freed", value: true },
          { type: "set_flag", key: "ghost_session_hook_spirit_bargain", value: true },
          { type: "grant_evidence", evidenceId: "ev_friedrich_ledger_testimony" },
          { type: "change_relationship", characterId: "npc_friedrich_wagner", delta: 20 }
        ],
        inlineText:
          "**[Элеонора]**:\n— Успокойся, Фридрих. Я — инспектор Бюро. Этот леджер станет приговором для Баронессы и её партнеров из Krebs. Я клянусь, что они ответят перед законом.\n\n**[Narrator]**:\nПризрак счетовода долго смотрит в твои глаза. Он видит твою непреклонную волю. С облегченным вздохом он отпускает шкатулку и растворяется в теплом сиянии, обретая покой. Твоя душа успокаивается, давление проклятия падает на -30."
      },
      {
        id: "WITCH_GHOST_SUBJUGATE",
        text: "[Spirit / Authority] Силой подчинить призрака своей воле и связать со своей тенью.",
        nextNodeId: "scene_case01_night_alley_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
          { type: "set_flag", key: "flag_witch_ghost_bound", value: true }
        ],
        passiveChecks: [
          {
            id: "check_ghost_subjugation",
            voiceId: "attr_authority",
            difficulty: 7,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              effects: [
                { type: "grant_evidence", evidenceId: "ev_friedrich_ledger_testimony" },
                { type: "change_relationship", characterId: "npc_friedrich_wagner", delta: -30 }
              ],
              inlineText:
                "**[Authority — Успех]**:\nТы отказываешься от человеческого суда. Направив на дух силу своей воли и соматического проклятия, ты ломаешь его сопротивление. Фридрих кричит, превращаясь в ледяной вихрь, который насильно втягивается в твою тень.\n\n**[Narrator]**:\nОтныне дух счетовода привязан к твоей тени в качестве Фамильяра. Ты забираешь леджер. Ты получаешь постоянный бонус +2 к Logic во 2-й Главе, но твоя аура остывает, и Феликс подсознательно начнет бояться тебя еще сильнее."
            },
            onFail: {
              effects: [
                { type: "add_var", key: "witch_blood_curse_pressure", value: 30 }
              ],
              inlineText:
                "**[Authority — Провал]**:\nДух счетовода дает яростный оккультный отпор. Ледяная волна отбрасывает тебя к стене, нанося огромный ментальный стресс и перегружая давление проклятия на +30. Ты забираешь леджер силой, но дух улетает, затаив лютую ненависть."
            }
          }
        ]
      },
      {
        id: "WITCH_GHOST_BANISH",
        text: "Сжечь леджер прямо перед призраком, исполняя сделку с Баронессой.",
        nextNodeId: "scene_case01_night_alley_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
          { type: "set_flag", key: "flag_witch_ghost_banished", value: true },
          { type: "change_relationship", characterId: "npc_friedrich_wagner", delta: -50 },
          { type: "change_faction_signal", factionId: "the_returned", delta: -10, reason: "Witch banished Friedrich and burned his ledger" }
        ],
        inlineText:
          "**[Narrator]**:\nТы достаешь спички и сжигаешь леджер контрабанды дотла на глазах у Фридриха. Призрак с воем ярости бросается на тебя, но ты проводишь жесткий ритуал изгнания, рассеивая его сущность в пустоту.\n\nТы исполнила сделку. Баронесса спишет твои долги. Но твоя совесть осквернена: ты получаешь +15 к моральному стрессу за укрывательство убийства и уничтожение улик."
      }
    ]
  },
  {
    id: "scene_case01_night_alley_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Ночной Переулок",
    onEnter: [
      { type: "set_flag", key: "met_krebs_mugger_intro", value: true },
    ],
    bodyOverride:
      "**[Narrator]**:\nНочь полностью поглотила Фрайбург, когда ты пешком возвращаешься в отель. Туман крадется по булыжной мостовой, гася редкие огни газовых фонарей. Внезапно из темного арочного прохода навстречу тебе делает шаг рослый бродяга с ржавым ножом в руке.\n\n**[Грабитель]**:\n— Тихо, госпожа... Без глупостей. Отдайте сумочку, кольца Hartmann, и пальто тоже снимайте... Снимай, говорю!",
    backgroundUrl: CASE01_BG_NIGHT_ALLEY,
    characterId: "npc_krebs_mugger",
    narrativeLayout: "log",
    sceneGroupId: "witch_freiburg_night",
    choices: [
      {
        id: "WITCH_MUGGER_PAYOFF",
        text: "«Возьмите кошелек. Здесь достаточно золота.» (Попытка откупиться).",
        nextNodeId: "scene_case01_night_alley_escalation",
        inlineText:
          "**[Элеонора]**:\n— Возьмите кошелек. Здесь достаточно, чтобы вы не делали глупостей. Пропустите меня.\n\n**[Narrator]**:\nГрабитель хватает тяжелый кошелек, но его глаза загораются жадностью при виде твоих перстней Hartmann. Он делает шаг вперед."
      },
      {
        id: "WITCH_MUGGER_THREATEN",
        text: "Попытаться запугать или пройти мимо него.",
        nextNodeId: "scene_case01_night_alley_escalation",
        inlineText:
          "**[Элеонора]**:\n— Пропустите меня, или этот переулок станет вашим склепом.\n\n**[Narrator]**:\nГрабитель хрипло хохочет, принимая твое предупреждение за обычный женский испуг. Он преграждает дорогу."
      }
    ]
  },
  {
    id: "scene_case01_night_alley_escalation",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Срыв",
    bodyOverride:
      "**[Narrator]**:\nГрабитель грубо хватает тебя за воротник и прижимает холодное лезвие ножа прямо к твоему горлу, обдавая запахом дешевого джина.\n\n**[Грабитель]**:\n— Ты мне зубы не заговаривай! Живо снимай кольца, а то горло перережу!\n\n**[Narrator]**:\nХолодная сталь у горла и угроза жизни срывают последние тормоза проклятия. Вспыхивает первобытный инстинкт выживания. На сверхчеловеческой скорости (`Somatic Haste`) ты перехватываешь его запястье и применяешь силу. С омерзительным сухим **хрустом** его кости ломаются. Грабитель кричит, роняя нож.\n\nИз раны брызжет горячая кровь. Запах свежей крови в морозном тумане окончательно лишает тебя контроля. Ты вжимаешь его в кирпичную стену и вонзаешь клыки в его шею.",
    backgroundUrl: CASE01_BG_NIGHT_ALLEY,
    characterId: "npc_krebs_mugger",
    narrativeLayout: "log",
    sceneGroupId: "witch_freiburg_night",
    choices: [
      {
        id: "WITCH_MUGGER_SIPHON_BREAK",
        text: "[Composure] Попытаться оторвать себя от жертвы и сохранить жизнь человеку.",
        nextNodeId: "scene_case01_hotel_morning_witch",
        skillCheck: {
            id: "check_mugger_siphon_break",
            voiceId: "attr_composure",
            difficulty: 8,
            showChancePercent: false,
            onSuccess: {
              nextNodeId: "scene_case01_hotel_morning_witch",
              effects: [
                { type: "add_var", key: "witch_blood_curse_pressure", value: -20 },
                { type: "set_flag", key: "flag_witch_mugger_survived", value: true },
                { type: "register_rumor", rumorId: "rumor_witch_mugger_survivor" }
              ],
              inlineText:
                "**[Composure — Успех]**:\nНевероятным усилием воли ты разжимаешь челюсти и отшвыриваешь грабителя от себя. Твои губы испачканы кровью, но человек жив. Он падает на булыжную мостовую, теряя сознание от шока и раны. Ты сбегаешь в туман. В живых остался свидетель, между вами образовалась Кровная Связь (Blood Bond)!"
            },
            onFail: {
              nextNodeId: "scene_case01_hotel_morning_witch",
              effects: [
                { type: "set_var", key: "witch_blood_curse_pressure", value: 0 },
                { type: "set_flag", key: "flag_witch_mugger_killed", value: true },
                { type: "add_heat", amount: 2 }
              ],
              inlineText:
                "**[Composure — Провал]**:\nТы не можешь остановиться. Вкус жизни опьяняет. Ты пьешь его до дна, пока его тело не обмякает. Передозировка соматической силы перегружает твой мозг, и ты впадаешь в глубокое беспамятство. В переулке остается труп, а в его кармане — зацепка банды Krebs."
            }
          }
      }
    ]
  },
  {
    id: "scene_case01_hotel_morning_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Утро после...",
    onEnter: [
      { type: "set_flag", key: "met_hotel_maid_intro", value: true },
    ],
    bodyOverride:
      "**[Narrator]**:\nСолнечные лучи пробиваются сквозь портьеры номера в отели «Zum Goldenen Adler». Ты просыпаешься на кровати в холодном поту. Голова раскалывается.\n\nЕсли ты провалила проверку воли ночью, твои воспоминания стерты, а на платье — засохшая кровь убитого грабителя. В твоем кармане обнаруживается записка банды Krebs с приказом убрать тебя. Если ты прервала сифон, грабитель выжил, но твоя одежда всё равно испачкана кровью.\n\nТебе нужно срочно избавиться от улик: с минуты на минуту в дверь номера постучится Феликс.",
    backgroundUrl: CASE01_BG_HOTEL_BEDROOM,
    characterId: "npc_hotel_maid",
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_morning",
    choices: [
      {
        id: "WITCH_MORNING_BRIBE_MAID",
        text: "Вызвать горничную и подкупить её для уничтожения платья (Социальный путь).",
        nextNodeId: "scene_case01_hotel_copper_trace_witch",
        effects: [
          { type: "set_flag", key: "flag_witch_maid_bribed", value: true },
          { type: "set_flag", key: "origin_witch_handoff_done", value: true },
          { type: "change_relationship", characterId: "npc_hotel_maid", delta: 10 }
        ],
        passiveChecks: [
          {
            id: "check_maid_bribe",
            voiceId: "attr_deception",
            difficulty: 5,
            showChancePercent: false,
            isPassive: true,
            onSuccess: {
              inlineText:
                "**[Deception — Успех]**:\nТы притворяешься, что ночью у тебя пошла носом сильная кровь из-за давления. С вежливой улыбкой ты отдаешь горничной испачканное платье, прижимая к её ладони тяжелый золотой кошель.\n\nГорничная понимающе и подобострастно кивает, обещая сжечь вещь без лишних вопросов. Улики уничтожены!"
            },
            onFail: {
              inlineText:
                "**[Deception — Провал]**:\nГорничная испуганно забирает платье с золотом, но её руки трясутся. Она шепчется с другими слугами о «странной окровавленной барыне», что разносит подозрительные слухи по отелю."
            }
          }
        ]
      },
      {
        id: "WITCH_MORNING_SORCERY_CLEANSE",
        text: "[Blood Sorcery] Использовать магию крови, чтобы впитать пролитую кровь кожей.",
        nextNodeId: "scene_case01_hotel_copper_trace_witch",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 15 },
          { type: "set_flag", key: "flag_witch_dress_cleansed", value: true },
          { type: "set_flag", key: "flag_witch_copper_smell", value: true },
          { type: "set_flag", key: "origin_witch_handoff_done", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nТы прижимаешь ладони к испачканному шелку платья. Сосредоточившись, ты приказываешь крови течь обратно. На твоих глазах багровые пятна бледнеют, впитываясь прямо сквозь поры твоей кожи. Платье очищается до нитки!\n\nНо впитывание чужой засохшей крови соматически оскверняет тебя (`Pressure +15`), а от платья начинает исходить едва уловимый, тревожный медный запах крови, который Феликс или Детектив могут почуять при личной встрече."
      }
    ]
  },
  {
    id: "scene_case01_hotel_copper_trace_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Медная нота",
    bodyOverride:
      "**[Narrator]**:\nКоридор отеля оживает обычными утренними звуками: щелчок посуды внизу, скрип половицы, приглушенный голос Феликса у двери. Номер выглядит достаточно прилично для случайного взгляда. Вопрос в том, достаточно ли он пахнет обычным утром.\n\nФеликс стучит костяшками пальцев и спрашивает, можно ли войти.",
    backgroundUrl: CASE01_BG_HOTEL_BEDROOM,
    characterId: "npc_felix_hartmann",
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_morning",
    choices: [
      {
        id: "WITCH_HOTEL_COPPER_TRACE_STEADY",
        text: "[Perception] Прочитать реакцию Феликса раньше, чем он поймет запах.",
        nextNodeId: "scene_case01_lobby_crossover_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_copper_smell", value: true }
        ],
        skillCheck: {
          id: "check_witch_felix_copper_smell",
          voiceId: "attr_perception",
          difficulty: 7,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_lobby_crossover_witch",
            inlineText:
              "**[Perception — Успех]**:\nТы замечаешь, как Феликс задерживает дыхание на долю секунды. Этого хватает: окно открыто, перчатки сняты, тон ровный. Запах растворяется в холодном утреннем воздухе прежде, чем становится вопросом."
          },
          onFail: {
            nextNodeId: "scene_case01_lobby_crossover_witch",
            effects: [
              {
                type: "set_flag",
                key: "flag_witch_felix_noticed_copper_smell",
                value: true
              }
            ],
            inlineText:
              "**[Perception — Провал]**:\nФеликс не говорит ничего прямо, но взгляд цепляется за платье, умывальник и слишком свежий воздух из открытого окна. Медная нота остается между вами как невысказанный вопрос."
          }
        }
      },
      {
        id: "AUTO_CONTINUE_WITCH_HOTEL_NO_COPPER_TRACE",
        text: "Впустить Феликса и вернуться к делу.",
        nextNodeId: "scene_case01_lobby_crossover_witch",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_copper_smell", value: false }
        ],
        inlineText:
          "**[Narrator]**:\nФеликс входит с папкой расписаний и ни о чем не спрашивает. Утро остается хрупким, но пока оно держится."
      }
    ]
  },
  {
    id: "scene_case01_lobby_crossover_witch",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Лобби «Zum Goldenen Adler»",
    bodyOverride:
      "**[Narrator]**:\nЛестница вниз — двенадцать ступеней полированного дуба. Лобби живёт обычным утром: щелчок ключей у стойки регистратора, чашка снизу звякает о блюдце, газета шуршит на низком столе у камина.\n\nЗа этим столом — мужчина лет двадцати семи, в дорожном пальто, с кофе и развёрнутой утренней газетой. Седеющий висок, ровная посадка, ничего лишнего в движении. Тот самый попутчик, которого Феликс почтительно называл «детективом» в вагоне-ресторане.\n\nОн ещё не поднял глаз. У тебя есть три ступени, чтобы решить, кем спуститься.",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_morning",
    choices: [
      {
        id: "WITCH_LOBBY_VEIL_SIGHT",
        text: "[Veil Sight] Сквозь пар над его чашкой считать, что он сейчас думает.",
        nextNodeId: "scene_case01_witch_estate_epilogue",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 10 },
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_witch", value: true }
        ],
        inlineText:
          "**[attr_spirit]**:\nЗавеса над его кофе тонкая, как папиросная бумага. Он не читает газету — он перечитывает одну колонку и считает дыхания у входной двери. Имя в его мыслях ровное и сухое: Элиас Торн. Он ждёт, кто спустится первым: владелец багажа из соседнего номера или тот, кто оставил запах меди в холле."
      },
      {
        id: "WITCH_LOBBY_COMPOSED_PASS",
        text: "[Composure] Спуститься как Hartmann: ровно, без взгляда в его сторону.",
        nextNodeId: "scene_case01_witch_estate_epilogue",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: -5 },
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_witch", value: true }
        ],
        inlineText:
          "**[Narrator]**:\nТы спускаешься с той скоростью, с какой Hartmann спускаются всю жизнь — ни быстрее, ни медленнее окружающей утренней рутины. Перчатки на руках, перстни наружу, осанка прямая. Газета не шелохнётся. Дверь швейцара открывается перед тобой раньше, чем ты успеваешь её заметить.",
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_copper_smell", value: false }
        ]
      },
      {
        id: "WITCH_LOBBY_COMPOSED_PASS_COPPER",
        text: "[Composure] Удержать запах меди и пройти мимо как ни в чём не бывало.",
        nextNodeId: "scene_case01_witch_estate_epilogue",
        effects: [
          { type: "add_var", key: "witch_blood_curse_pressure", value: 5 },
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_witch", value: true }
        ],
        visibleIfAll: [
          { type: "flag_equals", key: "flag_witch_copper_smell", value: true }
        ],
        skillCheck: {
          id: "check_lobby_witch_copper_pass",
          voiceId: "attr_composure",
          difficulty: 8,
          showChancePercent: true,
          onSuccess: {
            nextNodeId: "scene_case01_witch_estate_epilogue",
            inlineText:
              "**[Composure — Успех]**:\nТы проходишь между его столом и стойкой, и медь сворачивается обратно под кожу. Он не поднимает глаз. Газета у его пальцев чуть прогибается — он просто перевернул страницу."
          },
          onFail: {
            nextNodeId: "scene_case01_witch_estate_epilogue",
            effects: [
              { type: "set_flag", key: "flag_lobby_crossover_seen_by_detective", value: true }
            ],
            inlineText:
              "**[Composure — Провал]**:\nНа третьей ступени запах меди вырывается из складок твоего платья прежде, чем ты успеваешь его собрать. Детектив поднимает глаза от газеты — короткий профессиональный взгляд, скользящий по перчаткам, перстням, подолу. Он не говорит ничего. Но ты уже в его памяти, рядом с делом, которое ещё не названо."
          }
        }
      },
      {
        id: "WITCH_LOBBY_GREET",
        text: "Поприветствовать как знакомого с поезда: «Детектив. Доброе утро.»",
        nextNodeId: "scene_case01_witch_estate_epilogue",
        effects: [
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_witch", value: true },
          { type: "set_flag", key: "flag_lobby_crossover_seen_by_detective", value: true }
        ],
        inlineText:
          "**[Элеонора]**:\n— Детектив. Доброе утро. Надеюсь, Фрайбург оказал вам гостеприимство.\n\n**[Detective]**:\n— Frau Hartmann. Доброе. Передайте Феликсу: расписание на 08:41 он подчеркнул правильно.\n\n**[Narrator]**:\nКороткий кивок. Газета опускается на стол ровно настолько, чтобы это считалось вежливостью, и поднимается обратно. В его взгляде нет ни обвинения, ни любопытства — только аккуратная отметка о том, что вы оба сейчас в одном городе."
      }
    ]
  },
  {
    id: "scene_case01_witch_estate_epilogue",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "После особняка",
    bodyOverride:
      "**[Narrator]**:\nШвейцар придерживает дверь, и сырой фрайбургский воздух смыкается вокруг тебя. Дело Гранд-Эстейт закрыто — по крайней мере, для тех, кто читает официальные сводки.\n\n**[inner_guide]**:\nНо завеса не легла ровно. Там, где ты прошла сквозь холод, осталась трещина — тонкая, как волос, и такая же упрямая. Бюро удовлетворится отчётом. Ты — не обязана.",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_morning",
    choices: [
      {
        id: "WITCH_FINALE_CLOSE",
        text: "Закрыть дело. Фрайбург подождёт со своими тайнами.",
        nextNodeId: "scene_case01_witch_finale_closed",
      },
      {
        id: "WITCH_FINALE_ENTER_SANDBOX",
        text: "Вернуться к особняку: завеса всё ещё тревожна, и это не отпустит.",
        nextNodeId: "scene_case01_witch_finale_to_sandbox",
        effects: [
          { type: "set_flag", key: "witch_enter_ghost_sandbox", value: true },
        ],
      },
    ],
  },
  {
    id: "scene_case01_witch_finale_closed",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Дело закрыто",
    bodyOverride:
      "**[Narrator]**:\nТы оставляешь особняк позади вместе с его холодом. Отчёт ляжет на стол Мастера к вечеру, и в нём будет ровно столько правды, сколько Бюро готово прочитать. Остальное остаётся с тобой — и с завесой, которая помнит твоё имя.\n\nФрайбург ждёт. Впрочем, Фрайбург всегда ждёт.",
    backgroundUrl: CASE01_BG_zum_goldenen_adler_LOBBY,
    narrativeLayout: "log",
    sceneGroupId: "witch_hotel_morning",
    terminal: true,
    choices: [],
  },
  {
    id: "scene_case01_witch_finale_to_sandbox",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath:
      "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    titleOverride: "Завеса зовёт",
    bodyOverride:
      "**[Narrator]**:\nТы поворачиваешь не к вокзалу, а обратно — к туманным садам Гранд-Эстейт. Холодный след, который ты уже однажды прошла, ещё не остыл, и теперь ты идёшь по нему не по поручению Бюро, а по собственной воле.\n\n**[inner_guide]**:\nМы чувствуем это отсюда. Что-то в особняке осталось недосказанным. Пора услышать его до конца.",
    backgroundUrl: CASE01_BG_ESTATE_APPROACH,
    narrativeLayout: "log",
    sceneGroupId: "witch_grand_estate",
    terminal: true,
    choices: [],
  },
];
