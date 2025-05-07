import React from 'react';
import styles from './CharacterStatsPage.module.css';
import { CharacterSheet } from '../../../widgets/CharacterSheet';

const CharacterStatsPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <CharacterSheet />
    </div>
  );
};

export default CharacterStatsPage; 