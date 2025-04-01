// src/widgets/characterDisplay/CharacterDisplay.tsx
import React from 'react';
import './CharacterDisplay.css';
import { Character } from '../../schared/types/visualNovel';

interface CharacterDisplayProps {
  character?: Character;
  fadeIn?: boolean;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ 
  character, 
  fadeIn = true 
}) => {
  if (!character) return null;
  
  const positionClass = character.position ? `character-${character.position}` : 'character-center';
  const animationClass = fadeIn ? 'character-fade-in' : '';
  
  return (
    <div className={`character-display ${positionClass} ${animationClass}`}>
      <img 
        src={character.image} 
        alt={character.name} 
        className="character-image" 
      />
      {character.name && (
        <div className="character-name">{character.name}</div>
      )}
    </div>
  );
};

// src/widgets/characterDisplay/CharacterDisplay.css
