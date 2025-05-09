import React, { useState, useEffect } from 'react';

export type CharacterPosition = 'left' | 'center' | 'right';
export type CharacterMood = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | string;

export interface Character {
  id: string;
  name: string;
  image?: string; // Базовое изображение персонажа
  mood?: CharacterMood; // Текущее настроение персонажа
  position: CharacterPosition; // Позиция на экране
  moodImages?: Record<CharacterMood, string>; // Изображения для разных настроений
}

interface CharacterDisplayWidgetProps {
  character: Character;
  isActive: boolean; // Говорит ли персонаж в данный момент
  position: CharacterPosition;
}

/**
 * Виджет для отображения персонажей в сцене визуальной новеллы
 * Поддерживает расположение персонажей, подсветку говорящего и смену эмоций
 */
export const CharacterDisplayWidget: React.FC<CharacterDisplayWidgetProps> = ({
  character,
  isActive,
  position
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | undefined>(undefined);
  
  // Загрузка изображения персонажа
  useEffect(() => {
    // Определяем, какое изображение использовать
    let imageToUse: string | undefined;
    
    if (character.moodImages && character.mood && character.moodImages[character.mood]) {
      // Если есть изображение для конкретного настроения
      imageToUse = character.moodImages[character.mood];
    } else {
      // Иначе используем базовое изображение
      imageToUse = character.image;
    }
    
    setCurrentImage(imageToUse);
    
    // Анимация появления
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [character.id, character.mood, character.image, character.moodImages]);
  
  // Обработка позиции на экране
  const getPositionClass = (position: CharacterPosition): string => {
    switch (position) {
      case 'left': return 'left-10';
      case 'center': return 'left-1/2 -translate-x-1/2';
      case 'right': return 'right-10';
      default: return 'left-1/2 -translate-x-1/2';
    }
  };
  
  // Если нет изображения, персонаж не отображается
  if (!currentImage) {
    return null;
  }
  
  return (
    <div 
      className={`
        absolute bottom-0 transition-all duration-300 ease-in-out
        ${getPositionClass(position)}
        ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-10'}
        ${isActive ? 'scale-105 brightness-100' : 'scale-100 brightness-75'}
      `}
      style={{
        zIndex: isActive ? 30 : 20
      }}
    >
      <img 
        src={currentImage} 
        alt={character.name} 
        className="h-auto max-h-[80vh] w-auto max-w-[30vw] object-contain"
      />
      
      {/* Индикатор говорящего (опциональный) */}
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-accent rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default CharacterDisplayWidget; 