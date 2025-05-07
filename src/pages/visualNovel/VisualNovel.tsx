import React from 'react';
import { SceneRenderer } from '../../widgets/SceneRenderer/SceneRenderer';

interface VisualNovelProps {
  initialSceneId?: string;
  playerId?: string;
  onExit?: () => void;
  questState?: any;
}

export const VisualNovel: React.FC<VisualNovelProps> = (props) => {
  // Пробрасываем все пропсы в SceneRenderer
  return <SceneRenderer {...props} />;
};

export default VisualNovel; 