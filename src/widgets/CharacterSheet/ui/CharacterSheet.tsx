import { FC } from 'react';
import styles from './CharacterSheet.module.css';

export const CharacterSheet: FC = () => {
  // Заглушка данных для отображения (в реальном приложении будут получены из entities)
  const attributes = {
    strength: 10,
    dexterity: 8,
    intelligence: 12,
    endurance: 9,
    charisma: 11
  };

  const secondaryStats = {
    health: 120,
    energy: 85,
    damage: '5-12',
    defense: 20,
    critChance: 10
  };

  const level = 5;
  const experience = 450;
  const nextLevelExp = 600;

  return (
    <div className={styles.characterSheet}>
      <div className={styles.basicInfo}>
        <h2>Базовая информация</h2>
        <div className={styles.levelInfo}>
          <div className={styles.level}>Уровень: {level}</div>
          <div className={styles.expBar}>
            <div 
              className={styles.expFill} 
              style={{ width: `${(experience / nextLevelExp) * 100}%` }}
            ></div>
          </div>
          <div className={styles.expText}>
            Опыт: {experience} / {nextLevelExp}
          </div>
        </div>
      </div>

      <div className={styles.attributesPanel}>
        <h2>Основные атрибуты</h2>
        <div className={styles.attributesList}>
          <div className={styles.attributeItem}>
            <span className={styles.attributeName}>Сила:</span>
            <span className={styles.attributeValue}>{attributes.strength}</span>
          </div>
          <div className={styles.attributeItem}>
            <span className={styles.attributeName}>Ловкость:</span>
            <span className={styles.attributeValue}>{attributes.dexterity}</span>
          </div>
          <div className={styles.attributeItem}>
            <span className={styles.attributeName}>Интеллект:</span>
            <span className={styles.attributeValue}>{attributes.intelligence}</span>
          </div>
          <div className={styles.attributeItem}>
            <span className={styles.attributeName}>Выносливость:</span>
            <span className={styles.attributeValue}>{attributes.endurance}</span>
          </div>
          <div className={styles.attributeItem}>
            <span className={styles.attributeName}>Харизма:</span>
            <span className={styles.attributeValue}>{attributes.charisma}</span>
          </div>
        </div>
      </div>

      <div className={styles.secondaryStats}>
        <h2>Вторичные характеристики</h2>
        <div className={styles.statsList}>
          <div className={styles.statItem}>
            <span className={styles.statName}>Здоровье:</span>
            <span className={styles.statValue}>{secondaryStats.health}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statName}>Энергия:</span>
            <span className={styles.statValue}>{secondaryStats.energy}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statName}>Урон:</span>
            <span className={styles.statValue}>{secondaryStats.damage}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statName}>Защита:</span>
            <span className={styles.statValue}>{secondaryStats.defense}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statName}>Шанс крит.удара:</span>
            <span className={styles.statValue}>{secondaryStats.critChance}%</span>
          </div>
        </div>
      </div>

      <div className={styles.skills}>
        <h2>Умения</h2>
        <p>Навыки и умения будут отображаться здесь</p>
      </div>
    </div>
  );
}; 