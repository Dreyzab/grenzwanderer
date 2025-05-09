/**
 * Константы, связанные с QR-кодами для маркеров на карте
 */

/**
 * Префиксы QR-кодов для различных типов контента
 */
export const QR_CODE_PREFIXES = {
  QUEST: 'QUEST',       // Квесты
  ITEM: 'ITEM',         // Предметы
  NPC: 'NPC',           // Неигровые персонажи
  SCENE: 'SCENE',       // Сцены визуальной новеллы
  LOCATION: 'LOC',      // Локации
  EVENT: 'EVENT',       // События
  SECRET: 'SECRET',     // Секретные коды
};

/**
 * Формат QR-кода: PREFIX:ID:PARAM
 * Например: QUEST:123:START
 */
export const QR_CODE_FORMAT = /^([A-Z]+):([A-Z0-9_-]+)(?::([A-Z0-9_-]+))?$/;

/**
 * Радиус видимости маркеров на карте (в метрах)
 */
export const MARKER_VISIBILITY_RADIUS = 300;

/**
 * Значения времени жизни (TTL) для различных типов маркеров (в секундах)
 */
export const MARKER_TTL = {
  QUEST: null,         // Бессрочно, пока не выполнен квест
  POINT_OF_INTEREST: null, // Бессрочно
  NPC: null,           // Бессрочно
  SHOP: null,          // Бессрочно
  SHELTER: null,       // Бессрочно
  DANGER: 86400,       // 24 часа
  EVENT: 3600,         // 1 час
};

/**
 * Минимальное расстояние для взаимодействия с маркером (в метрах)
 */
export const MARKER_INTERACTION_DISTANCE = 50;

/**
 * Тестовые QR-коды для разработки
 */
export const QR_CODES = {
  QUEST_START: 'QUEST:001:START',
  QUEST_DELIVERY: 'QUEST:002:DELIVERY',
  QUEST_INVESTIGATION: 'QUEST:003:INVESTIGATE',
  ITEM_MEDKIT: 'ITEM:001:MEDKIT',
  ITEM_WEAPON: 'ITEM:002:WEAPON',
  SCENE_INTRO: 'SCENE:001:INTRO',
  NPC_TRADER: 'NPC:001:TRADER',
  LOCATION_SHELTER: 'LOC:001:SHELTER',
  EVENT_ENCOUNTER: 'EVENT:001:ENCOUNTER',
  SECRET_CHEST: 'SECRET:001:CHEST'
};