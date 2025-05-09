import { useCallback } from 'react';
import { 
  showMarker, 
  hideMarker, 
  toggleMarkerActive, 
  toggleMarkerComplete, 
  addInteraction,
  $markers,
  $activeMarkers,
  $markerInteractions,
  initialMarkers
} from '../../../entities/markers/model';
import { QuestState } from '../../../shared/types/quest.types';
import { useUnit } from 'effector-react';
import { MarkerData, MarkerInteractionType } from '../../../shared/types/marker.types';

// Создаем интерфейс для взаимодействия с маркером
interface MarkerInteraction {
  markerId: string;
  timestamp: number;
  interactionType: MarkerInteractionType;
}

/**
 * Хук для взаимодействия с маркерами на карте
 */
export function useMarkers() {
  const markers = useUnit($markers);
  const activeMarkers = useUnit($activeMarkers);
  const interactions = useUnit($markerInteractions);

  // Функция для добавления нового взаимодействия с маркером
  const addMarkerInteraction = useCallback((markerId: string, interactionType: MarkerInteractionType = MarkerInteractionType.SCAN) => {
    const interaction: MarkerInteraction = {
      markerId,
      timestamp: Date.now(),
      interactionType
    };
    addInteraction(interaction as any); // Временное решение с приведением типа
  }, []);

  // Функция для активации/деактивации маркера
  const toggleActive = useCallback((markerId: string) => {
    toggleMarkerActive(markerId);
  }, []);

  // Функция для пометки маркера как завершенного/незавершенного
  const toggleComplete = useCallback((markerId: string) => {
    toggleMarkerComplete(markerId);
  }, []);

  // Показать маркер
  const showMarkerById = useCallback((markerId: string) => {
    showMarker(markerId);
  }, []);

  // Скрыть маркер
  const hideMarkerById = useCallback((markerId: string) => {
    hideMarker(markerId);
  }, []);

  // Обновить маркеры в зависимости от состояния квеста
  const updateMarkersByQuest = useCallback((questState: QuestState) => {
    // Сначала скрываем все маркеры
    markers.forEach(marker => hideMarker(marker.id));
    
    // Потом показываем нужные в зависимости от состояния квеста
    switch (questState) {
      case QuestState.IN_PROGRESS:
        // Показываем маркеры доставки
        showMarker('delivery_point_1');
        showMarker('delivery_point_2');
        break;
        
      case QuestState.COMPLETED:
        // Показываем маркеры для поиска артефактов
        showMarker('artifact_zone_1');
        showMarker('artifact_zone_2');
        showMarker('trader_location');
        break;
        
      case QuestState.NOT_STARTED:
        // Показываем базовые локации
        showMarker('starter_npc');
        showMarker('shelter_location');
        break;
        
      default:
        // По умолчанию показываем все важные локации
        showMarker('starter_npc');
        showMarker('shelter_location');
        showMarker('trader_location');
    }
  }, [markers]);

  return {
    markers,
    activeMarkers,
    interactions,
    addMarkerInteraction,
    toggleActive,
    toggleComplete,
    showMarkerById,
    hideMarkerById,
    updateMarkersByQuest
  };
}

// Экспортируем функцию обновления маркеров для использования без необходимости создавать экземпляр хука
export const updateMarkersByQuest = (questState: QuestState) => {
  // Сначала скрываем все маркеры
  // Примечание: так как здесь мы не можем получить список маркеров напрямую,
  // мы просто скрываем и показываем конкретные маркеры
  
  // Скрываем маркеры доставки
  hideMarker('delivery_point_1');
  hideMarker('delivery_point_2');
  
  // Скрываем маркеры артефактов
  hideMarker('artifact_zone_1');
  hideMarker('artifact_zone_2');
  hideMarker('trader_location');
  
  // Скрываем базовые локации
  hideMarker('starter_npc');
  hideMarker('shelter_location');
  
  // Потом показываем нужные в зависимости от состояния квеста
  switch (questState) {
    case QuestState.IN_PROGRESS:
      // Показываем маркеры доставки
      showMarker('delivery_point_1');
      showMarker('delivery_point_2');
      break;
      
    case QuestState.COMPLETED:
      // Показываем маркеры для поиска артефактов
      showMarker('artifact_zone_1');
      showMarker('artifact_zone_2');
      showMarker('trader_location');
      break;
      
    case QuestState.NOT_STARTED:
      // Показываем базовые локации
      showMarker('starter_npc');
      showMarker('shelter_location');
      break;
      
    default:
      // По умолчанию показываем все важные локации
      showMarker('starter_npc');
      showMarker('shelter_location');
      showMarker('trader_location');
  }
}; 