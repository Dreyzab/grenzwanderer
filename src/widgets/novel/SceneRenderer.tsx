import React, { useState, useEffect } from 'react';
import { NovelBackgroundWidget } from './NovelBackgroundWidget';
import { CharacterDisplayWidget } from './CharacterDisplayWidget';
import { DialogueBoxWidget } from './DialogueBoxWidget';
import { ChoiceListWidget } from './ChoiceListWidget';
import { DialogHistory } from './DialogHistory';

interface Character {
  id: string;
  name: string;
  position: 'left' | 'center' | 'right';
  image?: string;
  mood?: string;
}

interface DialogueLine {
  id: string;
  text: string;
  speakerName?: string;
}

interface Choice {
  id: string;
  text: string;
  disabled?: boolean;
  tooltip?: string;
}

interface SceneData {
  background: string;
  characters: Character[];
  dialogue?: DialogueLine;
  choices?: Choice[];
  effects?: Array<{
    type: 'rain' | 'snow' | 'fog' | 'blur' | 'shake';
    intensity?: number;
  }>;
}

interface SceneRendererProps {
  scene: SceneData;
  onDialogueAdvance: () => void;
  onChoiceSelected: (choiceId: string) => void;
  dialogHistory?: Array<{
    speakerName?: string;
    text: string;
  }>;
}

/**
 * Виджет-оркестратор для рендеринга сцен визуальной новеллы
 * Объединяет фон, персонажей, диалоги и выборы в единую сцену
 */
export const SceneRenderer: React.FC<SceneRendererProps> = ({
  scene,
  onDialogueAdvance,
  onChoiceSelected,
  dialogHistory = []
}) => {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | undefined>(undefined);
  
  // Определяем активного говорящего персонажа на основе текущей линии диалога
  useEffect(() => {
    if (scene.dialogue?.speakerName) {
      const speakingCharacter = scene.characters.find(
        char => char.name === scene.dialogue?.speakerName
      );
      setActiveSpeakerId(speakingCharacter?.id);
    } else {
      setActiveSpeakerId(undefined);
    }
  }, [scene.dialogue, scene.characters]);
  
  return (
    <div className="scene-container relative w-full h-full overflow-hidden">
      {/* Фон сцены */}
      <NovelBackgroundWidget 
        imageUrl={scene.background}
        effects={scene.effects}
      />
      
      {/* Персонажи */}
      {scene.characters.map(character => (
        <CharacterDisplayWidget
          key={character.id}
          character={{
            id: character.id,
            name: character.name,
            image: character.image,
            mood: character.mood,
            position: character.position
          }}
          isActive={character.id === activeSpeakerId}
          position={character.position}
        />
      ))}
      
      {/* История диалогов */}
      <div className="absolute top-2 right-2 z-10">
        <DialogHistory historyItems={dialogHistory} />
      </div>
      
      {/* Диалоговое окно или выборы */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {scene.dialogue && !scene.choices && (
          <DialogueBoxWidget
            dialogue={scene.dialogue.text}
            speakerName={scene.dialogue.speakerName}
            onAdvance={onDialogueAdvance}
          />
        )}
        
        {scene.choices && (
          <ChoiceListWidget
            choices={scene.choices}
            onChoiceSelected={onChoiceSelected}
          />
        )}
      </div>
    </div>
  );
}; 