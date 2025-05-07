import React from 'react';
import styles from './AttributesPanel.module.css';

interface AttributesPanelProps {
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    technique: number;
    charisma: number;
  };
  availablePoints: number;
  onAllocate: (attributeName: string, value: number) => void;
}

export const AttributesPanel: React.FC<AttributesPanelProps> = ({
  attributes,
  availablePoints,
  onAllocate
}) => {
  // Описания и иконки для атрибутов
  const attributeDetails = {
    strength: {
      icon: '💪',
      name: 'Сила',
      description: 'Влияет на урон в ближнем бою, переносимый вес и стойкость к повреждениям.'
    },
    dexterity: {
      icon: '🏃',
      name: 'Ловкость',
      description: 'Влияет на скорость передвижения, уклонение и точность стрельбы.'
    },
    intelligence: {
      icon: '🧠',
      name: 'Интеллект',
      description: 'Влияет на использование технологий, взлом и разблокировку дополнительных диалогов.'
    },
    technique: {
      icon: '🔧',
      name: 'Техника',
      description: 'Влияет на мастерство обращения с механизмами, крафт и ремонт.'
    },
    charisma: {
      icon: '💬',
      name: 'Харизма',
      description: 'Влияет на убеждение, торговлю и взаимодействие с NPC.'
    }
  };

  // Функция для получения цветовой индикации уровня атрибута
  const getAttributeColorClass = (value: number): string => {
    if (value <= 5) return styles.attributeLow;
    if (value <= 8) return styles.attributeAverage;
    if (value <= 12) return styles.attributeGood;
    if (value <= 16) return styles.attributeGreat;
    return styles.attributeExcellent;
  };

  return (
    <div className={styles.attributesPanel}>
      <h2 className={styles.title}>Основные атрибуты</h2>
      
      {availablePoints > 0 && (
        <div className={styles.pointsAvailable}>
          <span className={styles.pointsIcon}>✨</span>
          <span>Доступно очков: <strong>{availablePoints}</strong></span>
        </div>
      )}
      
      <div className={styles.attributesList}>
        {Object.entries(attributes).map(([key, value]) => {
          const details = attributeDetails[key as keyof typeof attributeDetails];
          
          return (
            <div key={key} className={styles.attributeRow}>
              <div className={styles.attributeInfo}>
                <div className={styles.attributeIcon}>{details.icon}</div>
                <div className={styles.attributeNameValue}>
                  <div className={styles.attributeName}>{details.name}</div>
                  <div className={`${styles.attributeValue} ${getAttributeColorClass(value)}`}>
                    {value}
                  </div>
                </div>
              </div>
              
              <div className={styles.attributeDescription}>
                {details.description}
              </div>
              
              {availablePoints > 0 && (
                <div className={styles.attributeControls}>
                  <button 
                    className={styles.attributeIncreaseButton}
                    onClick={() => onAllocate(key, 1)}
                    disabled={availablePoints <= 0}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 