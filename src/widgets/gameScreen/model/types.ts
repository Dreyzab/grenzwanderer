import { Id } from '../../../../convex/_generated/dataModel';
import { MarkerData } from '../../../entities/markers/model';

export enum GameView {
  MESSAGES = 'messages',
  MAP = 'map',
  NOVEL = 'novel'
}

export interface GameScreenProps {
  onExit: () => void;
  initialView?: GameView;
  onViewChange?: (view: GameView) => void;
}

export interface QuestMarker extends MarkerData {
  qrCode?: string;
} 