import React from 'react';
import { DialogChoiceProps } from '../../shared/types/gameScreen';
import './DialogChoice.css';

export const DialogChoice: React.FC<DialogChoiceProps> = ({ text, onClick }) => {
  return (
    <button className="choice-button" onClick={onClick}>
      {text}
    </button>
  );
};