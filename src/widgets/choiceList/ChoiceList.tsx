// src/widgets/choiceList/ChoiceList.tsx
import React, { useState } from 'react';
import { useStore } from 'effector-react';
import { $playerStats } from '../../entities/player/model';
import { $currentScene } from '../../entities/scene/model';
import { Choice } from '../../schared/types/visualNovel';
import './ChoiceList.css';

interface ChoiceListProps {
  onChoiceSelected: (choice: Choice) => void;
}

export const ChoiceList: React.FC<ChoiceListProps> = ({ onChoiceSelected }) => {
  const currentScene = useStore($currentScene);
  const playerStats = useStore($playerStats);
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);
  
  if (!currentScene || !currentScene.choices.length) return null;
  
  // Check if player meets the stat requirements for a choice
  const isChoiceAvailable = (choice: Choice) => {
    if (!choice.requiredStats) return true;
    
    for (const [stat, requiredValue] of Object.entries(choice.requiredStats)) {
      const playerValue = playerStats[stat as keyof typeof playerStats];
      if (playerValue < requiredValue) return false;
    }
    
    return true;
  };
  
  const handleChoiceClick = (choice: Choice) => {
    if (isChoiceAvailable(choice)) {
      onChoiceSelected(choice);
    }
  };
  
  const handleChoiceHover = (choiceId: string) => {
    setHoveredChoice(choiceId);
  };
  
  const handleChoiceLeave = () => {
    setHoveredChoice(null);
  };
  
  return (
    <div className="choice-list">
      {currentScene.choices.map((choice) => {
        const isAvailable = isChoiceAvailable(choice);
        const isHovered = hoveredChoice === choice.id;
        
        return (
          <div 
            key={choice.id}
            className={`dialog-choice ${!isAvailable ? 'choice-unavailable' : ''} ${isHovered ? 'hovered' : ''}`}
            onClick={() => handleChoiceClick(choice)}
            onMouseEnter={() => handleChoiceHover(choice.id)}
            onMouseLeave={handleChoiceLeave}
          >
            <span className="choice-arrow">►</span>
            <span className="choice-text">{choice.text}</span>
            
            {choice.requiredStats && (
              <div className="choice-requirements">
                {Object.entries(choice.requiredStats).map(([stat, value]) => {
                  const playerValue = playerStats[stat as keyof typeof playerStats];
                  const isMet = playerValue >= value;
                  
                  return (
                    <span 
                      key={stat} 
                      className={`stat-requirement ${isMet ? 'requirement-met' : 'requirement-unmet'}`}
                    >
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// src/widgets/choiceList/ChoiceList.css
