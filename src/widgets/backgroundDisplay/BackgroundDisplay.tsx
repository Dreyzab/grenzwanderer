import React, { useEffect, useState } from 'react';
import './BackgroundDisplay.css';

interface BackgroundDisplayProps {
  imageUrl?: string;
  transitionDuration?: number;
}

export const BackgroundDisplay: React.FC<BackgroundDisplayProps> = ({
  imageUrl,
  transitionDuration = 800
}) => {
  const [currentBackground, setCurrentBackground] = useState<string | undefined>(imageUrl);
  const [previousBackground, setPreviousBackground] = useState<string | undefined>(undefined);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (imageUrl !== currentBackground) {
      setPreviousBackground(currentBackground);
      setCurrentBackground(imageUrl);
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousBackground(undefined);
      }, transitionDuration);
      
      return () => clearTimeout(timer);
    }
  }, [imageUrl, currentBackground, transitionDuration]);

  // Стандартный фон (может быть градиент), если URL не предоставлен
  const defaultStyle = {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
  };

  return (
    <div className="background-display">
      {previousBackground && isTransitioning && (
        <div 
          className="background-layer fading-out" 
          style={{ 
            backgroundImage: `url(${previousBackground})`,
            transition: `opacity ${transitionDuration}ms ease-out`
          }}
        />
      )}
      
      {currentBackground ? (
        <div 
          className={`background-layer ${isTransitioning ? 'fading-in' : ''}`}
          style={{ 
            backgroundImage: `url(${currentBackground})`,
            transition: `opacity ${transitionDuration}ms ease-in`
          }}
        />
      ) : (
        <div className="background-layer default-background" style={defaultStyle} />
      )}
    </div>
  );
}; 