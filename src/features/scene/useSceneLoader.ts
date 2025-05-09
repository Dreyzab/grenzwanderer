import { useUnit } from 'effector-react';
import { useState, useCallback, useEffect } from 'react';
import { $currentScene, setCurrentScene, setSceneLoading, $sceneLoading } from '../../entities/scene/model';
import { Scene, DialogLine, CharacterPosition, CharacterEmotion } from '../../shared/types/visualNovel';
import { convex } from '../../shared/utils/convex';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';

// Определяем тип ActionObject локально, так как его нет в импортированных типах
interface ActionObject {
  type: string;
  payload: Record<string, any>;
}

// Расширяем тип сцены из Convex для включения дополнительных полей, которые не описаны в схеме
interface ConvexScene {
  _id: Id<"scenes">;
  _creationTime: number;
  title: string;
  sceneKey: string;
  text: string;
  background?: string;
  music?: string;
  choices: Array<{
    text: string;
    nextSceneId?: Id<"scenes">;
    action?: string;
  }>;
  character?: { 
    position?: "left" | "right" | "center"; 
    name: string; 
    image: string; 
  };
}

// Определяем QR_CODES локально, так как они не экспортируются из marker.ts
const QR_CODES = {
  TRADER: 'TRADER',
  CRAFTSMAN: 'CRAFTSMAN',
  ARTIFACT: 'ARTIFACT',
  ANOMALY: 'ANOMALY',
  ENCOUNTER: 'ENCOUNTER'
};

// Маппинг QR-кодов и Convex ID на sceneId
const QR_SCENE_MAPPING: Record<string, string> = {
  [QR_CODES.TRADER]: 'trader_meeting',
  [QR_CODES.CRAFTSMAN]: 'craftsman_meeting',
  [QR_CODES.ARTIFACT]: 'artifact_found',
  [QR_CODES.ANOMALY]: 'artifact_hunt_start',
  [QR_CODES.ENCOUNTER]: 'ork_encounter',
};
const CONVEX_ID_MAPPING: Record<string, string> = {
  // Пример: 'ks74qv6bqz04312j7qj5bw6xsd7d7cw6': 'trader_meeting',
};

// Локальные тестовые сцены (оставить только для fallback)
const TEST_SCENES: Record<string, Scene> = {
  trader_meeting: {
    id: 'trader_meeting',
    title: 'Встреча с торговцем',
    background: {
      id: 'trader_camp',
      imageUrl: '/backgrounds/trader_camp.png',
      name: 'Лагерь торговца'
    },
    characters: [
      { 
        id: 'trader', 
        position: CharacterPosition.CENTER, 
        emotion: CharacterEmotion.NEUTRAL, 
        active: true 
      }
    ],
    dialog: [
      {
        id: 'line1',
        text: 'Я собрал все запчасти для Дитера. Вы как раз вовремя.',
        characterId: 'trader'
      },
      {
        id: 'line2',
        text: 'Вот пакет. Отнесите его Дитеру, он уже заждался.',
        characterId: 'trader'
      }
    ],
    music: {
      id: 'ambient_market',
      musicUrl: '/audio/ambient_market.mp3',
      name: 'Музыка рынка'
    }
  },
  craftsman_meeting: {
    id: 'craftsman_meeting',
    title: 'Встреча с мастеровым',
    background: {
      id: 'workshop',
      imageUrl: '/backgrounds/workshop.jpg',
      name: 'Мастерская'
    },
    characters: [
      { 
        id: 'craftsman', 
        position: CharacterPosition.CENTER, 
        emotion: CharacterEmotion.NEUTRAL, 
        active: true 
      }
    ],
    dialog: [
      {
        id: 'line1',
        text: 'А, вот и вы! Наконец-то мои запчасти!',
        characterId: 'craftsman'
      },
      {
        id: 'line2',
        text: 'Спасибо, что доставили их. Это очень важно для моей работы.',
        characterId: 'craftsman'
      },
      {
        id: 'line3',
        text: 'Кстати, не хотите заработать ещё немного? У меня есть для вас дополнительное задание...',
        characterId: 'craftsman'
      }
    ],
    music: {
      id: 'workshop_ambience',
      musicUrl: '/audio/workshop_ambience.mp3',
      name: 'Звуки мастерской'
    }
  },
  // ... другие тестовые сцены
};

export function useSceneLoader(initialSceneId: string) {
  const [currentSceneId, setCurrentSceneId] = useState<string>(initialSceneId);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyLoaded, setAlreadyLoaded] = useState<Record<string, boolean>>({});
  const [dataProcessed, setDataProcessed] = useState(false);

  // Используем query вместо mutation для получения сцены по ключу
  const getSceneByKey = useQuery(api.quest.getSceneByKey, 
    currentSceneId ? { sceneKey: currentSceneId } : "skip");

  // Эффект для обработки изменения currentSceneId
  useEffect(() => {
    // Если сменился ID сцены - сбрасываем флаг обработки данных
    console.log("ID сцены изменился на:", currentSceneId);
    setDataProcessed(false);
    setLoading(true);
  }, [currentSceneId]);

  // Эффект для обработки полученных данных
  useEffect(() => {
    // Если данные уже обработаны или отсутствуют - выходим
    if (dataProcessed || !getSceneByKey) {
      return;
    }
    
    const fetchScene = async () => {
      if (!currentSceneId) {
        setLoading(false);
        setError('Не указан ID сцены');
        return;
      }

      try {
        // Проверяем, не загружаем ли мы ту же сцену повторно
        if (alreadyLoaded[currentSceneId] && currentScene && currentScene.id === currentSceneId) {
          console.log(`Сцена уже загружена: ${currentSceneId}`);
          setLoading(false);
          setDataProcessed(true);
          return;
        }

        // Получаем сцену из Convex
        const sceneData = getSceneByKey as ConvexScene;
        
        if (!sceneData) {
          throw new Error(`Сцена с ключом ${currentSceneId} не найдена`);
        }

        // Логирование для отладки
        console.log(`Загружена сцена: ${sceneData.title || 'Без названия'} (ID: ${currentSceneId})`);
        
        // Преобразуем данные сцены из API в формат, ожидаемый компонентом
        const adaptedScene: Scene = {
          id: currentSceneId,
          title: sceneData.title || 'Без названия',
          background: {
            id: sceneData.background || 'default_bg',
            imageUrl: sceneData.background || '',
            name: 'Сцена'
          },
          dialog: [{
            id: 'line1',
            text: sceneData.text || '',
            characterId: sceneData.character?.name
          }],
          characters: sceneData.character ? [{
            id: 'character_1',
            position: convertToCharacterPosition(sceneData.character.position),
            emotion: CharacterEmotion.NEUTRAL,
            active: true
          }] : [],
          music: sceneData.music ? {
            id: 'music_1',
            musicUrl: sceneData.music,
            name: 'Музыка'
          } : undefined
        };
        
        // Добавляем ID в список уже загруженных сцен
        setAlreadyLoaded(prev => ({...prev, [currentSceneId]: true}));
        
        // Устанавливаем сцену
        setCurrentScene(adaptedScene);
        
        // Помечаем данные как обработанные
        setDataProcessed(true);
      } catch (err) {
        console.error('Ошибка загрузки сцены:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке сцены');
      } finally {
        setLoading(false);
      }
    };

    // Если у нас есть данные от API - используем их
    if (getSceneByKey) {
      fetchScene();
    } 
    // Если данных от API нет - используем тестовые данные
    else {
      // Проверяем, не загружаем ли мы ту же сцену повторно
      if (alreadyLoaded[currentSceneId] && currentScene && currentScene.id === currentSceneId) {
        console.log(`Сцена уже загружена: ${currentSceneId}`);
        setLoading(false);
        setDataProcessed(true);
        return;
      }

      // Используем тестовую сцену
      const testScene = TEST_SCENES[currentSceneId];
      if (testScene) {
        console.log(`Загружена тестовая сцена: ${testScene.title} (ID: ${currentSceneId})`);
        setCurrentScene(testScene);
        setAlreadyLoaded(prev => ({...prev, [currentSceneId]: true}));
      } else {
        // Если нет тестовой сцены, создаем моковую
        const mockScene: Scene = {
          id: currentSceneId,
          title: 'Демо-сцена',
          background: {
            id: 'demo_bg',
            imageUrl: '/backgrounds/trader_camp.png',
            name: 'Демо фон'
          },
          characters: [],
          dialog: [{
            id: 'demo_dialog',
            text: 'Это демонстрационная сцена. Фактическое содержимое отсутствует.',
          }]
        };
        
        console.log(`Загружена моковая сцена (ID: ${currentSceneId})`);
        setCurrentScene(mockScene);
        setAlreadyLoaded(prev => ({...prev, [currentSceneId]: true}));
      }
      
      setLoading(false);
      setDataProcessed(true);
    }
  }, [currentSceneId, getSceneByKey, alreadyLoaded, currentScene, dataProcessed]);

  // Вспомогательная функция для конвертации строковых позиций в enum
  const convertToCharacterPosition = (position?: string): CharacterPosition => {
    switch (position) {
      case 'left': 
        return CharacterPosition.LEFT;
      case 'right': 
        return CharacterPosition.RIGHT;
      case 'center': 
      default:
        return CharacterPosition.CENTER;
    }
  };

  return {
    currentScene,
    loading,
    error,
    setCurrentSceneId
  };
}

 