import React, { useState } from 'react';
import './DialogChoice.css';

interface DialogChoiceProps {
  text: string;
  onClick: () => void;
}

export const DialogChoice: React.FC<DialogChoiceProps> = ({ text, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      className={`dialog-choice ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="choice-arrow">➤</div>
      <span className="choice-text">{text}</span>
    </button>
  );
};