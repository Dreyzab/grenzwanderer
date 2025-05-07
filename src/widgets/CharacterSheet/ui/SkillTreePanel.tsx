import React, { useState } from 'react';
import styles from './SkillTreePanel.module.css';
import { SkillNode, PathProgress, ALL_SKILL_NODES, DEVELOPMENT_PATHS } from '../../../entities/player/model/playerSkills';
import { ClassPath } from '../../../entities/player/model/playerAttributes';

interface SkillTreePanelProps {
  pathsProgress: Record<ClassPath, PathProgress>;
  availablePoints: number;
  onSkillSelect: (skillId: string) => void;
  activeSkillId?: string;
}

// Константы для размещения узлов на сетке
const GRID_ROWS = 4; // Максимальное количество уровней в дереве
const GRID_COLS = 4; // Максимальное количество узлов в одном уровне

export const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  pathsProgress,
  availablePoints,
  onSkillSelect,
  activeSkillId
}) => {
  // Выбранный путь развития (по умолчанию - физический)
  const [selectedPath, setSelectedPath] = useState<ClassPath>('physical');
  
  // Фильтруем навыки по выбранному пути
  const pathSkills = ALL_SKILL_NODES.filter(skill => skill.path === selectedPath);
  
  // Получаем прогресс по выбранному пути
  const currentPathProgress = pathsProgress[selectedPath];
  
  // Функция для определения, доступен ли навык для изучения
  const isSkillAvailable = (skill: SkillNode): boolean => {
    // Если навык уже разблокирован, он недоступен для повторного изучения
    if (currentPathProgress.unlockedNodes.includes(skill.id)) return false;
    
    // Если недостаточно очков навыков, он недоступен
    if (availablePoints < skill.cost) return false;
    
    // Если у навыка есть пререквизиты, проверяем, разблокированы ли они
    if (skill.prerequisites.length > 0) {
      const allPrerequisitesMet = skill.prerequisites.every(
        prereqId => currentPathProgress.activeNodes.includes(prereqId)
      );
      if (!allPrerequisitesMet) return false;
    }
    
    // Проверяем, достигнут ли необходимый уровень в пути для разблокировки
    if (currentPathProgress.level < skill.level - 1) return false;
    
    return true;
  };
  
  // Функция для определения стиля узла навыка
  const getNodeStyle = (skill: SkillNode): string => {
    let nodeClass = styles.skillNode;
    
    if (skill.id === activeSkillId) {
      nodeClass += ` ${styles.activeNode}`;
    }
    
    if (currentPathProgress.activeNodes.includes(skill.id)) {
      nodeClass += ` ${styles.unlockedNode}`;
    } else if (isSkillAvailable(skill)) {
      nodeClass += ` ${styles.availableNode}`;
    } else {
      nodeClass += ` ${styles.lockedNode}`;
    }
    
    if (skill.isCapstone) {
      nodeClass += ` ${styles.capstoneNode}`;
    }
    
    return nodeClass;
  };
  
  // Функция для определения стиля линии соединения между узлами
  const getLineStyle = (fromSkill: SkillNode, toSkill: SkillNode): string => {
    let lineClass = styles.skillLine;
    
    // Если оба навыка разблокированы, линия активна
    if (currentPathProgress.activeNodes.includes(fromSkill.id) && 
        currentPathProgress.activeNodes.includes(toSkill.id)) {
      lineClass += ` ${styles.activeLine}`;
    }
    // Если исходный навык разблокирован, а целевой доступен, линия "готова"
    else if (currentPathProgress.activeNodes.includes(fromSkill.id) && 
             isSkillAvailable(toSkill)) {
      lineClass += ` ${styles.readyLine}`;
    }
    // В остальных случаях линия неактивна
    else {
      lineClass += ` ${styles.inactiveLine}`;
    }
    
    return lineClass;
  };
  
  // Расчет позиций узлов на сетке
  const getNodePosition = (skill: SkillNode) => {
    // Определяем координаты на основе уровня навыка и его позиции в уровне
    const row = skill.level - 1; // Уровни начинаются с 1, ряды с 0
    
    // Находим все навыки того же уровня и определяем их позиции
    const sameLevel = pathSkills.filter(s => s.level === skill.level);
    const position = sameLevel.findIndex(s => s.id === skill.id);
    
    // Вычисляем колонку, распределяя навыки равномерно
    const totalInLevel = sameLevel.length;
    const spacing = 100 / (totalInLevel + 1);
    const col = (position + 1) * spacing;
    
    return {
      top: `${(row / (GRID_ROWS - 1)) * 100}%`,
      left: `${col}%`
    };
  };
  
  // Рендеринг линий соединения между узлами
  const renderLines = () => {
    const lines: JSX.Element[] = [];
    
    // Для каждого навыка смотрим его пререквизиты и рисуем линии
    pathSkills.forEach(skill => {
      skill.prerequisites.forEach(prereqId => {
        const prerequisite = pathSkills.find(s => s.id === prereqId);
        if (prerequisite) {
          // Вычисляем позиции обоих узлов
          const fromPos = getNodePosition(prerequisite);
          const toPos = getNodePosition(skill);
          
          // Создаем уникальный ключ для линии
          const lineKey = `${prereqId}-${skill.id}`;
          
          // Получаем стиль линии
          const lineStyle = getLineStyle(prerequisite, skill);
          
          // Рисуем линию SVG
          lines.push(
            <div 
              key={lineKey}
              className={lineStyle}
              style={{
                position: 'absolute',
                top: fromPos.top,
                left: fromPos.left,
                width: `${Math.abs(parseFloat(toPos.left) - parseFloat(fromPos.left))}%`,
                height: `${Math.abs(parseFloat(toPos.top) - parseFloat(fromPos.top))}%`,
                transformOrigin: 'left top',
                transform: `rotate(${Math.atan2(
                  parseFloat(toPos.top) - parseFloat(fromPos.top),
                  parseFloat(toPos.left) - parseFloat(fromPos.left)
                )}rad)`
              }}
            />
          );
        }
      });
    });
    
    return lines;
  };
  
  // Рендеринг узлов навыков
  const renderNodes = () => {
    return pathSkills.map(skill => {
      const nodeClass = getNodeStyle(skill);
      const position = getNodePosition(skill);
      
      return (
        <div
          key={skill.id}
          className={nodeClass}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => isSkillAvailable(skill) && onSkillSelect(skill.id)}
          title={`${skill.name}: ${skill.description}`}
        >
          <div className={styles.nodeIcon}>
            {skill.icon ? (
              <img src={skill.icon} alt={skill.name} className={styles.skillIcon} />
            ) : (
              skill.level
            )}
          </div>
          <div className={styles.nodeName}>{skill.name}</div>
          {isSkillAvailable(skill) && (
            <div className={styles.nodeCost}>{skill.cost} оч.</div>
          )}
        </div>
      );
    });
  };
  
  // Отображение описания выбранного навыка
  const renderSelectedSkillDetails = () => {
    if (!activeSkillId) return null;
    
    const selectedSkill = ALL_SKILL_NODES.find(skill => skill.id === activeSkillId);
    if (!selectedSkill) return null;
    
    const isUnlocked = currentPathProgress.activeNodes.includes(selectedSkill.id);
    const canUnlock = isSkillAvailable(selectedSkill);
    
    return (
      <div className={styles.skillDetails}>
        <h3 className={styles.skillTitle}>{selectedSkill.name}</h3>
        <div className={styles.skillLevel}>Уровень {selectedSkill.level}</div>
        <p className={styles.skillDescription}>{selectedSkill.description}</p>
        
        {selectedSkill.effects.length > 0 && (
          <div className={styles.effectsList}>
            <h4>Эффекты:</h4>
            <ul>
              {selectedSkill.effects.map((effect, index) => (
                <li key={index}>{effect.description}</li>
              ))}
            </ul>
          </div>
        )}
        
        {selectedSkill.prerequisites.length > 0 && (
          <div className={styles.prerequisites}>
            <h4>Требуется:</h4>
            <ul>
              {selectedSkill.prerequisites.map(prereqId => {
                const prereq = ALL_SKILL_NODES.find(s => s.id === prereqId);
                const isPrereqUnlocked = prereq ? currentPathProgress.activeNodes.includes(prereq.id) : false;
                
                return (
                  <li 
                    key={prereqId} 
                    className={isPrereqUnlocked ? styles.metPrereq : styles.unmetPrereq}
                  >
                    {prereq?.name || prereqId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        <div className={styles.skillStatus}>
          {isUnlocked ? (
            <span className={styles.unlockedStatus}>Изучено</span>
          ) : canUnlock ? (
            <div className={styles.unlockInfo}>
              <span>Стоимость: {selectedSkill.cost} очков</span>
              <button 
                className={styles.unlockButton}
                onClick={() => onSkillSelect(selectedSkill.id)}
              >
                Изучить
              </button>
            </div>
          ) : (
            <span className={styles.lockedStatus}>Недоступно</span>
          )}
        </div>
      </div>
    );
  };
  
  // Отображение вкладок для переключения между путями развития
  const renderPathTabs = () => {
    const paths: ClassPath[] = ['physical', 'magical', 'techno', 'bio', 'ritual'];
    
    return (
      <div className={styles.pathTabs}>
        {paths.map(path => {
          const pathInfo = DEVELOPMENT_PATHS[path];
          
          return (
            <div
              key={path}
              className={`${styles.pathTab} ${path === selectedPath ? styles.activeTab : ''}`}
              onClick={() => setSelectedPath(path)}
            >
              <div className={styles.pathTabContent}>
                {pathInfo.icon && (
                  <img src={pathInfo.icon} alt={pathInfo.name} className={styles.pathIcon} />
                )}
                <span>{pathInfo.name}</span>
                <span className={styles.pathLevel}>Ур. {pathsProgress[path].level}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Рендеринг индикатора опыта для текущего пути
  const renderPathExperienceBar = () => {
    const { experience, experienceToNextLevel, level } = currentPathProgress;
    const progressPercent = (experience / experienceToNextLevel) * 100;
    
    return (
      <div className={styles.pathExperience}>
        <div className={styles.pathExpHeader}>
          <span>Опыт пути {DEVELOPMENT_PATHS[selectedPath].name}</span>
          <span>Уровень {level}</span>
        </div>
        <div className={styles.expBarContainer}>
          <div 
            className={styles.expBarFill}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className={styles.expText}>
          {experience} / {experienceToNextLevel}
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.skillTreePanel}>
      <div className={styles.header}>
        <h2>Дерево Навыков</h2>
        <div className={styles.pointsCounter}>
          Доступные очки: <span>{availablePoints}</span>
        </div>
      </div>
      
      {renderPathTabs()}
      {renderPathExperienceBar()}
      
      <div className={styles.treeContainer}>
        <div className={styles.treeGrid}>
          {renderLines()}
          {renderNodes()}
        </div>
        
        {renderSelectedSkillDetails()}
      </div>
    </div>
  );
}; 