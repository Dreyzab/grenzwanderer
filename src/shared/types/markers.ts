/**
 * @deprecated Этот файл устарел и будет удален. Используйте marker.types.ts
 */

import { Id } from '../../../convex/_generated/dataModel';

// Реэкспортируем все из нового местоположения для обратной совместимости
export { 
  MarkerType, 
  NpcClass, 
  Faction 
} from './marker.types';

export type { 
  MarkerData, 
  QuestMarker, 
  MarkerInteraction 
} from './marker.types';

export { QR_CODES } from '../constants/marker'; 