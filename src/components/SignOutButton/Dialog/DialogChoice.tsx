import React from 'react';
import './DialogChoice.css';

interface DialogChoiceProps {
  text: string;
  onClick: () => void;
}

export const DialogChoice: React.FC<DialogChoiceProps> = ({ text, onClick }) => {
  return (
    <button className="choice-button" onClick={onClick}>
      {text}
    </button>
  );
};