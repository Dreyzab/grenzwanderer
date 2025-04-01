// src/widgets/dialogText/DialogText.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useUnit } from 'effector-react';
import { $currentScene } from '../../entities/scene/model';
import './DialogText.css';

interface DialogTextProps {
  textSpeed?: number; // ms per character
  autoScroll?: boolean;
  instantText?: boolean;
}

export const DialogText: React.FC<DialogTextProps> = ({
  textSpeed = 30,
  autoScroll = true,
  instantText = false
}) => {
  const currentScene = useUnit($currentScene);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAll, setShowAll] = useState(instantText);
  const textRef = useRef<HTMLDivElement>(null);
  
  // Reset state when scene changes
  useEffect(() => {
    if (currentScene) {
      setDisplayedText('');
      setIsTyping(true);
      setShowAll(instantText);
    }
  }, [currentScene, instantText]);
  
  // Handle typewriter effect
  useEffect(() => {
    if (!currentScene || !isTyping) return;
    
    if (showAll) {
      setDisplayedText(currentScene.text);
      setIsTyping(false);
      return;
    }
    
    let index = 0;
    const text = currentScene.text;
    
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
  }, [currentScene, isTyping, showAll, textSpeed]);
  
  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (autoScroll && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [displayedText, autoScroll]);
  
  // Handle click to show all text immediately
  const handleTextClick = () => {
    if (isTyping) {
      setShowAll(true);
    }
  };
  
  if (!currentScene) return null;
  
  return (
    <div className="dialog-container">
      <div 
        ref={textRef}
        className="dialog-text"
        onClick={handleTextClick}
      >
        {displayedText}
        {isTyping && <span className="typing-cursor">_</span>}
      </div>
      
      {currentScene.time && (
        <div className="dialog-time">
          <span>{currentScene.time}</span>
          {currentScene.date && <span> | {currentScene.date}</span>}
        </div>
      )}
      
      {!isTyping && (
        <div className="dialog-continue-hint">
          Click to continue...
        </div>
      )}
    </div>
  );
};

