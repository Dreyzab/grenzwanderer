import React from 'react';
import { PlayerStats } from '../../shared/types/visualNovel';

interface VisualNovelProps {
  initialSceneId: string;
  playerId: string;
  initialQuestState: Record<string, any>;
  initialPlayerStats: PlayerStats;
  onExit: () => void;
}

/**
 * Компонент визуальной новеллы
 * Отображает интерактивные истории с диалогами, выборами и персонажами
 */
export const VisualNovel: React.FC<VisualNovelProps> = ({
  initialSceneId,
  playerId,
  initialQuestState,
  initialPlayerStats,
  onExit
}) => {
  return (
    <div className="visual-novel">
      <div className="vn-header">
        <h2>Сцена: {initialSceneId}</h2>
        <button onClick={onExit} className="exit-button">
          Закрыть
        </button>
      </div>
      <div className="vn-content">
        <p>Визуальная новелла (заглушка)</p>
        <p>Используются начальные статы игрока: {JSON.stringify(initialPlayerStats)}</p>
      </div>
    </div>
  );
};

export default VisualNovel; 