import React, { useState, useEffect, useRef, useCallback } from 'react';
import { dialogueLineDisplayed } from '../../entities/scene/model';
import { DialogLine } from '../../shared/types/visualNovel';

interface DialogueBoxWidgetProps {
  dialogue: string | DialogLine; // Текст диалога или объект DialogLine
  speakerName?: string; // Имя говорящего персонажа (игнорируется, если передан DialogLine)
  onAdvance?: () => void; // Функция для продвижения диалога
  onExit?: () => void; // Функция для выхода из новеллы
  textSpeed?: number; // Скорость печатания текста (мс на символ)
  autoAdvance?: boolean; // Автоматическое продвижение диалога
  autoAdvanceDelay?: number; // Задержка перед автоматическим продвижением (мс)
  recordHistory?: boolean; // Записывать ли историю диалогов
  characterName?: Record<string, string>; // Словарь ID персонажей -> имена (для получения имени по ID)
}

/**
 * Виджет диалогового окна визуальной новеллы
 * Отображает постепенно появляющийся текст диалога и имя говорящего
 */
export const DialogueBoxWidget: React.FC<DialogueBoxWidgetProps> = ({
  dialogue,
  speakerName,
  onAdvance,
  onExit,
  textSpeed = 30, // По умолчанию 30мс на символ
  autoAdvance = false,
  autoAdvanceDelay = 2000, // По умолчанию 2 секунды
  recordHistory = true,
  characterName = {}
}) => {
  // Состояние для отображаемого текста (для эффекта печатной машинки)
  const [displayedText, setDisplayedText] = useState('');
  // Состояние завершения печати
  const [isTextComplete, setIsTextComplete] = useState(false);
  // Для отслеживания процесса печати
  const textAnimation = useRef<NodeJS.Timeout | null>(null);
  // Для отслеживания автоматического продвижения
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  // Для отслеживания записи в историю
  const [recordedInHistory, setRecordedInHistory] = useState(false);
  
  // Получаем текст и имя говорящего из объекта, если передан DialogLine
  const dialogueText = typeof dialogue === 'string' ? dialogue : dialogue.text;
  
  // Получаем имя говорящего персонажа:
  // 1. Если передан обычный текст, используем speakerName из props
  // 2. Если передан DialogLine с characterId, ищем имя в словаре characterName
  const dialogueSpeaker = typeof dialogue === 'string' 
    ? speakerName 
    : (dialogue.characterId ? characterName[dialogue.characterId] || dialogue.characterId : undefined);
  
  // Мемоизированная функция для запуска typewriter эффекта
  const startTypewriterEffect = useCallback(() => {
    // Очищаем предыдущие таймеры
    if (textAnimation.current) {
      clearInterval(textAnimation.current);
    }
    
    // Сбрасываем состояние
    setDisplayedText('');
    setIsTextComplete(false);
    setRecordedInHistory(false);
    
    // Начинаем новую анимацию печати
    let currentIndex = 0;
    textAnimation.current = setInterval(() => {
      if (currentIndex <= dialogueText.length) {
        setDisplayedText(dialogueText.substring(0, currentIndex));
        currentIndex++;
      } else {
        if (textAnimation.current) {
          clearInterval(textAnimation.current);
          textAnimation.current = null;
          setIsTextComplete(true);
          
          // Записываем в историю диалогов, если нужно
          if (recordHistory && !recordedInHistory) {
            dialogueLineDisplayed({
              text: dialogueText,
              speakerName: dialogueSpeaker
            });
            setRecordedInHistory(true);
          }
          
          // Если включено автоматическое продвижение и есть функция продвижения
          if (autoAdvance && onAdvance) {
            autoAdvanceTimer.current = setTimeout(() => {
              onAdvance();
            }, autoAdvanceDelay);
          }
        }
      }
    }, textSpeed);
  }, [dialogueText, dialogueSpeaker, textSpeed, autoAdvance, autoAdvanceDelay, onAdvance, recordHistory]);
  
  // Эффект для анимации печати текста при изменении диалога
  useEffect(() => {
    startTypewriterEffect();
    
    // Очистка при размонтировании компонента
    return () => {
      if (textAnimation.current) {
        clearInterval(textAnimation.current);
      }
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [dialogue, startTypewriterEffect]);
  
  // Обработчик клика для продвижения диалога
  const handleClick = () => {
    // Если текст еще не полностью напечатан, мгновенно показываем весь текст
    if (!isTextComplete) {
      if (textAnimation.current) {
        clearInterval(textAnimation.current);
        textAnimation.current = null;
      }
      setDisplayedText(dialogueText);
      setIsTextComplete(true);
      
      // Записываем в историю диалогов, если нужно
      if (recordHistory && !recordedInHistory) {
        dialogueLineDisplayed({
          text: dialogueText,
          speakerName: dialogueSpeaker
        });
        setRecordedInHistory(true);
      }
      
      // Сбрасываем таймер автоматического продвижения
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
      
      // Если включено автоматическое продвижение, запускаем таймер
      if (autoAdvance && onAdvance) {
        autoAdvanceTimer.current = setTimeout(() => {
          onAdvance();
        }, autoAdvanceDelay);
      }
    } else if (onAdvance) {
      // Если текст полностью напечатан, продвигаем диалог
      onAdvance();
      
      // Сбрасываем таймер автоматического продвижения
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    }
  };
  
  return (
    <div 
      className="w-full bg-surface/80 backdrop-blur-sm border-t border-surface-variant shadow-lg py-3 px-4 relative"
      onClick={handleClick}
    >
      {/* Кнопка выхода, если предоставлен обработчик */}
      {onExit && (
        <button 
          className="absolute top-2 right-2 text-text-secondary hover:text-accent p-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Предотвращаем всплытие события клика
            onExit();
          }}
          aria-label="Выход"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      )}
      
      {/* Имя говорящего */}
      {dialogueSpeaker && (
        <div className="text-accent font-heading text-lg mb-1.5">{dialogueSpeaker}</div>
      )}
      
      {/* Текст диалога с анимацией */}
      <div className="text-text-primary text-lg leading-relaxed whitespace-pre-wrap min-h-[6rem]">
        {displayedText}
        
        {/* Мигающий курсор в конце, если текст полностью напечатан */}
        {isTextComplete && onAdvance && (
          <span className="inline-block w-3 h-5 bg-text-primary ml-1 animate-blink align-middle"></span>
        )}
      </div>
      
      {/* Индикатор для продолжения */}
      {isTextComplete && onAdvance && (
        <div className="absolute bottom-2 right-3 text-text-secondary text-sm animate-bounce">
          Нажмите, чтобы продолжить
        </div>
      )}
    </div>
  );
};

export default DialogueBoxWidget; 