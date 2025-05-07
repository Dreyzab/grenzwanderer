import React from 'react';
import styles from './ItemInfoCard.module.css';
import { useInventory, InventoryItemWithDetails } from '../../../../features/player/api/useInventory';
import { Id } from '../../../../../convex/_generated/dataModel';

interface ItemInfoCardProps {
  itemId: string;
  onUse: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  onEquip: (itemId: string, slotId: string) => void;
}

export const ItemInfoCard: React.FC<ItemInfoCardProps> = ({
  itemId,
  onUse,
  onDrop,
  onEquip
}) => {
  const { inventoryItems, loading, error } = useInventory();
  
  // Находим выбранный предмет в инвентаре
  const item = inventoryItems.find(item => item._id === itemId);
  
  if (loading) {
    return (
      <div className={styles.loading}>
        Загрузка информации о предмете...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.error}>
        Ошибка: {error}
      </div>
    );
  }
  
  if (!item) {
    return (
      <div className={styles.notFound}>
        Предмет не найден
      </div>
    );
  }
  
  // Функция для определения цвета редкости
  const getRarityColor = (rarity: string | undefined): string => {
    if (!rarity) return '#b0b0b0'; // default gray
    
    const rarityColors: Record<string, string> = {
      'common': '#b0b0b0',
      'uncommon': '#2ecc71',
      'rare': '#3498db',
      'epic': '#9b59b6',
      'legendary': '#f39c12'
    };
    return rarityColors[rarity] || '#b0b0b0';
  };
  
  // Функция для получения текстового представления редкости
  const getRarityText = (rarity: string | undefined): string => {
    if (!rarity) return 'Обычный';
    
    const rarityTexts: Record<string, string> = {
      'common': 'Обычный',
      'uncommon': 'Необычный',
      'rare': 'Редкий',
      'epic': 'Эпический',
      'legendary': 'Легендарный'
    };
    return rarityTexts[rarity] || 'Обычный';
  };
  
  // Функция для получения текстового представления типа
  const getTypeText = (type: string | undefined): string => {
    if (!type) return 'Предмет';
    
    const typeTexts: Record<string, string> = {
      'weapon': 'Оружие',
      'armor': 'Броня',
      'consumable': 'Расходник',
      'quest': 'Квестовый',
      'misc': 'Разное'
    };
    return typeTexts[type] || 'Предмет';
  };
  
  // Получаем информацию о предмете
  const details = item.details;
  
  // Определяем доступные слоты для экипировки
  const getEquipSlots = (type: string | undefined): string[] => {
    if (!type) return [];
    
    switch (type) {
      case 'weapon': return ['primary'];
      case 'armor': return ['body'];
      case 'consumable': return [];
      case 'quest': return [];
      case 'misc': return [];
      default: return [];
    }
  };
  
  const equipSlots = details ? getEquipSlots(details.type) : [];
  const canEquip = equipSlots.length > 0;
  const canUse = details?.type === 'consumable';

  return (
    <div className={styles.itemInfoCard}>
      <div 
        className={styles.itemHeader} 
        style={{ borderColor: getRarityColor(details?.rarity) }}
      >
        <div className={styles.itemImage}>
          <img src={details?.image || '/assets/items/placeholder.png'} alt={details?.name || 'Предмет'} />
        </div>
        <div className={styles.itemTitleInfo}>
          <h3 className={styles.itemName}>{details?.name || 'Неизвестный предмет'}</h3>
          <div className={styles.itemMeta}>
            <span 
              className={styles.itemRarity} 
              style={{ color: getRarityColor(details?.rarity) }}
            >
              {getRarityText(details?.rarity)}
            </span>
            <span className={styles.itemType}>{getTypeText(details?.type)}</span>
          </div>
          <div className={styles.quantityInfo}>
            <span className={styles.quantity}>Количество: {item.quantity}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.itemDescription}>
        <p>{details?.description || 'Нет описания'}</p>
      </div>
      
      {details?.effects && (
        <div className={styles.itemStats}>
          <h4>Характеристики:</h4>
          <ul className={styles.statsList}>
            {Object.entries(details.effects).map(([key, value]) => (
              <li key={key} className={styles.statItem}>
                <span className={styles.statLabel}>{key}:</span>
                <span className={styles.statValue}>{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.itemActions}>
        {canEquip && (
          <div className={styles.equipSection}>
            <h4>Экипировать:</h4>
            <div className={styles.slotButtons}>
              {equipSlots.map(slot => (
                <button 
                  key={slot}
                  className={styles.slotButton}
                  onClick={() => onEquip(itemId, slot)}
                >
                  {slot === 'primary' ? 'Основное оружие' : 
                   slot === 'secondary' ? 'Второстепенное оружие' : 
                   slot === 'head' ? 'Голова' : 
                   slot === 'body' ? 'Тело' : 
                   slot === 'accessory' ? 'Аксессуар' : slot}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.actionButtons}>
          {canUse && (
            <button 
              className={`${styles.actionButton} ${styles.useButton}`}
              onClick={() => onUse(itemId)}
            >
              Использовать
            </button>
          )}
          
          <button 
            className={`${styles.actionButton} ${styles.dropButton}`}
            onClick={() => onDrop(itemId)}
          >
            Выбросить
          </button>
        </div>
      </div>
    </div>
  );
}; 