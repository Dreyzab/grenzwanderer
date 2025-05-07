import React, { useState } from 'react';
import styles from './SkillAllocator.module.css';

interface SkillAllocatorProps {
  availablePoints: number;
  currentAttributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    technique: number;
    charisma: number;
  };
  onAllocate: (attributeName: string, value: number) => void;
}

type AttributeKey = 'strength' | 'dexterity' | 'intelligence' | 'technique' | 'charisma';

export const SkillAllocator: React.FC<SkillAllocatorProps> = ({
  availablePoints,
  currentAttributes,
  onAllocate
}) => {
  // Состояние для отслеживания распределенных очков в компоненте
  const [allocatedPoints, setAllocatedPoints] = useState<Record<AttributeKey, number>>({
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    technique: 0,
    charisma: 0
  });
  
  // Рассчитываем количество оставшихся очков
  const remainingPoints = availablePoints - Object.values(allocatedPoints).reduce((sum, value) => sum + value, 0);
  
  // Названия атрибутов для отображения
  const attributeNames: Record<AttributeKey, string> = {
    strength: 'Сила',
    dexterity: 'Ловкость',
    intelligence: 'Интеллект',
    technique: 'Техника',
    charisma: 'Харизма'
  };
  
  // Обработчик изменения значения атрибута
  const handleAttributeChange = (name: AttributeKey, value: number) => {
    // Проверяем, можно ли выполнить действие
    if (value > 0 && remainingPoints <= 0) {
      return; // Нельзя добавить больше очков, если все уже распределены
    }
    
    // Проверяем, не пытаемся ли мы уменьшить значение ниже 0
    if (value < 0 && allocatedPoints[name] <= 0) {
      return; // Нельзя снять очки, если они не были распределены
    }
    
    // Обновляем состояние компонента
    setAllocatedPoints(prev => ({
      ...prev,
      [name]: prev[name] + value
    }));
  };
  
  // Функция для применения распределенных очков
  const applyAllocations = () => {
    // Для каждого атрибута вызываем функцию обратного вызова
    Object.entries(allocatedPoints).forEach(([name, value]) => {
      if (value !== 0) {
        onAllocate(name, value);
      }
    });
    
    // Сбрасываем локальное состояние
    setAllocatedPoints({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      technique: 0,
      charisma: 0
    });
  };
  
  // Функция для отмены всех изменений
  const resetAllocations = () => {
    setAllocatedPoints({
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      technique: 0,
      charisma: 0
    });
  };
  
  return (
    <div className={styles.skillAllocator}>
      <h3 className={styles.title}>Распределение очков</h3>
      
      <div className={styles.pointsInfo}>
        <div className={styles.pointsRemaining}>
          <span>Осталось очков:</span>
          <span className={styles.pointsValue}>{remainingPoints}</span>
        </div>
      </div>
      
      <div className={styles.attributesList}>
        {Object.entries(currentAttributes).map(([name, currentValue]) => {
          const typedName = name as AttributeKey;
          const allocatedValue = allocatedPoints[typedName];
          const newValue = currentValue + allocatedValue;
          
          return (
            <div key={name} className={styles.attributeRow}>
              <div className={styles.attributeName}>
                {attributeNames[typedName]}
              </div>
              
              <div className={styles.attributeControls}>
                <button 
                  className={styles.controlButton}
                  onClick={() => handleAttributeChange(typedName, -1)}
                  disabled={allocatedValue <= 0}
                >
                  -
                </button>
                
                <div className={styles.attributeValue}>
                  {currentValue}
                  {allocatedValue !== 0 && (
                    <span className={allocatedValue > 0 ? styles.increasedValue : styles.decreasedValue}>
                      {allocatedValue > 0 ? ` +${allocatedValue}` : ` ${allocatedValue}`}
                    </span>
                  )}
                </div>
                
                <button 
                  className={styles.controlButton}
                  onClick={() => handleAttributeChange(typedName, 1)}
                  disabled={remainingPoints <= 0}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={styles.actionButtons}>
        <button 
          className={styles.applyButton}
          onClick={applyAllocations}
          disabled={Object.values(allocatedPoints).every(v => v === 0)}
        >
          Применить
        </button>
        
        <button 
          className={styles.resetButton}
          onClick={resetAllocations}
          disabled={Object.values(allocatedPoints).every(v => v === 0)}
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}; 