import { FC } from 'react';
import styles from './InventoryDisplay.module.css';

export const InventoryDisplay: FC = () => {
  return (
    <div className={styles.inventoryDisplay}>
      <div className={styles.inventoryGrid}>
        <h3>Инвентарь</h3>
        <div className={styles.itemGrid}>
          {/* Здесь будет отображение ячеек инвентаря */}
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
          <div className={styles.emptySlot}>Пусто</div>
        </div>
      </div>
      <div className={styles.equipmentSlots}>
        <h3>Экипировка</h3>
        <div className={styles.equipmentContainer}>
          <div className={styles.equipSlot}>Голова</div>
          <div className={styles.equipSlot}>Туловище</div>
          <div className={styles.equipSlot}>Руки</div>
          <div className={styles.equipSlot}>Ноги</div>
          <div className={styles.equipSlot}>Аксессуар 1</div>
          <div className={styles.equipSlot}>Аксессуар 2</div>
        </div>
      </div>
      <div className={styles.itemInfo}>
        <h3>Информация о предмете</h3>
        <p>Выберите предмет для просмотра информации</p>
      </div>
    </div>
  );
}; 