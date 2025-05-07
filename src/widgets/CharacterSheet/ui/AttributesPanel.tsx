import React from 'react';
import styles from './AttributesPanel.module.css';
import { PrimaryAttributes } from '../../../entities/player/model/playerAttributes';

export interface AttributesPanelProps {
  attributes: PrimaryAttributes;
  availablePoints: number;
  onAllocatePoint: (attribute: keyof PrimaryAttributes, value: number) => void;
}

export const AttributesPanel: React.FC<AttributesPanelProps> = ({
  attributes,
  availablePoints,
  onAllocatePoint
}) => {
  // Данные атрибутов с дополнительной информацией
  const attributesData: Array<{
    key: keyof PrimaryAttributes;
    name: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'strength',
      name: 'Сила',
      description: 'Увеличивает физический урон в ближнем бою, максимальный переносимый вес и здоровье',
      icon: '/icons/attributes/strength.svg'
    },
    {
      key: 'agility',
      name: 'Ловкость',
      description: 'Увеличивает шанс критического удара, уклонение и точность',
      icon: '/icons/attributes/agility.svg'
    },
    {
      key: 'intelligence',
      name: 'Интеллект',
      description: 'Увеличивает магический урон, запас маны и сопротивление магии',
      icon: '/icons/attributes/intelligence.svg'
    },
    {
      key: 'technique',
      name: 'Техника',
      description: 'Увеличивает эффективность Техно-способностей и сопротивление Техно-эффектам',
      icon: '/icons/attributes/technique.svg'
    },
    {
      key: 'biopotential',
      name: 'Биопотенциал',
      description: 'Увеличивает урон и эффективность Био-способностей, сопротивление ядам и болезням',
      icon: '/icons/attributes/biopotential.svg'
    },
    {
      key: 'ritualKnowledge',
      name: 'Ритуальное Знание',
      description: 'Увеличивает эффективность ритуальных способностей и защиту от ментальных атак',
      icon: '/icons/attributes/ritual.svg'
    }
  ];

  return (
    <div className={styles.attributesPanel}>
      <div className={styles.header}>
        <h2>Основные атрибуты</h2>
        <div className={styles.availablePoints}>
          Доступные очки: <span>{availablePoints}</span>
        </div>
      </div>
      
      <div className={styles.attributesList}>
        {attributesData.map(attr => (
          <div key={attr.key} className={styles.attributeItem}>
            <div className={styles.attributeInfo}>
              <div className={styles.attributeIcon}>
                {attr.icon ? (
                  <img src={attr.icon} alt={attr.name} />
                ) : (
                  attr.name.substring(0, 1)
                )}
              </div>
              <div className={styles.attributeDetails}>
                <div className={styles.attributeName}>{attr.name}</div>
                <div className={styles.attributeValue}>{attributes[attr.key]}</div>
                <div className={styles.attributeDescription}>{attr.description}</div>
              </div>
            </div>
            
            <div className={styles.attributeControls}>
              <button 
                className={styles.controlButton}
                onClick={() => availablePoints > 0 && onAllocatePoint(attr.key, 1)}
                disabled={availablePoints <= 0}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 