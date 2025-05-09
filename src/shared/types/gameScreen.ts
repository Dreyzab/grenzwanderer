/**
 * Типы для различных игровых экранов и их пропсов
 */

// Возможные представления игрового экрана
export enum GameView {
  MAP = 'map',
  NOVEL = 'novel',
  INVENTORY = 'inventory',
  MESSAGES = 'messages',
  SCANNER = 'scanner'
}

export enum GameScreenType {
  MAP = 'map',
  DIALOG = 'dialog',
  SCANNER = 'scanner',
  NOVEL = 'novel',
  INVENTORY = 'inventory'
}

export interface GameScreenProps {
  initialView: GameView;
  onViewChange: (view: GameView) => void;
  playerId?: string;
}

export interface MapScreenProps extends GameScreenProps {
  type: GameScreenType.MAP;
}

export interface DialogScreenProps extends GameScreenProps {
  type: GameScreenType.DIALOG;
  dialogId: string;
}

export interface ScannerScreenProps extends GameScreenProps {
  type: GameScreenType.SCANNER;
  onScan: (code: string) => void;
}

export interface NovelScreenProps extends GameScreenProps {
  type: GameScreenType.NOVEL;
  sceneId: string;
}

export interface InventoryScreenProps extends GameScreenProps {
  type: GameScreenType.INVENTORY;
}

export type GameScreen = 
  | MapScreenProps
  | DialogScreenProps
  | ScannerScreenProps
  | NovelScreenProps
  | InventoryScreenProps; 