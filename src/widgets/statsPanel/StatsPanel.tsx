// src/widgets/statsPanel/StatsPanel.tsx
import React from 'react';
import { useUnit } from 'effector-react';
import { $playerStats, $recentStatChanges } from '../../entities/player/model';
import './StatsPanel.css';

interface StatsPanelProps {
  showChanges?: boolean;
  compact?: boolean;
  showTitle?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ 
  showChanges = true,
  compact = false,
  showTitle = true
}) => {
  const playerStats = useUnit($playerStats);
  const recentChanges = useUnit($recentStatChanges);
  
  // Helper function to format stat display
  const formatStat = (stat: string, value: number) => {
    // Check if there's a recent change for this stat
    const change = recentChanges.find(c => c.stat === stat);
    const hasChange = change && change.value !== 0;
    
    // Determine CSS class for stat change indication
    const changeClass = hasChange 
      ? change.value > 0 
        ? 'stat-increased'
        : 'stat-decreased'
      : '';
    
    return (
      <div className={`stat-item ${changeClass}`} key={stat}>
        <span className="stat-label">{capitalizeFirstLetter(stat)}:</span>
        <span className="stat-value">
          {value}
          {hasChange && showChanges && (
            <span className="stat-change">
              {change.value > 0 ? '+' : ''}{change.value}
            </span>
          )}
        </span>
      </div>
    );
  };
  
  // Simple utility to make stat names look nicer
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  // Determine which stats to show based on compact mode
  const statsToShow = compact 
    ? ['energy', 'money'] // Only show essential stats in compact mode
    : Object.keys(playerStats);
  
  return (
    <div className={`stats-panel ${compact ? 'stats-panel-compact' : ''}`}>
      {showTitle && <h3 className="stats-title">Player Stats</h3>}
      
      <div className="stats-grid">
        {statsToShow.map(stat => formatStat(stat, playerStats[stat as keyof typeof playerStats]))}
      </div>
    </div>
  );
};

