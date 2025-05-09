import React from 'react';
import styles from './SecondaryStatsPanel.module.css';
import { SecondaryStats } from '../../../entities/player/model/playerAttributes';

export interface SecondaryStatsPanelProps {
  secondaryStats: SecondaryStats;
}

export const SecondaryStatsPanel: React.FC<SecondaryStatsPanelProps> = ({ secondaryStats }) => {
  // Группировка статов по категориям для лучшей организации
  const statsCategories = [
    {
      name: 'Ресурсы',
      icon: '/icons/stats/resources.svg',
      stats: [
        {
          key: 'health',
          name: 'Здоровье',
          value: `${secondaryStats.health.current} / ${secondaryStats.health.max}`,
          icon: '/icons/stats/health.svg',
          color: '#e74c3c'
        },
        {
          key: 'stamina',
          name: 'Выносливость',
          value: `${secondaryStats.stamina.current} / ${secondaryStats.stamina.max}`,
          icon: '/icons/stats/stamina.svg',
          color: '#f39c12'
        },
        {
          key: 'mana',
          name: 'Мана',
          value: `${secondaryStats.mana.current} / ${secondaryStats.mana.max}`,
          icon: '/icons/stats/mana.svg',
          color: '#3498db'
        }
      ]
    },
    {
      name: 'Бой',
      icon: '/icons/stats/combat.svg',
      stats: [
        {
          key: 'critChance',
          name: 'Шанс крит. удара',
          value: `${secondaryStats.critChance.toFixed(1)}%`,
          icon: '/icons/stats/crit.svg',
          color: '#e74c3c'
        },
        {
          key: 'critMultiplier',
          name: 'Множитель крит. урона',
          value: `x${secondaryStats.critMultiplier.toFixed(2)}`,
          icon: '/icons/stats/mult.svg',
          color: '#9b59b6'
        },
        {
          key: 'attackSpeed',
          name: 'Скорость атаки',
          value: `${secondaryStats.attackSpeed.toFixed(0)}%`,
          icon: '/icons/stats/speed.svg',
          color: '#f1c40f'
        },
        {
          key: 'castSpeed',
          name: 'Скорость заклинаний',
          value: `${secondaryStats.castSpeed.toFixed(0)}%`,
          icon: '/icons/stats/cast.svg',
          color: '#3498db'
        }
      ]
    },
    {
      name: 'Защита',
      icon: '/icons/stats/defense.svg',
      stats: [
        {
          key: 'armor',
          name: 'Броня',
          value: secondaryStats.armor.toFixed(0),
          icon: '/icons/stats/armor.svg',
          color: '#7f8c8d'
        },
        {
          key: 'evasion',
          name: 'Уклонение',
          value: `${secondaryStats.evasion.toFixed(1)}%`,
          icon: '/icons/stats/evasion.svg',
          color: '#2ecc71'
        },
        {
          key: 'accuracy',
          name: 'Точность',
          value: `${secondaryStats.accuracy.toFixed(0)}%`,
          icon: '/icons/stats/accuracy.svg',
          color: '#f39c12'
        }
      ]
    },
    {
      name: 'Сопротивления',
      icon: '/icons/stats/resistances.svg',
      stats: [
        {
          key: 'physicalResist',
          name: 'Физическое',
          value: `${secondaryStats.resistances.physical.toFixed(0)}%`,
          icon: '/icons/stats/physical.svg',
          color: '#e67e22'
        },
        {
          key: 'magicalResist',
          name: 'Магическое',
          value: `${secondaryStats.resistances.magical.toFixed(0)}%`,
          icon: '/icons/stats/magical.svg',
          color: '#3498db'
        },
        {
          key: 'technoResist',
          name: 'Техно',
          value: `${secondaryStats.resistances.techno.toFixed(0)}%`,
          icon: '/icons/stats/techno.svg',
          color: '#f1c40f'
        },
        {
          key: 'bioResist',
          name: 'Био',
          value: `${secondaryStats.resistances.bio.toFixed(0)}%`,
          icon: '/icons/stats/bio.svg',
          color: '#2ecc71'
        },
        {
          key: 'ritualResist',
          name: 'Ритуальное',
          value: `${secondaryStats.resistances.ritual.toFixed(0)}%`,
          icon: '/icons/stats/ritual.svg',
          color: '#9b59b6'
        }
      ]
    },
    {
      name: 'Прочее',
      icon: '/icons/stats/misc.svg',
      stats: [
        {
          key: 'carryWeight',
          name: 'Переносимый вес',
          value: `${secondaryStats.carryWeight.current.toFixed(1)} / ${secondaryStats.carryWeight.max.toFixed(1)}`,
          icon: '/icons/stats/weight.svg',
          color: '#7f8c8d'
        }
      ]
    }
  ];

  return (
    <div className={styles.secondaryStatsPanel}>
      <div className={styles.header}>
        <h2>Вторичные характеристики</h2>
      </div>
      
      <div className={styles.categoriesContainer}>
        {statsCategories.map(category => (
          <div key={category.name} className={styles.statCategory}>
            <div className={styles.categoryHeader}>
              {category.icon && (
                <img 
                  src={category.icon} 
                  alt={category.name} 
                  className={styles.categoryIcon} 
                />
              )}
              <h3>{category.name}</h3>
            </div>
            
            <div className={styles.statsGrid}>
              {category.stats.map(stat => (
                <div key={stat.key} className={styles.statItem}>
                  <div className={styles.statIconWrapper} style={{ backgroundColor: stat.color }}>
                    {stat.icon ? (
                      <img src={stat.icon} alt={stat.name} className={styles.statIcon} />
                    ) : (
                      <div className={styles.statIconDefault}></div>
                    )}
                  </div>
                  <div className={styles.statInfo}>
                    <div className={styles.statName}>{stat.name}</div>
                    <div className={styles.statValue}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 