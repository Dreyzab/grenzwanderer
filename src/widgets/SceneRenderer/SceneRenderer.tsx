import React from 'react';
import { useSceneLoader } from '../../features/scene/useSceneLoader';
import { useSceneChoice } from '../../features/scene/useSceneChoice';
import { CharacterDisplay } from '../characterDisplay/CharacterDisplay';
import { DialogText } from '../dialogText/DialogText';
import { ChoiceList } from '../choiceList/ChoiceList';
import { StatsPanel } from '../statsPanel/StatsPanel';

interface SceneRendererProps {
  initialSceneId?: string;
  onExit?: () => void;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ initialSceneId, onExit }) => {
  const { currentScene, loading, error } = useSceneLoader(initialSceneId);
  const { handleChoice } = useSceneChoice({ onExit });

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!currentScene) return <div>Нет сцены</div>;

  return (
    <div className="visual-novel">
      {currentScene.character && <CharacterDisplay character={currentScene.character} />}
      <DialogText />
      <ChoiceList onChoiceSelected={handleChoice} />
      <StatsPanel />
    </div>
  );
}; 