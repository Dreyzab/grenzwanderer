import { FC, useState } from 'react';
import styles from './CharacterSheet.module.css';
import { AttributesPanel } from './AttributesPanel';
import { SecondaryStatsPanel } from './SecondaryStatsPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { usePlayerAttributes } from '../../../entities/player/model/playerAttributes';
import { usePlayerSkills, unlockSkill } from '../../../entities/player/model/playerSkills';

export const CharacterSheet: FC = () => {
  // Активная вкладка CharacterSheet
  const [activeTab, setActiveTab] = useState<'attributes' | 'skills'>('attributes');
  // Активный навык (для отображения деталей)
  const [activeSkillId, setActiveSkillId] = useState<string | undefined>(undefined);
  
  // Получаем данные из моделей
  const {
    attributes,
    secondaryStats,
    level,
    availableAttributePoints,
    updateAttribute
  } = usePlayerAttributes();
  
  const {
    skillsState,
    availablePoints: availableSkillPoints,
    unlockSkill: unlockPlayerSkill
  } = usePlayerSkills();
  
  // Обработчик выбора навыка
  const handleSkillSelect = (skillId: string) => {
    // Если навык уже выбран, разблокируем его
    if (activeSkillId === skillId) {
      unlockPlayerSkill(skillId);
    } else {
      // Иначе просто выбираем для отображения деталей
      setActiveSkillId(skillId);
    }
  };
  
  return (
    <div className={styles.characterSheet}>
      <div className={styles.header}>
        <h1 className={styles.title}>Лист персонажа</h1>
        <div className={styles.levelBadge}>
          Уровень <span>{level.level}</span>
        </div>
      </div>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'attributes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          Характеристики
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'skills' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Навыки
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'attributes' ? (
          <div className={styles.attributesTab}>
            <div className={styles.expBar}>
              <div className={styles.expBarLabel}>
                Опыт: {level.currentXP} / {level.requiredXP}
              </div>
              <div className={styles.expBarContainer}>
                <div 
                  className={styles.expBarFill} 
                  style={{ width: `${(level.currentXP / level.requiredXP) * 100}%` }}
                />
              </div>
            </div>
            
            <AttributesPanel 
              attributes={attributes}
              availablePoints={availableAttributePoints}
              onAllocatePoint={updateAttribute}
            />
            
            <SecondaryStatsPanel secondaryStats={secondaryStats} />
          </div>
        ) : (
          <div className={styles.skillsTab}>
            <SkillTreePanel 
              pathsProgress={skillsState.paths}
              availablePoints={availableSkillPoints}
              onSkillSelect={handleSkillSelect}
              activeSkillId={activeSkillId}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 