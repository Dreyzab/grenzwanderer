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
const CASE01_TRAIN_DINING_CAR_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car.png`;
const CASE01_TRAIN_DINING_CAR_MOTHER_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_mother.png`;
const CASE01_PLATFORM_STILL_BG = `${CASE01_START_IMAGE_BASE_PATH}/Ankommen.png`;
const CASE01_HBF_BG = `${CASE01_START_IMAGE_BASE_PATH}/HBF.png`;
const CASE01_NEWSBOY_BG = `${CASE01_START_IMAGE_BASE_PATH}/boy_newspaper_styled.png`;
const CASE01_LUGGAGE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_luggage_counter_1776719222396.png`;
const CASE01_POLICE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_police_post_1776719605015.png`;
const CASE01_TRAIN_DINING_CAR_WINE_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_wine.png`;
const CASE01_TRAIN_DINING_CAR_FELIX_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_felix.png`;
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
const CASE01_BG_CONVERGENCE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_convergence_city_threshold.webp`;
const CASE01_BG_WAREHOUSE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_wet_timber.webp`;
const CASE01_BG_WAREHOUSE_LAWFUL = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_lawful_seal.webp`;
const CASE01_BG_WAREHOUSE_COMPROMISED = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_compromised_ledger.webp`;
const CASE01_BG_BANK_EXTERIOR = `${CASE01_ART_BG_BASE_PATH}/bg_case01_bank_exterior.webp`;
const CASE01_BG_BANK_HALL = `${CASE01_ART_BG_BASE_PATH}/bg_case01_bank_hall.webp`;
const CASE01_BG_BANK_OFFICE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_bank_office.webp`;
const CASE01_BG_BANK_VAULT = `${CASE01_ART_BG_BASE_PATH}/bg_case01_bank_vault.webp`;

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
    nodeIds: [
      "scene_case01_opening_arrival_video",
      "scene_case01_train_compartment_letter",
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
      "scene_case01_train_ankommen_video",
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
      "scene_case01_mayor_dossier",
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
    bodyOverride: "**[Элеонора]**:\n— Что ж, Феликс. Фрайбург не терпит опозданий. Детектив, присмотрите за ним. Он склонен теряться в… деталях, забывая о главном.\n\n**[Лотте]**:\n— На перроне лучше не останавливаться, детектив. Здесь даже прощания занимают очередь.\n\n**[Narrator]**:\nОни уходят в толпу — Элеонора и Лотте, плечом к плечу, негромко разговаривая. Рыжие волосы Лотте — последнее яркое пятно в сером паре перрона. За ними остаётся запах дорогого табака и след невысказанных обещаний.",
    backgroundUrl: CASE01_TRAIN_COMPARTMENT_BG,
    narrativeLayout: "fullscreen",
    sceneGroupId: "train_compartment",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_COMPARTMENT_CINEMA",
        text: "Continue.",
        nextNodeId: "scene_case01_train_compartment_letter",
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
    id: "scene_case01_train_assistant_intro",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nДверь в купе открывается со скрипом, и в проеме возникает высокая фигура с выдающимися скулами, из-за которых вошедший казался намного старше своих лет.\n\n**[Assistant]**:\n— Сэр, я проверил во время остановки: в газетах пусто, по радио тоже тишина.\n\n**[inner_cynic]**:\nТишина — это не отсутствие звука. Это присутствие чьей-то очень дорогой воли.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "assistant",
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
    bodyOverride: "**[Assistant]**:\n— Вы уверены, что это не розыгрыш?\n\n**[inspector]**:\n— Письмо было доставлено частной службой, а бумага и чернила, используемые в нем, стоят недешево. Что ж, узнаем по прибытии в отель.\n\n**[Assistant]**:\n— Вы правы, сэр. Не стали бы они арендовать нам номер просто так.",
    backgroundUrl: CASE01_TRAIN_ASSISTANT_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
    characterId: "assistant",
    choices: [
      {
        id: "AUTO_CONTINUE_SCENE_CASE01_TRAIN_DOOR_CREAKS",
        text: "Continue.",
        nextNodeId: "scene_case01_train_assistant_departure",
      },
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
    characterId: "assistant",
    choices: [
      {
        id: "CASE01_TRAIN_ASSISTANT_EAT_TOGETHER",
        text: "Wait for me! I've worked up an appetite�I need a bite to eat.",
        nextNodeId: CASE01_DINING_NODE_IDS.intro,
        effects: [
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.intro,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Narrator]**:\nThe dining car greets you with the chime of crystal and the scent of expensive tobacco. Felix leads the way with confidence through the rows of tables.\n\n**[Assistant]**:\n� Mother always finds company, even on a train. It seems she's already made an acquaintance. Try to be... indulgent with her directness.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
    bodyOverride: "**[Narrator]**:\nЗа угловым столиком расположилась матушка Феликса. Она неторопливо потягивала белое вино, внимательно слушая свою спутницу — девушку с ярко-рыжими волосами, которая что-то оживленно рассказывала, активно жестикулируя. Огненный цвет ее волос казался вызывающе ярким в приглушенном утреннем свете вагона.\n\n**[Redhead]**:\n— ...и этот чиновник всерьез грозился засадить телеграфную службу, потому что точки в его депеше показались ему «недостаточно почтительными»... Это же просто смешно... Элеонора?\n\n**[Assistant]**:\n— Матушка, мы решили выпить перед прибытием. Не представите нас вашей спутнице?",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
    bodyOverride: "**[Элеонора]**:\n— Разумеется. Лотте Ребер. О Фрайбурге она знает улицы, людей и такие двери, которые приличные дома предпочитают не замечать. А это — мой сын Феликс Хартманн. Он смотрит в окно, когда хочет, чтобы разговор обошелся без него.\n\n**[Лотте]**:\n— Элеонора делает из меня почти учреждение. Я всего лишь запоминаю, куда люди торопятся, когда уверяют, что просто гуляют.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
        text: "� Pardon the interruption�since you know the city so well, have you heard of the Zum Goldenen Adler hotel?",
        nextNodeId: CASE01_DINING_NODE_IDS.hotelBranch,
      },
    ],
  },
  {
    id: CASE01_DINING_NODE_IDS.silentBranch,
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_intro_journey.md",
    bodyOverride: "**[Assistant]**:\n— Извините. Это детектив [Name]. Он помогает нам с переездом.\n\n**[Narrator]**:\nФеликс произносит «нам» без всякого тепла, но вовремя: неловкость успевает стать его, а не вашей.\n\n**[Лотте]**:\n— Тогда будем знакомы. Люди, которые умеют молчать за столом, во Фрайбурге долго не останутся незамеченными.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
    bodyOverride: "**[Detective]**:\n— Разрешите представиться. Детектив [Name]. Прибыл во Фрайбург по делу.\n\n**[Narrator]**:\nЭлеонора повторяет ваше имя беззвучно, одними губами, будто примеряет его к будущей карточке на столе.\n\n**[Лотте]**:\n— Лотте Ребер. Рада встрече, детектив. По делу — тоже, раз уж оно привело вас в наш вагон.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
    bodyOverride: "**[Лотте]**:\n— «Zum Goldenen Adler»? Хороший выбор. Старый камень, тяжелые портьеры, постояльцы, которым нравится, когда их не замечают.\n\n**[Narrator]**:\nОна произносит название без вопроса. Не вспоминает — сверяет.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_MOTHER_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_assistant",
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
    bodyOverride: "**[Элеонора]**:\n— Попробуйте. Маркграфлерланд.\n\n**[Narrator]**:\nОфициант берет бутылку за основание, оставляет этикетку на виду и льет медленно, тонкой ровной струйкой. В конце бутылка едва поворачивается, и скатерть остается чистой.\n\n**[Элеонора]**:\n— Не бойтесь — это не экзамен. Пока не экзамен.\n\n**[inner_tradition]**:\nОфициант не спрашивает. Он знает, в чей бокал лить первым.",
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
    bodyOverride: "**[Narrator]**:\nЗа перегородкой щелкает микрофон. Кондуктор объявляет: до Фрайбурга двадцать минут.\n\n**[Assistant]**:\n— Двадцать минут. Пора убирать.\n\n**[Narrator]**:\nЭлеонора смотрит на него поверх бокала. Не спорит.\n\n**[Элеонора]**:\n— Хорошо. Убирайте.\n\n**[Narrator]**:\nЛотте закрывает блокнот синхронно с объявлением — ни секундой раньше, ни секундой позже.",
    backgroundUrl: CASE01_TRAIN_DINING_CAR_FELIX_BG,
    narrativeLayout: "log",
    sceneGroupId: "train_dining_car",
    characterId: "assistant",
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
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
    bodyOverride: "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, [Name]. Фрайбург маленький — а имена в нём ходят быстрее людей.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
      "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
      "**[Narrator]**:\nОна поднимается первой. Лотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, детектив. «Zum Goldenen Adler» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
      "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Одна строка зачёркнута так ровно, будто это не пометка, а отменённый маршрут.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, [Name]. Фрайбург маленький — а имена в нём ходят быстрее людей.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
    bodyOverride: "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Одна строка зачёркнута так ровно, будто это не пометка, а отменённый маршрут.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи. Вы хороший слушатель — для детектива это редкость. Обычно они говорят, пока собеседник не сдастся.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
    bodyOverride: "**[Narrator]**:\nВы успеваете увидеть страницу: не фразы, а столбик времени — 08:12, 08:27, 08:41. Рядом с нижней строкой стоит ваше имя, ещё без титула.\n\nЛотте убирает блокнот в карман пальто — не в сумку. Элеонора касается плеча Феликса: мимолётно, будто поправляя воротник.\n\n**[Лотте]**:\n— До встречи, детектив. «Zum Goldenen Adler» — хороший выбор. Если вдруг переедете, я обычно знаю раньше хозяина.\n\n**[Элеонора]**:\n— Фрайбург нас ждёт. Впрочем, Фрайбург всегда ждёт.",
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
        nextNodeId: "scene_case01_train_ankommen_video",
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
        nextNodeId: "scene_case01_train_ankommen_video",
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
        nextNodeId: "scene_case01_train_ankommen_video",
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
        nextNodeId: "scene_case01_train_ankommen_video",
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
        nextNodeId: "scene_case01_train_ankommen_video",
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
        nextNodeId: "scene_case01_train_ankommen_video",
      },
    ],
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
      "**[Narrator]**:\nПар бьёт в лицо, как первое предупреждение. Вокзал Фрайбурга — не карлсруэвская элегантность, а рабочий механизм: чугунные балки, стеклянная крыша в разводах копоти, носильщики с тележками, пахнущие углём и мокрой шерстью.\n\nЧасы над перроном показывают 08:47. Город уже проснулся.\n\n**[attr_encyclopedia]**:\nНеоренессанс. Построено при расширении Баденских железных дорог. Базель в часе пути, Страсбург — в двух. Для контрабанды и побегов — идеальный узел.",
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
        id: "AUTO_CONTINUE_VOZA_TO_HBF",
        text: "Сойти на платформу.",
        nextNodeId: "scene_case01_hbf_porter_greeting",
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
        id: "CASE01_BEAT1_EXIT",
        text: "Step out into the city.",
        nextNodeId: "scene_case01_hbf_departure",
      },
    ],
  },
  {
    id: "scene_case01_hbf_newsboy_approach",
    scenarioId: CASE01_DEFAULT_ENTRY_SCENARIO_ID,
    sourcePath: "40_GameViewer/Case01/Plot/01_Onboarding/scene_hbf_arrival.md",
    titleOverride: "Evening edition",
    bodyOverride: "The boy is nervous. He grips the thin, hurried evening edition like a shield. You notice the bank's name � Bankhaus Krebs � in the headlines. It's too early for official news, too specific for rumor.\n\nSomeone wanted this story told before the dust even settled.",
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
      "As you reach for a paper, the boy's hand trembles. He's not just selling news; he's watching for someone. Your assistant leans in, a silent shadow that makes the boy stiffen further.\n\n'Go,' you mutter. He doesn't wait for a second invitation.",
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
    bodyOverride: "You shoulder through the tide of travelers � timetables, porters and polite lies that pretend to be small talk.\n\nThe glass doors spill you into Freiburg. Two fronts are burning: the bank robbery and the political pressure from the Rathaus. Where you go first will shape how the city sees you.",
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
        effects: [
          {
            type: "set_flag",
            key: "priority_mayor_first",
            value: true,
          },
          { "type": "set_flag", "key": "priority_bank_first", "value": false },
        ],
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
      "The mayor does not offer you a chair until he has decided what sort of investigator you are. He wants the panic contained, the council reassured, and the bank matter finished before the newspapers decide it was an inside job with friends in City Hall.",
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
        text: "Ask what the Rathaus is most afraid of.",
        nextNodeId: "scene_case01_mayor_dossier",
        effects: [{ type: "grant_xp", amount: 5 }],
      },
      {
        id: "CASE01_MAYOR_CLARA",
        text: "Ask why Clara von Altenburg is already moving around the bank.",
        nextNodeId: "scene_case01_mayor_dossier",
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
        nextNodeId: "scene_case01_mayor_dossier",
      },
    ],
  },
  {
    id: "scene_case01_mayor_dossier",
    scenarioId: CASE01_SCENARIO_IDS.mayorBriefing,
    sourcePath: "40_GameViewer/Case01/Plot/02_Briefing/scene_mayor_briefing.md",
    titleOverride: "Political Pressure",
    bodyOverride:
      "He gives you three things and pretends they are one: a permit to push into the records later, a warning that Galdermann has friends who pay for silence, and a refusal to say Hartmann's name without first seeing what you can prove.",
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
        id: "CASE01_MAYOR_TO_BANK",
        text: "Take the briefing and move to the bank with official cover.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
      "Felix takes the permit as if it might bruise. He reads the mayor's phrasing twice, once for law and once for cowardice.\n\n'This gives you doors,' he says quietly. 'Not protection. If the Rathaus needs distance later, every sentence here already knows how to step away from you.'\n\nHe hands it back before anyone can ask whether he was helping you or warning himself.",
    characterId: "assistant",
    choices: [
      {
        id: "CASE01_MAYOR_FELIX_TO_BANK",
        text: "Take Felix's reading and move to the bank with official cover.",
        nextNodeId: "scene_case01_mayor_exit",
        effects: [
          { type: "set_flag", key: "met_mayor_first", value: true },
          { type: "change_relationship", characterId: "assistant", delta: 1 },
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
      "By the time you leave, you have enough paper to open doors and enough political pressure to know those same doors may close behind you.",
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
      "Cold air clings to the bank's marble steps. Clara von Altenburg intercepts you before the porter can lie about how calm the building is. Inside, the hall is too orderly for a clean robbery and too frightened for an ordinary one.",
    backgroundUrl: CASE01_BG_BANK_EXTERIOR,
    characterId: "assistant",
    choices: [
      {
        id: "CASE01_BANK_WITH_CLARA",
        text: "Bring Clara with you and let the room react to it.",
        nextNodeId: "scene_case01_bank_manager",
        effects: [
          { type: "change_relationship", characterId: "assistant", delta: 1 },
        ],
      },
      {
        id: "CASE01_BANK_SOLO",
        text: "Go in alone and keep Clara watching the floor.",
        nextNodeId: "scene_case01_bank_manager",
      },
    ],
  },
  {
    id: "scene_case01_bank_manager",
    scenarioId: CASE01_SCENARIO_IDS.bankInvestigation,
    sourcePath: "40_GameViewer/Case01/Plot/03_Bank/scene_manager_dialogue.md",
    titleOverride: "Director Galdermann",
    bodyOverride:
      "Heinrich Galdermann smiles like a man used to restructuring other people's panic. He calls the vault opening an unfortunate internal matter, pushes suspicion toward his clerks, and goes briefly rigid when you mention Hartmann by name.",
    backgroundUrl: CASE01_BG_BANK_OFFICE,
    choices: [
      {
        id: "CASE01_BANK_MANAGER_PRESS",
        text: "Press him on Hartmann and the sealed statements.",
        nextNodeId: "scene_case01_bank_clerk",
        effects: [{ type: "set_flag", key: "met_galdermann", value: true }],
      },
      {
        id: "CASE01_BANK_MANAGER_BYPASS",
        text: "Let the director talk and move to the clerk before he resets the story.",
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
      "Ernst Vogel looks terrified in the precise way innocence and coercion sometimes overlap. He swears the vault was locked, admits Hartmann had the kind of access no junior clerk should question, and finally blurts out Gustav the canal cleaner saw a black silhouette by the bank before dawn.",
    backgroundUrl: CASE01_BG_BANK_HALL,
    choices: [
      {
        id: "CASE01_BANK_CLERK_READ",
        text: "Read the fear, not the script.",
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
        text: "Take what he gave you and go straight to the vault.",
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
      "The vault door hangs open without any sign of brute force. Dust, velvet, and chemical grit tell three different stories, which is exactly what convinces you they belong to the same job.",
    backgroundUrl: CASE01_BG_BANK_VAULT,
    choices: [
      {
        id: "CASE01_BANK_VAULT_LOCK",
        text: "Work the lock and catalogue the insider traces.",
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
        text: "Trust the air and the chemical wrongness in the room.",
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
      "Clara lays the structure out cleanly. Velvet points toward a tailor and disguises. Powder points toward a pharmacy and a supply line. Gustav's silhouette points toward a tavern and the night traffic that fed the bank. Freiburg stops being one crime scene and becomes a city of linked lies.",
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
        id: "CASE01_WAREHOUSE_LAWFUL",
        text: "Seal the floor, call the warrant, and force a lawful close.",
        nextNodeId: "scene_case01_warehouse_lawful",
        visibleIfAll: [...officialRouteConditions],
      },
      {
        id: "CASE01_WAREHOUSE_COMPROMISE",
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
];
