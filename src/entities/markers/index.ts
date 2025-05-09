/**
 * Публичное API модуля маркеров
 * @module Markers
 */

// Экспортируем события и сторы для управления маркерами
export {
  showMarker,
  hideMarker,
  toggleMarkerActive,
  toggleMarkerComplete,
  addInteraction,
  addMarker,
  markersReset,
  $markers,
  $activeMarkers,
  $markerInteractions,
  initialMarkers
} from './model';

// Экспортируем тип ExtendedMarkerData для поддержки isActive
export type { ExtendedMarkerData } from './model';

// Реэкспортируем типы из shared слоя для обратной совместимости
export type { 
  MarkerData, 
  QuestMarker, 
  MarkerInteractionType 
} from '../../shared/types/marker.types';

export { 
  MarkerType, 
  NPCClass, 
  Faction 
} from '../../shared/types/marker.types';

export { QR_CODE_PREFIXES } from '../../shared/constants/marker';

// Если в будущем будут компоненты UI, экспортировать их отсюда:
// export { MarkerIcon } from './ui/MarkerIcon'; 