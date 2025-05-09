import React, { useState, useEffect } from 'react';

interface VisualNovelProps {
  initialSceneId?: string;
  playerId?: string;
  initialQuestState?: any;
  initialPlayerStats?: any;
  onExit?: (finalQuestState?: any, finalPlayerStats?: any) => void;
}

/**
 * Компонент визуальной новеллы для отображения интерактивных сцен
 */
export const VisualNovel: React.FC<VisualNovelProps> = ({
  initialSceneId = 'default_scene',
  playerId,
  initialQuestState,
  initialPlayerStats,
  onExit
}) => {
  const [currentScene, setCurrentScene] = useState<any>(null);
  const [currentBackground, setCurrentBackground] = useState<string>('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [dialogText, setDialogText] = useState<string>('');
  const [dialogSpeaker, setDialogSpeaker] = useState<string>('');
  const [choices, setChoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questState, setQuestState] = useState(initialQuestState || {});
  const [playerStats, setPlayerStats] = useState(initialPlayerStats || {});

  // Эффект для загрузки начальной сцены
  useEffect(() => {
    // Имитация загрузки сцены
    setIsLoading(true);
    
    setTimeout(() => {
      const demoScene = {
        id: initialSceneId,
        background: 'city_night.jpg',
        characters: [
          { id: 'character1', name: 'Инфо-торговец', image: 'trader.png', position: 'left' }
        ],
        dialog: {
          speaker: 'Инфо-торговец',
          text: 'Добро пожаловать в мой район. У меня есть информация о проекте "Грань", но она будет стоить тебе.',
        },
        choices: [
          { 
            id: 'pay', 
            text: 'Заплатить 200 кредитов', 
            nextSceneId: 'paid_info',
            condition: { stat: 'credits', min: 200 },
            effects: [{ type: 'modify_stat', stat: 'credits', value: -200 }]
          },
          { 
            id: 'persuade', 
            text: 'Убедить снизить цену [Харизма]', 
            nextSceneId: 'discount_info',
            condition: { stat: 'charisma', min: 7 }
          },
          { 
            id: 'threaten', 
            text: 'Угрожать [Сила]', 
            nextSceneId: 'reluctant_info',
            condition: { stat: 'strength', min: 8 }
          },
          { 
            id: 'leave', 
            text: 'Уйти', 
            nextSceneId: 'exit' 
          }
        ]
      };
      
      setCurrentScene(demoScene);
      setCurrentBackground(demoScene.background);
      setCharacters(demoScene.characters);
      setDialogSpeaker(demoScene.dialog.speaker);
      setDialogText(demoScene.dialog.text);
      setChoices(demoScene.choices.filter(choice => {
        // Проверка условий выбора
        if (!choice.condition) return true;
        
        if (choice.condition.stat && choice.condition.min) {
          const statValue = playerStats[choice.condition.stat] || 0;
          return statValue >= choice.condition.min;
        }
        
        return true;
      }));
      
      setIsLoading(false);
    }, 1000);
  }, [initialSceneId, playerStats]);

  // Обработчик выбора игрока
  const handleChoice = (choice: any) => {
    // Обработка эффектов выбора
    if (choice.effects) {
      const newPlayerStats = { ...playerStats };
      
      choice.effects.forEach((effect: any) => {
        if (effect.type === 'modify_stat' && effect.stat) {
          newPlayerStats[effect.stat] = (newPlayerStats[effect.stat] || 0) + effect.value;
        }
      });
      
      setPlayerStats(newPlayerStats);
    }
    
    // Переход к следующей сцене или выход
    if (choice.nextSceneId === 'exit') {
      if (onExit) {
        onExit(questState, playerStats);
      }
    } else {
      setIsLoading(true);
      // Здесь был бы код загрузки следующей сцены по ID
      // Для демо просто имитируем переход задержкой
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
        <div className="text-xl">Загрузка сцены...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Фон сцены */}
      <div 
        className="absolute inset-0 bg-center bg-cover z-0" 
        style={{ 
          backgroundImage: `url(/backgrounds/${currentBackground})`,
          backgroundSize: 'cover',
          filter: 'brightness(0.8)'
        }}
      >
        {/* Заглушка для отсутствующего фона (в демо) */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 to-black/90"></div>
      </div>
      
      {/* Персонажи */}
      <div className="absolute inset-0 z-10 flex items-end">
        {characters.map(character => (
          <div 
            key={character.id}
            className={`h-4/5 flex items-end justify-center ${
              character.position === 'left' ? 'ml-8' : 
              character.position === 'right' ? 'ml-auto mr-8' : 'mx-auto'
            }`}
          >
            {/* Заглушка для отсутствующего изображения персонажа (в демо) */}
            <div className="w-64 h-96 bg-surface-variant/30 rounded-lg backdrop-blur-sm flex items-center justify-center text-6xl">
              {character.name.charAt(0)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Диалоговое окно */}
      <div className="mt-auto relative z-20 w-full p-4">
        <div className="bg-surface/80 backdrop-blur-sm rounded-lg border border-surface-variant shadow-lg p-4 max-w-3xl mx-auto">
          {dialogSpeaker && (
            <div className="text-accent font-heading text-lg mb-2">
              {dialogSpeaker}
            </div>
          )}
          <div className="text-text-primary text-lg leading-relaxed whitespace-pre-wrap">
            {dialogText}
          </div>
          
          {/* Варианты выбора */}
          {choices.length > 0 && (
            <div className="mt-4 space-y-2">
              {choices.map(choice => (
                <button
                  key={choice.id}
                  className="w-full text-left px-4 py-2 bg-surface-variant hover:bg-accent/10 rounded transition-colors duration-200"
                  onClick={() => handleChoice(choice)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 