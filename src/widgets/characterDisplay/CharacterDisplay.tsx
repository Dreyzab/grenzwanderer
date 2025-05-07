// src/widgets/characterDisplay/CharacterDisplay.tsx
import React from 'react';
import './CharacterDisplay.css';
import { Character } from '../../shared/types/visualNovel';

interface CharacterDisplayProps {
  characters: Character[];
  activeSpeakerSpriteId?: string;
  fadeIn?: boolean;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ 
  characters, 
  activeSpeakerSpriteId,
  fadeIn = true 
}) => {
  if (!characters || characters.length === 0) return null;
  
  return (
    <div className="characters-container">
      {characters.map((character) => {
        const positionClass = character.position ? `character-${character.position}` : 'character-center';
        const animationClass = fadeIn ? 'character-fade-in' : '';
        const isActive = character.id === activeSpeakerSpriteId;
        
        return (
          <div 
            key={character.id}
            className={`character-display ${positionClass} ${animationClass} ${isActive ? 'character-active' : 'character-inactive'}`}
          >
            <img 
              src={character.spriteUrl} 
              alt={character.name} 
              className="character-image" 
            />
            {character.name && isActive && (
              <div className="character-name">{character.name}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// src/widgets/characterDisplay/CharacterDisplay.css
