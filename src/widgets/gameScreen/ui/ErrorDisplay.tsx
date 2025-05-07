import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
  onRetry: () => void;
  buttonText?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  buttonText = 'Вернуться на карту'
}) => {
  if (!message) return null;
  
  return (
    <div className="game-screen-error">
      <p>{message}</p>
      <button onClick={onRetry}>{buttonText}</button>
    </div>
  );
}; 