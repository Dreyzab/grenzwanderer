import { QuestState, QRScanResult, QuestStartResult, QuestAction } from '../../../shared/types/quest.types';

export function getMockQRScanResult(code: string): QRScanResult {
  // Используем моковые данные в зависимости от кода
  switch (code) {
    case 'grenz_npc_trader_01':
      return {
        message: "Вы встретили торговца",
        sceneId: "trader_meeting", // ID сцены для встречи с торговцем
        questState: QuestState.IN_PROGRESS,
        action: QuestAction.DELIVER_ITEM,
        completedStep: "find_trader"
      };
    case 'grenz_npc_craftsman_01':
      return {
        message: "Вы встретили мастера Дитера",
        sceneId: "craftsman_meeting", // ID сцены для встречи с мастером
        questState: QuestState.IN_PROGRESS,
        action: QuestAction.COLLECT_ITEM,
        completedStep: "find_craftsman"
      };
    case 'ARTIFACT_ITEM_2023':
      return {
        message: "Вы нашли артефакт!",
        sceneId: "artifact_found", // ID сцены для находки артефакта
        questState: QuestState.IN_PROGRESS,
        action: QuestAction.COLLECT_ITEM,
        completedStep: "locate_artifact"
      };
    case 'Grenz_loc_anomaly_01':
    case 'location_anomaly_001':
      return {
        message: "Вы прибыли в аномальную зону",
        sceneId: "artifact_hunt_start", // ID сцены для начала охоты за артефактом
        questState: QuestState.IN_PROGRESS,
        action: QuestAction.REACH_LOCATION,
        completedStep: "enter_anomaly"
      };
    case 'encounter_001':
      return {
        message: "Неожиданная встреча в лесу",
        sceneId: "ork_encounter", // ID сцены для встречи в лесу
        questState: QuestState.IN_PROGRESS,
        action: QuestAction.TALK_TO_NPC,
        completedStep: "encounter_forest"
      };
    default:
      return {
        message: "Неизвестный QR-код",
        sceneId: undefined,
        questState: undefined
      };
  }
}

export function getMockQuestStartResult(): QuestStartResult {
  return {
    message: "Задание получено!",
    sceneId: "mock-scene-id",
    questState: QuestState.NOT_STARTED,
    action: QuestAction.START_GAME
  };
} 