import { useState, useEffect } from 'react';
import { Character } from '@/shared/types/visualNovel';

interface UseCharacterStateProps {
  character: Character;
  isActive?: boolean;
  fadeIn?: boolean;
}

interface UseCharacterStateResult {
  character: Character;
  isActive: boolean;
  positionClass: string;
  animationClass: string;
}

/**
 * Хук для управления состоянием персонажа
 * Обрабатывает позицию, активность и анимации
 */
export const useCharacterState = ({
  character,
  isActive = false,
  fadeIn = true
}: UseCharacterStateProps): UseCharacterStateResult => {
  // Определяем CSS класс для позиционирования
  const positionClass = character.position ? `character-${character.position}` : 'character-center';
  
  // Определяем класс для анимации появления
  const animationClass = fadeIn ? 'character-fade-in' : '';
  
  return {
    character,
    isActive,
    positionClass,
    animationClass
  };
}; 