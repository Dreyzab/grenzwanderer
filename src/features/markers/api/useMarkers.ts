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
} from '../../../entities/markers';
import { MarkerData, MarkerInteraction } from '../../../shared/types/markers';
import { useUnit } from 'effector-react';
import { QuestStateEnum } from '../../../shared/constants/quest';

export function useMarkers() {
  const markers = useUnit($markers);
  const activeMarkers = useUnit($activeMarkers);
  const interactions = useUnit($markerInteractions);

  // Функция для добавления нового взаимодействия с маркером
  const addMarkerInteraction = useCallback((interaction: MarkerInteraction) => {
    addInteraction(interaction);
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
  const updateMarkersByQuest = useCallback((state: QuestStateEnum) => {
    // Сначала скрываем все маркеры
    initialMarkers.forEach(marker => hideMarker(marker.id));
    
    // Затем показываем нужные в зависимости от состояния
    switch (state) {
      case QuestStateEnum.DELIVERY_STARTED:
        showMarker('trader');
        break;
      case QuestStateEnum.PARTS_COLLECTED:
        showMarker('craftsman');
        break;
      case QuestStateEnum.ARTIFACT_HUNT:
        showMarker('anomaly_zone');
        showMarker('encounter');
        break;
      case QuestStateEnum.ARTIFACT_FOUND:
        showMarker('craftsman');
        break;
      case QuestStateEnum.FREE_ROAM:
        showMarker('trader');
        showMarker('craftsman');
        showMarker('anomaly_zone');
        break;
      default:
        // Ничего не показываем
        break;
    }
  }, []);

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