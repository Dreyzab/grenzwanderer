// src/components/SignOutButton/Dialog/GameScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useUnit } from 'effector-react';
import { $currentUser } from '../../../entities/user/model';
import { VisualNovel } from '../../../pages/visualNovel/VisualNovel';
import './GameScreen.css';

interface GameScreenProps {
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit }) => {
  const navigate = useNavigate();
  const user = useUnit($currentUser);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [sceneKey, setSceneKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get Convex mutations and queries
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const scene = useQuery(api.quest.getCurrentScene, playerId ? { playerId } : "skip");
  
  // Load player and current scene
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const initializeGame = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get player profile
        const player = await getOrCreatePlayer({ userId: user.id as any });
        if (!player) {
          throw new Error("Could not create or find player profile");
        }
        
        setPlayerId(player._id);
        
        // Get current scene
        if (scene) {
          setSceneKey(scene.sceneKey);
        }
      } catch (err) {
        setError(`Error initializing game: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeGame();
  }, [user, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="game-screen-loading">
        <div className="loading-spinner"></div>
        <p>Loading scene...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="game-screen-error">
        <p>{error}</p>
        <button onClick={onExit}>Return to Map</button>
      </div>
    );
  }
  
  // Show visual novel if we have a scene
  if (sceneKey && playerId) {
    return (
      <VisualNovel
        initialSceneId={sceneKey}
        playerId={playerId}
        onExit={onExit}
      />
    );
  }
  
  // Show empty state
  return (
    <div className="game-screen-empty">
      <p>No active scene</p>
      <button onClick={onExit}>Return to Map</button>
    </div>
  );
};