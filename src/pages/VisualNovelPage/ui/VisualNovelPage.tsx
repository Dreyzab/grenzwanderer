import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VisualNovel } from '../VisualNovel';
import { GameView } from '@/shared/types/gameScreen';
import { PageLayout } from '@/shared/ui';
import styles from './VisualNovelPage.module.css';

export const VisualNovelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем параметры из состояния навигации или используем значения по умолчанию
  const { 
    sceneId = 'default_scene',
    playerId,
    questState,
    playerStats
  } = (location.state as any) || {};
  
  // Обработчик выхода из визуальной новеллы
  const handleExit = (finalQuestState?: any, finalPlayerStats?: any) => {
    // Здесь можно сохранить состояние и перенаправить пользователя
    console.log('Visual novel exit:', { finalQuestState, finalPlayerStats });
    navigate('/game');
  };
  
  return (
    <PageLayout>
      <div className={styles.visualNovelPageWrapper}>
        <VisualNovel
          initialSceneId={sceneId}
          playerId={playerId}
          initialQuestState={questState}
          initialPlayerStats={playerStats}
          onExit={handleExit}
        />
      </div>
    </PageLayout>
  );
}; 