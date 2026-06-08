// Catalog for the Scene Composer prototype slice: pickable backgrounds and a
// curated NPC roster. Backgrounds reuse the shipped Case 01 scene art; NPC
// portraits resolve through the existing characterAssets registry.

export interface BackgroundCatalogEntry {
  id: string;
  label: string;
  url: string;
}

export interface NpcRosterEntry {
  id: string;
  name: string;
}

const BG_BASE = "/images/scenes/case01";

export const BACKGROUND_CATALOG: readonly BackgroundCatalogEntry[] = [
  {
    id: "adler_lobby",
    label: "Zum Goldenen Adler — лобби",
    url: `${BG_BASE}/bg_case01_zum_goldenen_adler_lobby.webp`,
  },
  {
    id: "adler_blotter",
    label: "Adler — расписание",
    url: `${BG_BASE}/bg_case01_zum_goldenen_adler_blotter_timetable.webp`,
  },
  {
    id: "telegraph",
    label: "Телеграфная",
    url: `${BG_BASE}/bg_case01_telegraph_switchboard.webp`,
  },
  {
    id: "rathaus",
    label: "Ратуша — кабинет",
    url: `${BG_BASE}/bg_case01_rathaus_office_pressure.webp`,
  },
  {
    id: "archive_reading",
    label: "Архив — читальня",
    url: `${BG_BASE}/bg_case01_archive_reading_room.webp`,
  },
  {
    id: "archive_ledger",
    label: "Архив — гроссбух",
    url: `${BG_BASE}/bg_case01_archive_ledger_table.webp`,
  },
  {
    id: "rail_yard",
    label: "Сортировочная (ночь)",
    url: `${BG_BASE}/bg_case01_rail_yard_night.webp`,
  },
  {
    id: "tailor",
    label: "Ателье портного",
    url: `${BG_BASE}/bg_case01_tailor_workshop.webp`,
  },
  {
    id: "apothecary",
    label: "Аптека",
    url: `${BG_BASE}/bg_case01_apothecary_counter.webp`,
  },
  {
    id: "tavern",
    label: "Zum Schlappen — таверна",
    url: `${BG_BASE}/bg_case01_zum_schlappen_tavern.webp`,
  },
  {
    id: "estate_bureau",
    label: "Поместье — бюро",
    url: `${BG_BASE}/bg_case01_estate_bureau.webp`,
  },
  {
    id: "estate_approach",
    label: "Поместье — подъезд",
    url: `${BG_BASE}/bg_case01_estate_approach.webp`,
  },
  {
    id: "estate_gates",
    label: "Поместье — ворота",
    url: `${BG_BASE}/bg_case01_estate_gates.webp`,
  },
  {
    id: "baroness_study",
    label: "Кабинет баронессы",
    url: `${BG_BASE}/bg_case01_baroness_study.webp`,
  },
  {
    id: "estate_vaults",
    label: "Поместье — хранилища",
    url: `${BG_BASE}/bg_case01_estate_vaults.webp`,
  },
  {
    id: "ghost_cellar",
    label: "Призрачный погреб",
    url: `${BG_BASE}/bg_case01_ghost_cellar.webp`,
  },
  {
    id: "night_alley",
    label: "Ночной переулок",
    url: `${BG_BASE}/bg_case01_night_alley.webp`,
  },
  {
    id: "hotel_bedroom",
    label: "Гостиница — спальня",
    url: `${BG_BASE}/bg_case01_hotel_bedroom.webp`,
  },
  {
    id: "convergence",
    label: "Порог города",
    url: `${BG_BASE}/bg_case01_convergence_city_threshold.webp`,
  },
  {
    id: "warehouse",
    label: "Склад (сырой лес)",
    url: `${BG_BASE}/bg_case01_warehouse_wet_timber.webp`,
  },
  {
    id: "warehouse_lawful",
    label: "Склад — печать закона",
    url: `${BG_BASE}/bg_case01_warehouse_lawful_seal.webp`,
  },
  {
    id: "warehouse_compromised",
    label: "Склад — подлог",
    url: `${BG_BASE}/bg_case01_warehouse_compromised_ledger.webp`,
  },
];

export const NPC_ROSTER: readonly NpcRosterEntry[] = [
  { id: "npc_mother_hartmann", name: "Мать Хартманн" },
  { id: "npc_felix_hartmann", name: "Феликс Хартманн" },
  { id: "clara_altenburg", name: "Клара Альтенбург" },
  { id: "victoria_sterling", name: "Виктория Стерлинг" },
  { id: "npc_archivist_otto", name: "Архивариус Отто" },
  { id: "npc_baroness_elise", name: "Баронесса Элиза" },
  { id: "npc_bureau_master", name: "Мастер Бюро" },
  { id: "npc_sasha_hartmann_servant", name: "Саша (слуга Хартманнов)" },
  { id: "npc_friedrich_wagner", name: "Фридрих Вагнер" },
  { id: "npc_anna_mahler", name: "Анна Малер" },
  { id: "npc_major_falk", name: "Майор Фальк" },
  { id: "npc_kessler_banker", name: "Банкир Кесслер" },
  { id: "npc_heinrich_galdermann", name: "Heinrich Galdermann" },
  { id: "npc_albrecht_stoll", name: "Oberleutnant Albrecht Stoll" },
  { id: "npc_emil_roth", name: "Emil Roth" },
  { id: "npc_anton_weber", name: "Anton Weber" },
  { id: "npc_rudi_kempf", name: "Rudi Kempf" },
  { id: "npc_krebs_mugger", name: "Krebs Mugger" },
  { id: "npc_konrad_vossler", name: "Konrad Vossler" },
];

const BACKGROUND_BY_ID = new Map(
  BACKGROUND_CATALOG.map((entry) => [entry.id, entry]),
);

export const getBackgroundById = (
  id: string | null,
): BackgroundCatalogEntry | null =>
  id ? (BACKGROUND_BY_ID.get(id) ?? null) : null;

const NPC_BY_ID = new Map(NPC_ROSTER.map((entry) => [entry.id, entry]));

export const getNpcName = (id: string): string => NPC_BY_ID.get(id)?.name ?? id;
