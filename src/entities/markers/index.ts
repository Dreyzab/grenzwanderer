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
  initialMarkers,
  // Экспортируем перечисления и интерфейсы для использования в других модулях
  MarkerType,
  NpcClass,
  Faction,
  QR_CODES
} from './model';

// Экспортируем типы и интерфейсы для использования в других модулях
export type { 
  MarkerData, 
  QuestMarker, 
  MarkerInteraction 
} from './model';

// Если в будущем будут компоненты UI, экспортировать их отсюда:
// export { MarkerIcon } from './ui/MarkerIcon'; 