import { useState, useEffect } from 'react';

// Типы для работы с квестами
export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards?: string[];
  type: 'main' | 'side';
  isCompleted: boolean;
  status: 'active' | 'completed' | 'failed';
  region?: string;
  progress?: number; // 0-100
  tracked?: boolean;
}

export const useQuestLog = () => {
  const [mainQuests, setMainQuests] = useState<Quest[]>([
    {
      id: 'main1',
      title: 'Поиск выживших',
      description: 'Найти выживших в разрушенном районе города',
      objectives: [
        { id: 'obj1', text: 'Исследовать западный сектор', completed: true },
        { id: 'obj2', text: 'Обыскать разрушенные здания', completed: false },
        { id: 'obj3', text: 'Связаться с базой', completed: false }
      ],
      rewards: ['500 опыта', 'Аптечка', 'Новое снаряжение'],
      type: 'main',
      isCompleted: false,
      status: 'active',
      region: 'downtown',
      progress: 35
    }
  ]);
  
  const [sideQuests, setSideQuests] = useState<Quest[]>([
    {
      id: 'side1',
      title: 'Потерянный груз',
      description: 'Найти потерянный груз медикаментов',
      objectives: [
        { id: 'sobj1', text: 'Найти обломки грузовика', completed: true },
        { id: 'sobj2', text: 'Обыскать окрестности', completed: false }
      ],
      rewards: ['200 опыта', 'Медикаменты'],
      type: 'side',
      isCompleted: false,
      status: 'active',
      region: 'outskirts',
      progress: 50
    }
  ]);
  
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([
    {
      id: 'comp1',
      title: 'Первый контакт',
      description: 'Установить контакт с группой выживших',
      objectives: [
        { id: 'cobj1', text: 'Найти лагерь выживших', completed: true },
        { id: 'cobj2', text: 'Договориться о сотрудничестве', completed: true }
      ],
      rewards: ['300 опыта', 'Новый союзник'],
      type: 'side',
      isCompleted: true,
      status: 'completed',
      region: 'residential',
      progress: 100
    }
  ]);
  
  // Отслеживание квеста на карте
  const trackQuestOnMap = (questId: string): void => {
    console.log(`Отслеживание квеста с ID: ${questId}`);
    // Здесь была бы реальная логика отслеживания квеста на карте
  };
  
  return {
    mainQuests,
    sideQuests,
    completedQuests,
    trackQuestOnMap
  };
}; 