// src/widgets/characterDisplay/CharacterDisplay.tsx
import React, { useState } from 'react';
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
  
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Функция для обработки путей к изображениям
  const getImageUrl = (spriteUrl: string): string => {
    // Если путь уже абсолютный, возвращаем его как есть
    if (spriteUrl.startsWith('F:') || spriteUrl.startsWith('/F:')) {
      return spriteUrl;
    }
    
    // Если путь относительный (начинается с /), добавляем базовый URL
    if (spriteUrl.startsWith('/')) {
      // Используем путь из конфигурации, или конструируем из window.location
      const baseUrl = window.location.origin;
      return `${baseUrl}${spriteUrl}`;
    }
    
    // Если это полностью относительный путь, просто добавляем /
    return `/${spriteUrl}`;
  };
  
  // Обработчик ошибок загрузки изображений
  const handleImageError = (characterId: string, spriteUrl: string) => {
    console.error(`Ошибка загрузки изображения персонажа: ${spriteUrl}`);
    setImageErrors(prev => ({ ...prev, [characterId]: true }));
  };
  
  return (
    <div className="characters-container">
      {characters.map((character) => {
        const positionClass = character.position ? `character-${character.position}` : 'character-center';
        const animationClass = fadeIn ? 'character-fade-in' : '';
        const isActive = character.id === activeSpeakerSpriteId;
        const imageUrl = getImageUrl(character.spriteUrl);
        
        return (
          <div 
            key={character.id}
            className={`character-display ${positionClass} ${animationClass} ${isActive ? 'character-active' : 'character-inactive'}`}
          >
            {!imageErrors[character.id] ? (
              <img 
                src={imageUrl} 
                alt={character.name} 
                className="character-image" 
                onError={() => handleImageError(character.id, character.spriteUrl)}
              />
            ) : (
              <div className="character-placeholder">
                {character.name || 'Персонаж'}
              </div>
            )}
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
