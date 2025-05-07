import { QuestStateEnum } from '../../../shared/constants/quest';

export interface QRScanResult {
  message: string;
  sceneId?: string;
  questState?: QuestStateEnum;
}

export function getMockQRScanResult(code: string): QRScanResult {
  // Используем моковые данные в зависимости от кода
  switch (code) {
    case 'grenz_npc_trader_01':
      return {
        message: "Вы встретили торговца",
        sceneId: "trader_meeting", // ID сцены для встречи с торговцем
        questState: QuestStateEnum.DELIVERY_STARTED
      };
    case 'grenz_npc_craftsman_01':
      return {
        message: "Вы встретили мастера Дитера",
        sceneId: "craftsman_meeting", // ID сцены для встречи с мастером
        questState: QuestStateEnum.PARTS_COLLECTED
      };
    case 'ARTIFACT_ITEM_2023':
      return {
        message: "Вы нашли артефакт!",
        sceneId: "artifact_found", // ID сцены для находки артефакта
        questState: QuestStateEnum.ARTIFACT_FOUND
      };
    case 'Grenz_loc_anomaly_01':
    case 'location_anomaly_001':
      return {
        message: "Вы прибыли в аномальную зону",
        sceneId: "artifact_hunt_start", // ID сцены для начала охоты за артефактом
        questState: QuestStateEnum.ARTIFACT_HUNT
      };
    case 'encounter_001':
      return {
        message: "Неожиданная встреча в лесу",
        sceneId: "ork_encounter", // ID сцены для встречи в лесу
        questState: QuestStateEnum.ARTIFACT_HUNT
      };
    default:
      return {
        message: "Неизвестный QR-код",
        sceneId: undefined,
        questState: undefined
      };
  }
}

export function getMockQuestStartResult() {
  return {
    message: "Задание получено!",
    sceneId: "mock-scene-id" as string | undefined,
  };
} 