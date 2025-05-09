import React, { useState } from 'react';

// Общий интерфейс квеста для обеих версий
interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  region?: string;
  progress?: number; // 0-100
  rewards?: string[];
  tracked?: boolean;
}

// Интерфейс для старой версии QuestJournal
interface SimpleQuestJournalProps {
  quests?: Quest[];
  onQuestSelect?: (questId: string) => void;
  isEnhanced?: false;
}

// Интерфейс для новой версии QuestJournal
interface EnhancedQuestJournalProps {
  filters?: {
    status: 'all' | 'active' | 'completed' | 'failed';
    region: string | null;
    sortBy: 'newest' | 'oldest' | 'priority';
  };
  onQuestSelect?: (questId: string) => void;
  onToggleTracking?: (questId: string, tracked: boolean) => void;
  isEnhanced: true;
}

/**
 * Виджет журнала квестов для отображения активных и завершенных заданий
 */
export const QuestJournal: React.FC<SimpleQuestJournalProps | EnhancedQuestJournalProps> = (props) => {
  // Выбираем нужную версию компонента
  if ('isEnhanced' in props && props.isEnhanced) {
    return <EnhancedQuestJournal {...props as EnhancedQuestJournalProps} />;
  } else {
    return <SimpleQuestJournal {...props as SimpleQuestJournalProps} />;
  }
};

/**
 * Простая версия компонента QuestJournal
 */
const SimpleQuestJournal: React.FC<SimpleQuestJournalProps> = ({
  quests = [],
  onQuestSelect
}) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  
  // Группируем квесты по статусу
  const activeQuests = quests.filter(quest => quest.status === 'active');
  const completedQuests = quests.filter(quest => quest.status === 'completed');
  const failedQuests = quests.filter(quest => quest.status === 'failed');
  
  const handleQuestClick = (questId: string) => {
    setSelectedQuestId(questId);
    if (onQuestSelect) {
      onQuestSelect(questId);
    }
  };
  
  const selectedQuest = quests.find(quest => quest.id === selectedQuestId);
  
  return (
    <div className="quest-journal">
      <div className="quest-journal-sidebar">
        <h2>Журнал квестов</h2>
        
        {activeQuests.length > 0 && (
          <>
            <h3>Активные задания</h3>
            <ul className="quest-list">
              {activeQuests.map(quest => (
                <li 
                  key={quest.id}
                  className={`quest-item ${selectedQuestId === quest.id ? 'selected' : ''}`}
                  onClick={() => handleQuestClick(quest.id)}
                >
                  <div className="quest-title">{quest.title}</div>
                  {quest.progress !== undefined && (
                    <div className="quest-progress-bar">
                      <div 
                        className="quest-progress-fill"
                        style={{ width: `${quest.progress}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {completedQuests.length > 0 && (
          <>
            <h3>Завершенные задания</h3>
            <ul className="quest-list completed">
              {completedQuests.map(quest => (
                <li 
                  key={quest.id}
                  className={`quest-item ${selectedQuestId === quest.id ? 'selected' : ''}`}
                  onClick={() => handleQuestClick(quest.id)}
                >
                  <div className="quest-title">{quest.title}</div>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {failedQuests.length > 0 && (
          <>
            <h3>Проваленные задания</h3>
            <ul className="quest-list failed">
              {failedQuests.map(quest => (
                <li 
                  key={quest.id}
                  className={`quest-item ${selectedQuestId === quest.id ? 'selected' : ''}`}
                  onClick={() => handleQuestClick(quest.id)}
                >
                  <div className="quest-title">{quest.title}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      
      <div className="quest-details">
        {selectedQuest ? (
          <div className="quest-detail-content">
            <h2>{selectedQuest.title}</h2>
            <div className={`quest-status ${selectedQuest.status}`}>
              {selectedQuest.status === 'active' && 'В процессе'}
              {selectedQuest.status === 'completed' && 'Завершено'}
              {selectedQuest.status === 'failed' && 'Провалено'}
            </div>
            <p className="quest-description">{selectedQuest.description}</p>
            
            {selectedQuest.rewards && selectedQuest.rewards.length > 0 && (
              <div className="quest-rewards">
                <h4>Награды:</h4>
                <ul>
                  {selectedQuest.rewards.map((reward, index) => (
                    <li key={index}>{reward}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="quest-detail-placeholder">
            <p>Выберите задание для просмотра детальной информации</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Расширенная версия компонента QuestJournal
 */
const EnhancedQuestJournal: React.FC<EnhancedQuestJournalProps> = ({
  filters = { status: 'all', region: null, sortBy: 'newest' },
  onQuestSelect,
  onToggleTracking
}) => {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  
  // Временные демо-данные для отображения квестов
  const demoQuests: Quest[] = [
    {
      id: 'q1',
      title: 'Тайна заброшенной лаборатории',
      description: 'Исследуйте заброшенную лабораторию на окраине города и выясните, что там происходило.',
      status: 'active',
      region: 'industrial',
      progress: 25,
      tracked: true,
      rewards: ['300 опыта', 'Доступ к новым локациям']
    },
    {
      id: 'q2',
      title: 'Потерянные данные',
      description: 'Найдите потерянный датачип с важной информацией о проекте "Грань".',
      status: 'active',
      region: 'downtown',
      progress: 50,
      tracked: false,
      rewards: ['400 опыта', 'Улучшенный хакерский инструмент']
    },
    {
      id: 'q3',
      title: 'Сделка с торговцем',
      description: 'Помогите местному торговцу обеспечить безопасную доставку товаров.',
      status: 'completed',
      region: 'residential',
      rewards: ['200 опыта', '500 кредитов']
    },
    {
      id: 'q4',
      title: 'Охота на вирус',
      description: 'Отследите источник цифрового вируса, поражающего имплантаты жителей.',
      status: 'failed',
      region: 'outskirts',
    }
  ];
  
  // Фильтрация и сортировка квестов
  const filteredQuests = demoQuests.filter(quest => {
    // Фильтр по статусу
    if (filters.status !== 'all' && quest.status !== filters.status) {
      return false;
    }
    // Фильтр по региону
    if (filters.region && quest.region !== filters.region) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Сортировка
    if (filters.sortBy === 'priority') {
      // Сначала отслеживаемые квесты
      if (a.tracked && !b.tracked) return -1;
      if (!a.tracked && b.tracked) return 1;
    }
    // По умолчанию - предполагаем, что новейшие имеют больший id
    return filters.sortBy === 'oldest' ? (a.id > b.id ? 1 : -1) : (a.id < b.id ? 1 : -1);
  });
  
  const handleQuestClick = (questId: string) => {
    setSelectedQuestId(questId);
    if (onQuestSelect) {
      onQuestSelect(questId);
    }
  };
  
  const handleToggleTracking = (e: React.MouseEvent, questId: string, currentTracked: boolean) => {
    e.stopPropagation(); // Предотвращаем выбор квеста при нажатии на кнопку отслеживания
    if (onToggleTracking) {
      onToggleTracking(questId, !currentTracked);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {filteredQuests.length > 0 ? (
          <div className="divide-y divide-surface-variant">
            {filteredQuests.map(quest => (
              <div 
                key={quest.id}
                className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-surface-variant/50 ${
                  selectedQuestId === quest.id ? 'bg-surface-variant' : ''
                }`}
                onClick={() => handleQuestClick(quest.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary">{quest.title}</h3>
                    
                    <div className="flex items-center mt-1 space-x-2">
                      {quest.status === 'active' && (
                        <span className="px-2 py-0.5 text-xs rounded bg-accent/10 text-accent">Активно</span>
                      )}
                      {quest.status === 'completed' && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 text-green-500">Завершено</span>
                      )}
                      {quest.status === 'failed' && (
                        <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-500">Провалено</span>
                      )}
                      
                      {quest.region && (
                        <span className="text-xs text-text-secondary">
                          {quest.region === 'downtown' && 'Центр города'}
                          {quest.region === 'industrial' && 'Промзона'}
                          {quest.region === 'residential' && 'Жилой сектор'}
                          {quest.region === 'outskirts' && 'Окраина'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {quest.status === 'active' && (
                    <button
                      className={`ml-2 w-6 h-6 flex items-center justify-center rounded-full ${
                        quest.tracked ? 'bg-accent text-on-accent' : 'bg-surface-variant text-text-secondary'
                      }`}
                      onClick={(e) => handleToggleTracking(e, quest.id, quest.tracked || false)}
                      aria-label={quest.tracked ? 'Перестать отслеживать' : 'Отслеживать квест'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {quest.progress !== undefined && quest.status === 'active' && (
                  <div className="mt-2 h-1.5 bg-surface-variant rounded overflow-hidden">
                    <div 
                      className="h-full bg-accent"
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-secondary italic py-8">
            <p>Нет доступных квестов с выбранными фильтрами</p>
          </div>
        )}
      </div>
    </div>
  );
};
