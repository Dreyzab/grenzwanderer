import React, { useState } from 'react';
import { PageLayout } from '@/shared/ui';
import { QuestJournal } from '@/widgets/quest/QuestJournal';

interface QuestFilter {
  status: 'all' | 'active' | 'completed' | 'failed';
  region: string | null;
  sortBy: 'newest' | 'oldest' | 'priority';
}

export const QuestLogPage: React.FC = () => {
  const [filters, setFilters] = useState<QuestFilter>({
    status: 'all',
    region: null,
    sortBy: 'newest'
  });

  const handleStatusChange = (status: 'all' | 'active' | 'completed' | 'failed') => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleRegionChange = (region: string | null) => {
    setFilters(prev => ({ ...prev, region }));
  };

  const handleSortChange = (sortBy: 'newest' | 'oldest' | 'priority') => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleToggleTracking = (questId: string, tracked: boolean) => {
    // Здесь будет логика для включения/выключения отслеживания квеста
    console.log(`Квест ${questId} ${tracked ? 'отслеживается' : 'не отслеживается'}`);
  };

  // Содержимое заголовка
  const header = (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-heading text-center">Журнал заданий</h1>
      <div className="flex flex-wrap gap-4 p-3 bg-surface rounded-lg shadow">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">Статус:</span>
          <select 
            value={filters.status} 
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-3 py-2 border border-outline rounded bg-surface text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="all">Все задания</option>
            <option value="active">Активные</option>
            <option value="completed">Завершенные</option>
            <option value="failed">Проваленные</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">Район:</span>
          <select 
            value={filters.region || ''} 
            onChange={(e) => handleRegionChange(e.target.value || null)}
            className="px-3 py-2 border border-outline rounded bg-surface text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Все районы</option>
            <option value="downtown">Центр города</option>
            <option value="industrial">Промзона</option>
            <option value="residential">Жилой сектор</option>
            <option value="outskirts">Окраина</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">Сортировка:</span>
          <select 
            value={filters.sortBy} 
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="px-3 py-2 border border-outline rounded bg-surface text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Содержимое контента
  const content = (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="flex-1 min-w-[250px] max-w-full md:max-w-[350px] bg-surface rounded-lg shadow overflow-hidden">
        <QuestJournal 
          filters={filters}
          onToggleTracking={handleToggleTracking}
          isEnhanced={true}
        />
      </div>
      
      <div className="flex-2 bg-surface rounded-lg shadow p-4 overflow-y-auto">
        {/* Компонент с деталями выбранного квеста будет отображаться здесь */}
        <div className="flex items-center justify-center h-full text-text-secondary italic">
          <p>Выберите квест для просмотра деталей</p>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      header={header}
      content={content}
    />
  );
}; 