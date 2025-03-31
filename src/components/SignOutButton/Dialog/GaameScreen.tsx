import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DialogChoice } from './DialogChoice';
import './GameScreen.css';

interface GameScreenProps {
  playerId: string;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ playerId, onExit }) => {
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Fetch current scene
  const scene = useQuery(api.quest.getCurrentScene, { playerId });
  
  // Mutation for making choices
  const makeChoice = useMutation(api.quest.makeSceneChoice);
  
  // Set initial scene
  useEffect(() => {
    if (scene && !currentSceneId) {
      setCurrentSceneId(scene._id);
    }
  }, [scene, currentSceneId]);
  
  // Handle choice click
  const handleChoice = async (choiceIndex: number) => {
    if (!currentSceneId) return;
    
    setIsTransitioning(true);
    
    try {
      const result = await makeChoice({
        playerId,
        sceneId: currentSceneId as any,
        choiceIndex
      });
      
      // Show feedback message
      setMessage(result.message);
      
      // If there's a next scene, transition to it
      if (result.nextSceneId) {
        setTimeout(() => {
          setCurrentSceneId(result.nextSceneId);
          setIsTransitioning(false);
          setMessage(null);
        }, 1500);
      } else {
        setIsTransitioning(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ошибка при выборе');
      setIsTransitioning(false);
    }
  };
  
  // If no scene data yet, show loading
  if (!scene) {
    return (
      <div className="game-screen">
        <div className="game-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="game-screen">
      {/* Background image */}
      <div
        className="game-background"
        style={{
          backgroundImage: scene.background ? `url(${scene.background})` : 'none'
        }}
      ></div>
      
      {/* Message overlay */}
      {message && (
        <div className="game-message-overlay">
          <div className="game-message">{message}</div>
        </div>
      )}
      
      {/* Dialog content */}
      <div className={`game-content ${isTransitioning ? 'transitioning' : ''}`}>
        <h2 className="game-title">{scene.title}</h2>
        <div className="game-dialog">{scene.text}</div>
        
        {/* Choices */}
        {!isTransitioning && scene.choices && scene.choices.length > 0 && (
          <div className="game-choices">
            {scene.choices.map((choice, index) => (
              <DialogChoice
                key={index}
                text={choice.text}
                onClick={() => handleChoice(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Exit button */}
      <button className="game-exit-button" onClick={onExit}>
        Выход
      </button>
    </div>
  );
};