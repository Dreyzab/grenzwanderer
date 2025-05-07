import React from 'react';
import styles from './ExperienceMeter.module.css';

interface ExperienceMeterProps {
  experience: {
    level: number;
    currentXP: number;
    requiredXP: number;
  };
}

export const ExperienceMeter: React.FC<ExperienceMeterProps> = ({
  experience
}) => {
  const { level, currentXP, requiredXP } = experience;
  
  // Рассчитываем процент прогресса
  const progressPercentage = Math.min((currentXP / requiredXP) * 100, 100);
  
  // Функция для расчета класса бейджа уровня в зависимости от значения
  const getLevelBadgeClass = (level: number) => {
    if (level < 5) return styles.levelBadgeBeginner;
    if (level < 10) return styles.levelBadgeIntermediate;
    if (level < 15) return styles.levelBadgeAdvanced;
    if (level < 20) return styles.levelBadgeExpert;
    return styles.levelBadgeMaster;
  };
  
  // Функция для получения титула на основе уровня
  const getLevelTitle = (level: number) => {
    if (level < 5) return 'Новичок';
    if (level < 10) return 'Опытный';
    if (level < 15) return 'Продвинутый';
    if (level < 20) return 'Эксперт';
    return 'Мастер';
  };
  
  return (
    <div className={styles.experienceMeter}>
      <div className={styles.levelInfo}>
        <div className={`${styles.levelBadge} ${getLevelBadgeClass(level)}`}>
          {level}
        </div>
        <div className={styles.levelDetails}>
          <span className={styles.levelTitle}>{getLevelTitle(level)}</span>
          <span className={styles.levelLabel}>Уровень</span>
        </div>
      </div>
      
      <div className={styles.experienceProgress}>
        <div className={styles.progressLabel}>
          <span>Прогресс</span>
          <span className={styles.xpCounter}>{currentXP}/{requiredXP} XP</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className={styles.nextLevelInfo}>
          До следующего уровня: <strong>{requiredXP - currentXP} XP</strong>
        </div>
      </div>
      
      <div className={styles.rewardPreview}>
        <div className={styles.rewardTitle}>Награда за уровень {level + 1}:</div>
        <div className={styles.rewardDetails}>
          <div className={styles.rewardItem}>
            <span className={styles.rewardIcon}>✨</span>
            <span className={styles.rewardText}>+3 очка атрибутов</span>
          </div>
          <div className={styles.rewardItem}>
            <span className={styles.rewardIcon}>🔧</span>
            <span className={styles.rewardText}>Новый слот для модификаций</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 