import React, { useState } from 'react';
import { getCharacterImageUrl } from '../lib/getCharacterImageUrl';
import clsx from 'clsx';

interface CharacterImageProps {
  spriteUrl: string;
  name: string;
  isActive?: boolean;
  className?: string;
}

export const CharacterImage: React.FC<CharacterImageProps> = ({ 
  spriteUrl, 
  name, 
  isActive = false,
  className = '' 
}) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getCharacterImageUrl(spriteUrl);
  
  const handleError = () => {
    console.error(`Ошибка загрузки изображения персонажа: ${spriteUrl}`);
    setHasError(true);
  };
  
  const baseClasses = 'transition-all duration-500';
  const activeClasses = isActive 
    ? 'opacity-100 scale-105 z-[2]' 
    : 'opacity-70 brightness-[0.7]';
  
  return (
    <>
      {!hasError ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className={clsx(
            'max-h-[80vh]',
            'max-w-full',
            'object-contain',
            baseClasses,
            activeClasses,
            className
          )}
          onError={handleError}
        />
      ) : (
        <div className={clsx(
          'w-[250px]', 
          'h-[400px]', 
          'bg-surface/50',
          'border-2 border-text-secondary/50',
          'rounded-lg',
          'flex justify-center items-center',
          'text-text-primary',
          'text-lg',
          'text-center',
          'p-[20px]',
          baseClasses,
          activeClasses,
          className
        )}>
          {name || 'Персонаж'}
        </div>
      )}
    </>
  );
}; 