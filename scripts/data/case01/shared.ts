import {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_DINING_FLAGS,
  CASE01_DINING_NODE_IDS,
  CASE01_FINAL_OUTCOME_COMPROMISED,
  CASE01_FINAL_OUTCOME_LAWFUL,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
} from "../../../src/shared/case01Canon";

export {
  CASE01_DEFAULT_ENTRY_SCENARIO_ID,
  CASE01_DINING_FLAGS,
  CASE01_DINING_NODE_IDS,
  CASE01_FINAL_OUTCOME_COMPROMISED,
  CASE01_FINAL_OUTCOME_LAWFUL,
  CASE01_ROUTE_VALUE_COVERT,
  CASE01_ROUTE_VALUE_OFFICIAL,
  CASE01_SCENARIO_IDS,
};

export const officialRouteConditions = [
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

export const covertRouteConditions = [
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

export const CASE01_START_VIDEO_BASE_PATH = "/VN/start/video";
export const CASE01_START_IMAGE_BASE_PATH = "/VN/start/image";
export const CASE01_TRAIN_COMPARTMENT_BG = `${CASE01_START_IMAGE_BASE_PATH}/compartment_cinema.png`;
export const CASE01_TRAIN_ASSISTANT_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_assistant.png`;
export const CASE01_TRAIN_DINING_CAR_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car.png`;
export const CASE01_TRAIN_DINING_CAR_MOTHER_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_mother.png`;
export const CASE01_TRAIN_DINING_CAR_MOTHER_EYE_CONTACT_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_mother_attentive_eye_contact.png`;
export const CASE01_TRAIN_DINING_CAR_GROUP_BG = "/images/scenes/case01/cg_case01_train_dining_car.png";
// TODO(art): asset not yet shipped — referenced by Lotte's "избранник" monologue beat.
// Falls back to the corridor/dining-car group view until the Baden costume portrait is provided.
export const CASE01_TRAIN_DINING_CAR_OLD_BADENER_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_old_badener.png`;
export const CASE01_PLATFORM_STILL_BG = `${CASE01_START_IMAGE_BASE_PATH}/Ankommen.png`;
export const CASE01_HBF_BG = `${CASE01_START_IMAGE_BASE_PATH}/HBF.png`;
export const CASE01_NEWSBOY_BG = `${CASE01_START_IMAGE_BASE_PATH}/boy_newspaper_styled.png`;
export const CASE01_LUGGAGE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_luggage_counter_1776719222396.png`;
export const CASE01_POLICE_BG = `${CASE01_START_IMAGE_BASE_PATH}/bahnhof_police_post_1776719605015.png`;
export const CASE01_TRAIN_DINING_CAR_WINE_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_wine.png`;
export const CASE01_TRAIN_DINING_CAR_FELIX_BG = `${CASE01_START_IMAGE_BASE_PATH}/train_dining_car_felix.png`;
export const CASE01_PLATFORM_FAREWELL_BG = `${CASE01_START_IMAGE_BASE_PATH}/platform_farewell.png`;
export const CASE01_ART_BG_BASE_PATH = "/images/scenes/case01";
export const CASE01_BG_zum_goldenen_adler_LOBBY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_goldenen_adler_lobby.webp`;
export const CASE01_BG_zum_goldenen_adler_BLOTTER = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_goldenen_adler_blotter_timetable.webp`;
export const CASE01_BG_TELEGRAPH = `${CASE01_ART_BG_BASE_PATH}/bg_case01_telegraph_switchboard.webp`;
export const CASE01_BG_RATHAUS = `${CASE01_ART_BG_BASE_PATH}/bg_case01_rathaus_office_pressure.webp`;
export const CASE01_BG_ARCHIVE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_archive_reading_room.webp`;
export const CASE01_BG_ARCHIVE_LEDGER = `${CASE01_ART_BG_BASE_PATH}/bg_case01_archive_ledger_table.webp`;
export const CASE01_BG_RAIL_YARD = `${CASE01_ART_BG_BASE_PATH}/bg_case01_rail_yard_night.webp`;
export const CASE01_BG_TAILOR = `${CASE01_ART_BG_BASE_PATH}/bg_case01_tailor_workshop.webp`;
export const CASE01_BG_APOTHECARY = `${CASE01_ART_BG_BASE_PATH}/bg_case01_apothecary_counter.webp`;
export const CASE01_BG_ZUM_SCHLAPPEN = `${CASE01_ART_BG_BASE_PATH}/bg_case01_zum_schlappen_tavern.webp`;
export const CASE01_BG_ESTATE_BUREAU = `${CASE01_ART_BG_BASE_PATH}/bg_case01_estate_bureau.webp`;
export const CASE01_BG_CONVERGENCE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_convergence_city_threshold.webp`;
export const CASE01_BG_WAREHOUSE = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_wet_timber.webp`;
export const CASE01_BG_WAREHOUSE_LAWFUL = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_lawful_seal.webp`;
export const CASE01_BG_WAREHOUSE_COMPROMISED = `${CASE01_ART_BG_BASE_PATH}/bg_case01_warehouse_compromised_ledger.webp`;
export const CASE01_BG_BANK_EXTERIOR = CASE01_BG_CONVERGENCE;
export const CASE01_BG_BANK_HALL = CASE01_BG_ARCHIVE;
export const CASE01_BG_BANK_OFFICE = CASE01_BG_RATHAUS;
export const CASE01_BG_BANK_VAULT = CASE01_BG_WAREHOUSE_LAWFUL;

export const CASE01_DINING_FAREWELL_NODE_IDS = {
  silentDefend: "scene_case01_train_dining_car_eleonora_farewell_silent_defend",
  hotelDefend: "scene_case01_train_dining_car_eleonora_farewell_hotel_defend",
  introObserve: "scene_case01_train_dining_car_eleonora_farewell_intro_observe",
  silentObserve: "scene_case01_train_dining_car_eleonora_farewell_silent_observe",
  hotelObserve: "scene_case01_train_dining_car_eleonora_farewell_hotel_observe",
} as const;
