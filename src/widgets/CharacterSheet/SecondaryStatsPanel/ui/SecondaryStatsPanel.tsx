import React from 'react';
import styles from './SecondaryStatsPanel.module.css';

interface SecondaryStatsPanelProps {
  stats: {
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
  equipBonus?: {
    armor: number;
    damage: number;
    health: number;
    resistances: {
      fire: number;
      electric: number;
      chemical: number;
    };
  };
}

export const SecondaryStatsPanel: React.FC<SecondaryStatsPanelProps> = ({
  stats,
  equipBonus
}) => {
  // Функция для рендера прогресс-бара
  const renderProgressBar = (current: number, max: number, type: 'health' | 'energy') => {
    const percentage = Math.min((current / max) * 100, 100);
    const colorClass = type === 'health' ? styles.healthBar : styles.energyBar;
    
    return (
      <div className={styles.progressBarContainer}>
        <div 
          className={`${styles.progressBar} ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
        <span className={styles.progressText}>
          {current}/{max}
        </span>
      </div>
    );
  };
  
  return (
    <div className={styles.secondaryStatsPanel}>
      <h2 className={styles.title}>Вторичные характеристики</h2>
      
      <div className={styles.statGroup}>
        <div className={styles.statRow}>
          <div className={styles.statLabel}>
            <span className={styles.statIcon}>❤️</span>
            <span>Здоровье</span>
          </div>
          {renderProgressBar(stats.health.current, stats.health.max, 'health')}
        </div>
        
        <div className={styles.statRow}>
          <div className={styles.statLabel}>
            <span className={styles.statIcon}>⚡</span>
            <span>Энергия</span>
          </div>
          {renderProgressBar(stats.energy.current, stats.energy.max, 'energy')}
        </div>
      </div>
      
      <div className={styles.statGroup}>
        <div className={styles.statRow}>
          <div className={styles.statLabel}>
            <span className={styles.statIcon}>⚔️</span>
            <span>Урон</span>
          </div>
          <div className={styles.statValue}>
            {stats.damage}
            {equipBonus && equipBonus.damage > 0 && (
              <span className={styles.bonus}>+{equipBonus.damage}</span>
            )}
          </div>
        </div>
        
        <div className={styles.statRow}>
          <div className={styles.statLabel}>
            <span className={styles.statIcon}>🛡️</span>
            <span>Броня</span>
          </div>
          <div className={styles.statValue}>
            {stats.armor}
            {equipBonus && equipBonus.armor > 0 && (
              <span className={styles.bonus}>+{equipBonus.armor}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.resistancesSection}>
        <h3 className={styles.subTitle}>Сопротивляемость стихиям</h3>
        
        <div className={styles.resistancesGrid}>
          <div className={styles.resistanceItem}>
            <div className={styles.resistanceIcon}>🔥</div>
            <div className={styles.resistanceLabel}>Огонь</div>
            <div className={styles.resistanceValue}>
              {stats.resistances.fire}%
              {equipBonus && equipBonus.resistances.fire > 0 && (
                <span className={styles.bonus}>+{equipBonus.resistances.fire}%</span>
              )}
            </div>
          </div>
          
          <div className={styles.resistanceItem}>
            <div className={styles.resistanceIcon}>⚡</div>
            <div className={styles.resistanceLabel}>Электричество</div>
            <div className={styles.resistanceValue}>
              {stats.resistances.electric}%
              {equipBonus && equipBonus.resistances.electric > 0 && (
                <span className={styles.bonus}>+{equipBonus.resistances.electric}%</span>
              )}
            </div>
          </div>
          
          <div className={styles.resistanceItem}>
            <div className={styles.resistanceIcon}>☣️</div>
            <div className={styles.resistanceLabel}>Химия</div>
            <div className={styles.resistanceValue}>
              {stats.resistances.chemical}%
              {equipBonus && equipBonus.resistances.chemical > 0 && (
                <span className={styles.bonus}>+{equipBonus.resistances.chemical}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 