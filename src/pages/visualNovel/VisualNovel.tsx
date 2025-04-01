// src/pages/visualNovel/VisualNovel.tsx
import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { 
  $currentScene, 
  setCurrentScene, 
  setSceneLoading,
  $sceneLoading
} from '../../entities/scene/model';
import {
  $playerStats,
  updatePlayerStat
} from '../../entities/player/model';
import { CharacterDisplay } from '../../widgets/characterDisplay/CharacterDisplay';
import { DialogText } from '../../widgets/dialogText/DialogText';
import { StatsPanel } from '../../widgets/statsPanel/StatsPanel';
import { ChoiceList } from '../../widgets/choiceList/ChoiceList';
import { Choice, Scene } from '../../schared/types/visualNovel';
import './VisualNovel.css';

interface VisualNovelProps {
  initialSceneId?: string;
  playerId?: string;
  onExit?: () => void;
}

interface SceneChoice {
  text: string;
  nextSceneId?: Id<"scenes">;
  action?: string;
  statChanges?: {
    energy?: number;
    willpower?: number;
    attractiveness?: number;
    fitness?: number;
    intelligence?: number;
    corruption?: number;
    money?: number;
  };
}

export const VisualNovel: React.FC<VisualNovelProps> = ({ 
  initialSceneId,
  playerId,
  onExit
}) => {
  const currentScene = useUnit($currentScene);
  const playerStats = useUnit($playerStats);
  const isLoading = useUnit($sceneLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneKey, setCurrentSceneKey] = useState(initialSceneId || "");
  
  // Get Convex queries and mutations
  const scene = useQuery(api.quest.getSceneByKey, { sceneKey: currentSceneKey });
  const makeSceneChoice = useMutation(api.quest.makeSceneChoice);
  
  // Load initial scene
  useEffect(() => {
    if (initialSceneId) {
      setCurrentSceneKey(initialSceneId);
    }
  }, [initialSceneId]);
  
  // Function to load a scene by ID
  const loadScene = async (sceneId: string) => {
    try {
      setSceneLoading(true);
      setError(null);
      setCurrentSceneKey(sceneId);
      
      if (!scene) {
        setError(`Scene not found: ${sceneId}`);
        return;
      }
      
      // Convert Convex scene to our internal Scene type
      const parsedScene: Scene = {
        id: scene._id.toString(),
        title: scene.title,
        background: scene.background || undefined,
        text: scene.text,
        character: scene.character ? {
          id: scene.character.name,
          name: scene.character.name,
          image: scene.character.image,
          position: scene.character.position as 'left' | 'center' | 'right'
        } : undefined,
        choices: scene.choices.map((choice: SceneChoice, index: number) => ({
          id: `choice_${index}`,
          text: choice.text,
          nextSceneId: choice.nextSceneId?.toString(),
          action: choice.action,
          statChanges: choice.statChanges ? {
            energy: choice.statChanges.energy,
            willpower: choice.statChanges.willpower,
            attractiveness: choice.statChanges.attractiveness,
            fitness: choice.statChanges.fitness,
            intelligence: choice.statChanges.intelligence,
            corruption: choice.statChanges.corruption,
            money: choice.statChanges.money
          } : undefined
        }))
      };
      
      setCurrentScene(parsedScene);
    } catch (err) {
      setError(`Error loading scene: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSceneLoading(false);
    }
  };
  
  // Handle player choice
  const handleChoiceSelected = async (choice: Choice) => {
    try {
      setSceneLoading(true);
      
      // Apply stat changes if any
      if (choice.statChanges) {
        Object.entries(choice.statChanges).forEach(([stat, value]) => {
          if (value !== undefined) {
            updatePlayerStat({ 
              stat: stat as keyof typeof playerStats, 
              value 
            });
          }
        });
      }
      
      // Handle special actions
      if (choice.action === 'end_character_creation' && onExit) {
        onExit();
        return;
      }
      
      // If we have playerId, send the choice to the server
      if (playerId && currentScene) {
        const result = await makeSceneChoice({
          playerId: playerId as Id<"players">,
          sceneId: currentScene.id as Id<"scenes">,
          choiceIndex: parseInt(choice.id.split('_')[1])
        });
        
        // If there's a next scene, load it
        if (result.nextSceneId) {
          await loadScene(result.nextSceneId.toString());
        }
      } 
      // Otherwise, just navigate if we have nextSceneId
      else if (choice.nextSceneId) {
        await loadScene(choice.nextSceneId);
      }
    } catch (err) {
      setError(`Error processing choice: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSceneLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="vn-loading">
        <div className="loading-spinner"></div>
        <p>Loading scene...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="vn-error">
        <p>{error}</p>
        <button onClick={onExit}>Return to Map</button>
      </div>
    );
  }
  
  // Show empty state
  if (!currentScene) {
    return (
      <div className="vn-empty">
        <p>No active scene</p>
        <button onClick={onExit}>Return to Map</button>
      </div>
    );
  }
  
  return (
    <div className="visual-novel">
      {/* Background */}
      {currentScene.background && (
        <div 
          className="vn-background"
          style={{ backgroundImage: `url(${currentScene.background})` }}
        />
      )}
      
      {/* Character */}
      <CharacterDisplay character={currentScene.character} />
      
      {/* UI Container */}
      <div className="vn-ui-container">
        {/* Stats Panel */}
        <div className="vn-stats-container">
          <StatsPanel />
        </div>
        
        {/* Dialog & Choices */}
        <div className="vn-dialog-container">
          <DialogText />
          <ChoiceList onChoiceSelected={handleChoiceSelected} />
        </div>
      </div>
    </div>
  );
};
