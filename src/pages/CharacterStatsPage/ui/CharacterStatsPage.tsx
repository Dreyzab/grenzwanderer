import React from 'react';
import { PageLayout } from '@/shared/ui';
import { CharacterSheet } from '@/widgets/CharacterSheet';
import { AttributesPanel } from '@/widgets/CharacterSheet/AttributesPanel';
import { SecondaryStatsPanel } from '@/widgets/CharacterSheet/SecondaryStatsPanel';
import { ExperienceMeter } from '@/widgets/CharacterSheet/ExperienceMeter';
import { SkillAllocator } from '@/widgets/CharacterSheet/SkillAllocator';
import styles from './CharacterStatsPage.module.css';

// Типы для характеристик персонажа
interface CharacterStats {
  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    technique: number;
    charisma: number;
  };
  secondaryStats: {
    health: { current: number; max: number };
    energy: { current: number; max: number };
    damage: number;
    armor: number;
    resistances: {
      fire: number;
      electric: number;
      chemical: number;
    };
  };
  experience: {
    level: number;
    currentXP: number;
    requiredXP: number;
  };
  availablePoints: number;
  equippedBonus: {
    armor: number;
    damage: number;
    health: number;
    resistances: {
      fire: number;
      electric: number;
      chemical: number;
    };
  };
  powerRating: number;
}

export const CharacterStatsPage: React.FC = () => {
  // Моковые данные для характеристик персонажа
  const characterStats: CharacterStats = {
    attributes: {
      strength: 8,
      dexterity: 11,
      intelligence: 9,
      technique: 12,
      charisma: 7
    },
    secondaryStats: {
      health: { current: 180, max: 200 },
      energy: { current: 85, max: 100 },
      damage: 45,
      armor: 65,
      resistances: {
        fire: 25,
        electric: 15,
        chemical: 10
      }
    },
    experience: {
      level: 12,
      currentXP: 3450,
      requiredXP: 5000
    },
    availablePoints: 3,
    equippedBonus: {
      armor: 25,
      damage: 15,
      health: 40,
      resistances: {
        fire: 15,
        electric: 5,
        chemical: 0
      }
    },
    powerRating: 378
  };
  
  // Обработчик распределения очков
  const handleAttributeAllocate = (attributeName: string, value: number) => {
    console.log(`Распределение очков: ${attributeName} ${value > 0 ? '+' : ''}${value}`);
    // Здесь будет вызов соответствующего API
  };
  
  return (
    <PageLayout>
      <div className={styles.characterStatsPage}>
        <header className={styles.characterHeader}>
          <h1>Характеристики персонажа</h1>
          <div className={styles.powerRating}>
            <span className={styles.powerLabel}>Рейтинг силы:</span>
            <span className={styles.powerValue}>{characterStats.powerRating}</span>
          </div>
        </header>
        
        <div className={styles.characterContent}>
          <div className={styles.mainColumn}>
            <div className={styles.attributesSection}>
              <AttributesPanel 
                attributes={characterStats.attributes}
                availablePoints={characterStats.availablePoints}
                onAllocate={handleAttributeAllocate}
              />
            </div>
            
            <div className={styles.secondaryStatsSection}>
              <SecondaryStatsPanel 
                stats={characterStats.secondaryStats}
                equipBonus={characterStats.equippedBonus}
              />
            </div>
          </div>
          
          <div className={styles.sideColumn}>
            <div className={styles.experienceSection}>
              <ExperienceMeter 
                experience={characterStats.experience}
              />
            </div>
            
            {characterStats.availablePoints > 0 && (
              <div className={styles.skillAllocatorSection}>
                <SkillAllocator 
                  availablePoints={characterStats.availablePoints}
                  currentAttributes={characterStats.attributes}
                  onAllocate={handleAttributeAllocate}
                />
              </div>
            )}
            
            <div className={styles.equipmentBonusSection}>
              <h3 className={styles.sectionTitle}>Бонусы от экипировки</h3>
              <ul className={styles.bonusList}>
                {characterStats.equippedBonus.armor > 0 && (
                  <li className={styles.bonusItem}>
                    <span className={styles.bonusName}>Броня:</span>
                    <span className={styles.bonusValue}>+{characterStats.equippedBonus.armor}</span>
                  </li>
                )}
                {characterStats.equippedBonus.damage > 0 && (
                  <li className={styles.bonusItem}>
                    <span className={styles.bonusName}>Урон:</span>
                    <span className={styles.bonusValue}>+{characterStats.equippedBonus.damage}</span>
                  </li>
                )}
                {characterStats.equippedBonus.health > 0 && (
                  <li className={styles.bonusItem}>
                    <span className={styles.bonusName}>Здоровье:</span>
                    <span className={styles.bonusValue}>+{characterStats.equippedBonus.health}</span>
                  </li>
                )}
                {characterStats.equippedBonus.resistances.fire > 0 && (
                  <li className={styles.bonusItem}>
                    <span className={styles.bonusName}>Огнестойкость:</span>
                    <span className={styles.bonusValue}>+{characterStats.equippedBonus.resistances.fire}%</span>
                  </li>
                )}
                {characterStats.equippedBonus.resistances.electric > 0 && (
                  <li className={styles.bonusItem}>
                    <span className={styles.bonusName}>Электрозащита:</span>
                    <span className={styles.bonusValue}>+{characterStats.equippedBonus.resistances.electric}%</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}; 