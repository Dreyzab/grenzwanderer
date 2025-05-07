import { Id } from '../../../convex/_generated/dataModel';
import { MarkerData, QuestMarker } from '../../entities/markers';

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

export interface DialogChoiceProps {
  text: string;
  onClick: () => void;
}

export interface HeaderProps {
  onOpenDialog: () => void;
  onOpenInventory: () => void;
}

export interface VisualNovelPageProps {
  initialSceneId: string;
  playerId?: string;
  initialQuestState?: any;
  initialPlayerStats?: any;
  onExit?: (finalQuestState?: any, finalPlayerStats?: any) => void;
} 