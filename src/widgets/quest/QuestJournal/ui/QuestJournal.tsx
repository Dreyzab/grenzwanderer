import { FC } from 'react';
import styles from './QuestJournal.module.css';

export const QuestJournal: FC = () => {
  return (
    <div className={styles.questJournal}>
      <div className={styles.questList}>
        <h3>Задания</h3>
        <p>Список заданий будет отображаться здесь</p>
      </div>
      <div className={styles.questDetails}>
        <h3>Детали задания</h3>
        <p>Выберите задание для просмотра подробностей</p>
      </div>
    </div>
  );
}; 