import React from 'react';
import { SceneRenderer } from '../../widgets/SceneRenderer/SceneRenderer';
import { VisualNovelPageProps } from '../../shared/types/gameScreen';
import './VisualNovel.css';

export const VisualNovel: React.FC<VisualNovelPageProps> = ({
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