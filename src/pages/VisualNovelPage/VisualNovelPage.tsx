import React from 'react';
import { SceneRenderer } from '../../widgets/SceneRenderer/SceneRenderer';
import './VisualNovelPage.css';

interface VisualNovelPageProps {
  initialSceneId: string;
  playerId?: string;
  initialQuestState?: any;
  initialPlayerStats?: any;
  onExit?: (finalQuestState?: any, finalPlayerStats?: any) => void;
}

export const VisualNovelPage: React.FC<VisualNovelPageProps> = ({
  initialSceneId,
  playerId,
  initialQuestState,
  initialPlayerStats,
  onExit
}) => {
  return (
    <div className="visual-novel-page">
      <SceneRenderer
        initialSceneId={initialSceneId}
        playerId={playerId}
        initialQuestState={initialQuestState}
        initialPlayerStats={initialPlayerStats}
        onExit={onExit}
      />
    </div>
  );
}; 