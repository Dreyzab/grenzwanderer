import React from 'react';

interface BattleCard {
  id: string;
  name: string;
  attack: number;
  defense: number;
  image?: string;
  effects?: string[];
}

interface BattlefieldWidgetProps {
  playerField: BattleCard[];
  opponentField: BattleCard[];
}

/**
 * Виджет игрового поля боя, отображающий выложенные карты игрока и противника
 */
export const BattlefieldWidget: React.FC<BattlefieldWidgetProps> = ({
  playerField,
  opponentField
}) => {
  // Функция для отображения карты
  const renderCard = (card: BattleCard) => (
    <div key={card.id} className="w-20 h-28 bg-surface border border-border-color rounded-md p-1 flex flex-col">
      <div className="text-xs font-bold text-center truncate">{card.name}</div>
      <div className="flex-1 flex items-center justify-center">
        {card.image ? (
          <img src={card.image} alt={card.name} className="max-w-full max-h-full" />
        ) : (
          <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center">
            {card.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-error">{card.attack}</span>
        <span className="text-primary">{card.defense}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Поле противника (перевернутое) */}
      <div className="flex justify-center">
        <div className="flex gap-2 flex-wrap justify-center max-w-md">
          {opponentField.length > 0 ? (
            opponentField.map(card => renderCard(card))
          ) : (
            <div className="text-text-secondary text-sm italic">Поле противника пусто</div>
          )}
        </div>
      </div>
      
      {/* Разделитель полей */}
      <div className="border-t border-dashed border-border-color"></div>
      
      {/* Поле игрока */}
      <div className="flex justify-center">
        <div className="flex gap-2 flex-wrap justify-center max-w-md">
          {playerField.length > 0 ? (
            playerField.map(card => renderCard(card))
          ) : (
            <div className="text-text-secondary text-sm italic">Ваше поле пусто</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattlefieldWidget; 