/**
 * Типы для компонента QR-сканера
 */

// Состояния сканера
export enum ScannerState {
  READY = 'ready',        // готов к сканированию
  SCANNING = 'scanning',  // процесс сканирования
  DETECTED = 'detected',  // QR-код обнаружен
  ERROR = 'error'         // ошибка доступа к камере
}

// Результат сканирования
export interface ScanResult {
  code: string;
  timestamp: number;
  location?: {
    lat: number;
    lng: number;
  };
}

// Пропсы компонента сканера
export interface ScannerProps {
  onScan?: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  enableFlash?: boolean;
  enableFrontCamera?: boolean;
  manualInput?: boolean;  // разрешить ручной ввод кода
  scanDelay?: number;     // задержка между сканированиями в мс
  scanAreaSize?: number;  // размер области сканирования (% от размера экрана)
}

// Конфигурация сканера
export interface ScannerConfig {
  facingMode: 'environment' | 'user';
  flash: boolean;
  resolution: {
    width: number; 
    height: number;
  };
}

// Типы QR-кодов в игре
export enum QRCodeType {
  QUEST = 'quest',            // активирует или обновляет квест
  ITEM = 'item',              // добавляет предмет в инвентарь
  SCENE = 'scene',            // запускает диалоговую сцену
  LOCATION = 'location',      // открывает новую локацию на карте
  NPC = 'npc',                // идентификатор NPC
  SECRET = 'secret'           // секретный код для специальных событий
} 