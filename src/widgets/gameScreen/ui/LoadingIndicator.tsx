import React from 'react';

interface LoadingIndicatorProps {
  fullScreen?: boolean;
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullScreen = false,
  message = 'Загрузка...'
}) => {
  if (fullScreen) {
    return (
      <div className="game-screen-loading">
        <div className="loading-spinner"></div>
        <p>{message}</p>
      </div>
    );
  }
  
  return (
    <div className="operation-loading">
      <div className="loading-spinner-small"></div>
      <p>{message}</p>
    </div>
  );
}; 