import React from 'react';
import { MarkerData } from '../../shared/types/marker.types';

interface QuestMapProps {
  onMarkerClick: (marker: MarkerData) => Promise<void>;
  followPlayer?: boolean;
}

/**
 * Компонент карты квестов
 * Отображает интерактивную карту с маркерами квестов и местоположением игрока
 */
export const QuestMap: React.FC<QuestMapProps> = ({ 
  onMarkerClick,
  followPlayer = true 
}) => {
  return (
    <div className="quest-map">
      {/* Реализация карты будет добавлена позже */}
      <div className="map-placeholder">
        <p>Карта квестов (заглушка)</p>
      </div>
    </div>
  );
};

export default QuestMap; 