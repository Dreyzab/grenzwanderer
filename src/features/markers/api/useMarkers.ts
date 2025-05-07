import { useCallback } from 'react';
import { 
  showMarker, 
  hideMarker, 
  toggleMarkerActive, 
  toggleMarkerComplete, 
  addInteraction, 
  updateMarkersByQuestState,
  $markers,
  $activeMarkers,
  $markerInteractions
} from '../../../entities/markers/model';
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
    updateMarkersByQuestState(state);
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