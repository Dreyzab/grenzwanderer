import { Id } from '../../../convex/_generated/dataModel';
import { 
  MarkerType, 
  NpcClass, 
  Faction, 
  MarkerData, 
  QuestMarker,
  MarkerInteraction,
  QR_CODES
} from '../../entities/markers';

// Экспортируем все типы из модуля entities/markers для обратной совместимости
export { MarkerType, NpcClass, Faction, QR_CODES };
export type { MarkerData, QuestMarker, MarkerInteraction }; 