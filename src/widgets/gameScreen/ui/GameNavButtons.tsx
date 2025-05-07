import React from 'react';
import { QuestStateEnum } from '../../../shared/constants/quest';

interface GameNavButtonsProps {
  questState: QuestStateEnum;
  onStartQuest: () => void;
  onQRScanTest: (code: string) => void;
  onExit: () => void;
  qrCodes: Record<string, string>;
}

export const GameNavButtons: React.FC<GameNavButtonsProps> = ({
  questState,
  onStartQuest,
  onQRScanTest,
  onExit,
  qrCodes
}) => {
  return (
    <div className="game-nav-buttons">
      {questState === QuestStateEnum.REGISTERED && (
        <button 
          className="game-nav-btn"
          onClick={onStartQuest}
        >
          Начать задание доставки
        </button>
      )}
      
      {/* Тестовые кнопки для запуска сцен визуальной новеллы */}
      <div className="test-vn-buttons">
        <button 
          className="game-nav-btn test-vn-btn"
          onClick={() => onQRScanTest(qrCodes.TRADER)}
        >
          Тест: Встреча с торговцем
        </button>
        <button 
          className="game-nav-btn test-vn-btn"
          onClick={() => onQRScanTest(qrCodes.CRAFTSMAN)}
        >
          Тест: Мастерская Дитера
        </button>
        <button 
          className="game-nav-btn test-vn-btn"
          onClick={() => onQRScanTest(qrCodes.ANOMALY_ZONE)}
        >
          Тест: Аномальная зона
        </button>
        <button 
          className="game-nav-btn test-vn-btn"
          onClick={() => onQRScanTest(qrCodes.ENCOUNTER)}
        >
          Тест: Неожиданная встреча
        </button>
      </div>
      
      <button 
        className="exit-btn"
        onClick={onExit}
      >
        Выйти
      </button>
    </div>
  );
}; 