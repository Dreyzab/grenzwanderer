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

// Реэкспортируем типы из shared слоя для обратной совместимости
export type { 
  MarkerData, 
  QuestMarker, 
  MarkerInteraction 
} from '../../shared/types/marker.types';

export { 
  MarkerType, 
  NpcClass, 
  Faction 
} from '../../shared/types/marker.types';

export { QR_CODES } from '../../shared/constants/marker';

// Если в будущем будут компоненты UI, экспортировать их отсюда:
// export { MarkerIcon } from './ui/MarkerIcon'; 