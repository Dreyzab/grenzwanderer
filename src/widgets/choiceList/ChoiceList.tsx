// src/widgets/choiceList/ChoiceList.tsx
import React, { useState } from 'react';
import { ChoiceOption, PlayerStats } from '../../shared/types/visualNovel';
import './ChoiceList.css';

interface ChoiceListProps {
  choices: ChoiceOption[];
  onChoiceSelected: (choice: ChoiceOption) => void;
  playerStats: PlayerStats;
  questState: Record<string, any>;
}

export const ChoiceList: React.FC<ChoiceListProps> = ({ 
  choices, 
  onChoiceSelected,
  playerStats,
  questState 
}) => {
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);
  
  if (!choices || choices.length === 0) return null;
  
  // Check if player meets the stat requirements for a choice
  const isChoiceAvailable = (choice: ChoiceOption) => {
    if (!choice.requiredStats) return true;
    
    for (const [stat, requiredValue] of Object.entries(choice.requiredStats)) {
      const playerValue = playerStats[stat as keyof PlayerStats];
      if (playerValue < requiredValue) return false;
    }
    
    return true;
  };
  
  const handleChoiceClick = (choice: ChoiceOption) => {
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
      {choices.map((choice) => {
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
                  const playerValue = playerStats[stat as keyof PlayerStats];
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
