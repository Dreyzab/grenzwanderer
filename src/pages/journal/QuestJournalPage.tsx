import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { QuestJournal } from '@/widgets/quest/QuestJournal';
import { useQuestLog, QuestObjective, Quest } from '@/features/quest/hooks/useQuestLog';

type QuestTab = 'main' | 'side' | 'completed';

/**
 * Страница журнала квестов
 * Отображает список активных, побочных и завершенных квестов
 */
export const QuestJournalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QuestTab>('main');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  
  // Получение квестов из хука
  const { 
    mainQuests, 
    sideQuests, 
    completedQuests,
    trackQuestOnMap
  } = useQuestLog();
  
  // Обработка выбора квеста
  const handleQuestSelect = (questId: string) => {
    setSelectedQuestId(questId);
  };
  
  // Обработка отслеживания квеста на карте
  const handleTrackQuest = (questId: string) => {
    trackQuestOnMap(questId);
    // Можно добавить здесь навигацию на карту, если нужно
  };
  
  // Получение активных квестов в зависимости от выбранной вкладки
  const getActiveQuests = (): Quest[] => {
    switch(activeTab) {
      case 'main':
        return mainQuests;
      case 'side':
        return sideQuests;
      case 'completed':
        return completedQuests;
      default:
        return [];
    }
  };
  
  // Получение выбранного квеста
  const selectedQuest = selectedQuestId 
    ? [...mainQuests, ...sideQuests, ...completedQuests].find(q => q.id === selectedQuestId)
    : null;
  
  return (
    <PageLayout
      header={
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-heading text-center">Журнал квестов</h1>
          
          {/* Вкладки */}
          <div className="flex border-b border-surface-variant">
            <button 
              className={`py-2 px-4 ${activeTab === 'main' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('main')}
            >
              Основные
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'side' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('side')}
            >
              Побочные
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'completed' ? 'border-b-2 border-accent text-accent' : 'text-text-secondary'}`}
              onClick={() => setActiveTab('completed')}
            >
              Завершённые
            </button>
          </div>
        </div>
      }
      content={
        <div className="h-full flex flex-col lg:flex-row gap-4">
          {/* Список квестов */}
          <div className={`flex-1 overflow-auto ${selectedQuest ? 'lg:w-1/3' : 'w-full'}`}>
            <QuestJournal
              quests={getActiveQuests()}
              onQuestSelect={handleQuestSelect}
              isEnhanced={false}
            />
          </div>
          
          {/* Детали выбранного квеста */}
          {selectedQuest && (
            <div className="flex-1 bg-surface rounded-lg p-4 lg:w-2/3">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-heading">{selectedQuest.title}</h2>
                <button 
                  className="bg-accent text-surface px-3 py-1 rounded text-sm"
                  onClick={() => handleTrackQuest(selectedQuest.id)}
                >
                  Отслеживать на карте
                </button>
              </div>
              
              <div className="text-text-secondary mb-4">
                {selectedQuest.description}
              </div>
              
              <div className="mb-4">
                <h3 className="font-heading mb-2">Цели:</h3>
                <ul className="list-disc pl-5">
                  {selectedQuest.objectives.map((objective: QuestObjective, index: number) => (
                    <li 
                      key={index}
                      className={objective.completed ? 'line-through text-success' : ''}
                    >
                      {objective.text}
                    </li>
                  ))}
                </ul>
              </div>
              
              {selectedQuest.rewards && (
                <div>
                  <h3 className="font-heading mb-2">Награда:</h3>
                  <ul className="list-disc pl-5">
                    {selectedQuest.rewards.map((reward: string, index: number) => (
                      <li key={index}>{reward}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};

export default QuestJournalPage; 