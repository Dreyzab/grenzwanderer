// src/widgets/dialogText/DialogText.tsx
import React, { useState, useEffect, useRef } from 'react';
import { DialogueLine } from '../../shared/types/visualNovel';
import './DialogText.css';

interface DialogTextProps {
  line: DialogueLine;
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
  
  // Reset state when line changes
  useEffect(() => {
    if (line) {
      setDisplayedText('');
      setIsTyping(true);
      setShowAll(instantText);
    }
  }, [line, instantText]);
  
  // Handle typewriter effect
  useEffect(() => {
    if (!line || !isTyping) return;
    
    if (showAll) {
      setDisplayedText(line.text);
      setIsTyping(false);
      return;
    }
    
    let index = 0;
    const text = line.text;
    
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.substring(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, textSpeed);
    
    return () => clearInterval(interval);
  }, [line, isTyping, showAll, textSpeed]);
  
  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (autoScroll && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [displayedText, autoScroll]);
  
  // Handle click to show all text immediately or advance to next
  const handleTextClick = () => {
    if (isTyping) {
      setShowAll(true);
    } else {
      // Text is fully shown, go to next line/choice
      onNext();
    }
  };
  
  if (!line) return null;
  
  return (
    <div className="dialog-container">
      {line.speakerName && (
        <div className="dialog-speaker">
          {line.speakerName}
        </div>
      )}
      
      <div 
        ref={textRef}
        className="dialog-text"
        onClick={handleTextClick}
      >
        {displayedText}
        {isTyping && <span className="typing-cursor">_</span>}
      </div>
      
      {!isTyping && (
        <div className="dialog-continue-hint">
          Нажмите, чтобы продолжить...
        </div>
      )}
    </div>
  );
};

