// src/widgets/dialogText/DialogText.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DialogLine } from '../../shared/types/visualNovel';
import { dialogueLineDisplayed } from '../../entities/scene/model';

interface DialogTextProps {
  line: DialogLine;
  onNext: () => void;
  textSpeed?: number; // ms per character
  autoScroll?: boolean;
  instantText?: boolean;
}

export const DialogText: React.FC<DialogTextProps> = ({
  line,
  onNext,
  textSpeed = 30,
  autoScroll = true,
  instantText = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAll, setShowAll] = useState(instantText);
  const textRef = useRef<HTMLDivElement>(null);
  const [recordedInHistory, setRecordedInHistory] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lineTextRef = useRef<string>('');
  
  // Мемоизированная функция для запуска typewriter эффекта
  const startTypewriterEffect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (showAll || !line) {
      setDisplayedText(line?.text || '');
      setIsTyping(false);
      return;
    }
    
    const text = line.text;
    lineTextRef.current = text; // Сохраняем текущий текст в реф
    let index = 0;
    
    setIsTyping(true);
    intervalRef.current = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.substring(0, index));
        index++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsTyping(false);
      }
    }, textSpeed);
  }, [line?.text, showAll, textSpeed]);
  
  // Reset state when line changes
  useEffect(() => {
    if (!line) return;
    
    // Проверяем, изменилась ли строка по сравнению с предыдущей
    if (lineTextRef.current !== line.text) {
      console.log("Новая строка диалога:", line.text);
      setDisplayedText('');
      setIsTyping(true);
      setShowAll(instantText);
      setRecordedInHistory(false);
      
      // Запускаем эффект печати
      startTypewriterEffect();
    }
    
    // Очистка интервала при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [line?.text, instantText, startTypewriterEffect]);
  
  // Записываем строку диалога в историю когда она полностью отображена
  useEffect(() => {
    if (!isTyping && line && !recordedInHistory) {
      // Записываем строку только один раз после завершения печати
      dialogueLineDisplayed({
        text: line.text,
        speakerName: line.characterId // Передаем ID персонажа вместо имени
      });
      setRecordedInHistory(true);
    }
  }, [isTyping, line, recordedInHistory]);
  
  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (autoScroll && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [displayedText, autoScroll]);
  
  // Handle click to show all text immediately or advance to next
  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    
    if (isTyping) {
      // Останавливаем интервал
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowAll(true);
      setDisplayedText(line?.text || '');
      setIsTyping(false);
    } else {
      onNext();
    }
  };
  
  // Обработчик клика по подсказке "Нажмите, чтобы продолжить..."
  const handleContinueClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    if (!isTyping) {
      onNext();
    }
  };
  
  // Обработчик клика по контейнеру диалога
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isTyping) {
      onNext();
    } else {
      // Останавливаем интервал
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setShowAll(true);
      setDisplayedText(line?.text || '');
      setIsTyping(false);
    }
  };
  
  if (!line) return null;
  
  return (
    <div 
      className="w-full bg-surface/80 backdrop-blur-sm rounded-lg border border-surface-variant shadow-lg p-4 relative" 
      onClick={handleContainerClick}
    >
      {line.characterId && (
        <div className="text-accent font-heading text-lg mb-2 px-2">
          {line.characterId}
        </div>
      )}
      
      <div 
        ref={textRef}
        className="text-text-primary text-lg leading-relaxed max-h-48 overflow-y-auto p-2 whitespace-pre-wrap"
        onClick={handleTextClick}
      >
        {displayedText}
        {isTyping && <span className="inline-block w-3 h-5 bg-text-primary ml-1 animate-blink align-middle">_</span>}
      </div>
      
      {!isTyping && (
        <div 
          className="absolute bottom-2 right-4 text-text-secondary text-sm animate-bounce cursor-pointer"
          onClick={handleContinueClick}
        >
          Нажмите, чтобы продолжить...
        </div>
      )}
    </div>
  );
};

