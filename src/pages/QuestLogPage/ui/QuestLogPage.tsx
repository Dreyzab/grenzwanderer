import React, { useState } from 'react';
import { QuestJournal } from '@/widgets/QuestJournal';
import { PageLayout } from '@/shared/ui';
import styles from './QuestLogPage.module.css';

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

  return (
    <PageLayout>
      <div className={styles.questLogPage}>
        <header className={styles.questLogHeader}>
          <h1>Журнал заданий</h1>
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <span>Статус:</span>
              <select 
                value={filters.status} 
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="all">Все задания</option>
                <option value="active">Активные</option>
                <option value="completed">Завершенные</option>
                <option value="failed">Проваленные</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <span>Район:</span>
              <select 
                value={filters.region || ''} 
                onChange={(e) => handleRegionChange(e.target.value || null)}
                className={styles.filterSelect}
              >
                <option value="">Все районы</option>
                <option value="downtown">Центр города</option>
                <option value="industrial">Промзона</option>
                <option value="residential">Жилой сектор</option>
                <option value="outskirts">Окраина</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <span>Сортировка:</span>
              <select 
                value={filters.sortBy} 
                onChange={(e) => handleSortChange(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="priority">По приоритету</option>
              </select>
            </div>
          </div>
        </header>
        
        <div className={styles.questLogContent}>
          <div className={styles.questList}>
            <QuestJournal 
              filters={filters}
              onToggleTracking={handleToggleTracking}
            />
          </div>
          
          <div className={styles.questDetails}>
            {/* Компонент с деталями выбранного квеста будет отображаться здесь */}
            <div className={styles.emptyState}>
              <p>Выберите квест для просмотра деталей</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}; 