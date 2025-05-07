import { useUnit } from 'effector-react';
import { useState, useCallback, useEffect } from 'react';
import { $currentScene, setCurrentScene, setSceneLoading, $sceneLoading } from '../../entities/scene/model';
import { Scene, DialogueLine, ActionObject } from '../../shared/types/visualNovel';
import { QR_CODES } from '../../shared/types/markers';
import { convexClient } from '../../shared/utils/convex';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';

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
    backgroundUrl: '/backgrounds/trader_camp.png',
    musicTrack: '/audio/ambient_market.mp3',
    charactersInScene: [
      { id: 'trader', name: 'Торговец', spriteUrl: '/sprites/trader.png' }
    ],
    dialogueLines: [
      {
        text: 'Я собрал все запчасти для Дитера. Вы как раз вовремя.',
        characterSpriteId: 'trader',
        speakerName: 'Торговец'
      },
      {
        text: 'Вот пакет. Отнесите его Дитеру, он уже заждался.',
        characterSpriteId: 'trader',
        speakerName: 'Торговец'
      }
    ],
    choices: [
      { 
        id: 'choice_0', 
        text: 'Взять запчасти и отправиться к Дитеру', 
        nextSceneId: 'craftsman_meeting',
        action: {
          type: 'UPDATE_QUEST_STATE',
          payload: { questId: 'delivery', state: 'parts_taken' }
        }
      }
    ],
    onEnterScript: {
      type: 'UPDATE_STATS',
      params: { stats: { energy: -5 } }
    }
  },
  craftsman_meeting: {
    id: 'craftsman_meeting',
    title: 'Встреча с мастеровым',
    backgroundUrl: '/backgrounds/workshop.jpg',
    musicTrack: '/audio/workshop_ambience.mp3',
    charactersInScene: [
      { id: 'craftsman', name: 'Дитер', spriteUrl: '/sprites/craftsman.png' }
    ],
    dialogueLines: [
      {
        text: 'А, вот и вы! Наконец-то мои запчасти!',
        characterSpriteId: 'craftsman',
        speakerName: 'Дитер'
      },
      {
        text: 'Спасибо, что доставили их. Это очень важно для моей работы.',
        characterSpriteId: 'craftsman',
        speakerName: 'Дитер'
      },
      {
        text: 'Кстати, не хотите заработать ещё немного? У меня есть для вас дополнительное задание...',
        characterSpriteId: 'craftsman',
        speakerName: 'Дитер'
      }
    ],
    choices: [
      { 
        id: 'choice_1', 
        text: 'Расскажите подробнее', 
        nextSceneId: 'additional_task'
      },
      {
        id: 'choice_2',
        text: 'Нет, спасибо, может в другой раз',
        action: {
          type: 'EXIT_VN',
          payload: {}
        }
      }
    ]
  },
  // ... другие тестовые сцены
};

export function useSceneLoader(initialSceneId: string) {
  const [currentSceneId, setCurrentSceneId] = useState<string>(initialSceneId);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyLoaded, setAlreadyLoaded] = useState<Record<string, boolean>>({});

  // Используем query вместо mutation для получения сцены по ключу
  const getSceneByKey = useQuery(api.quest.getSceneByKey, 
    currentSceneId ? { sceneKey: currentSceneId } : "skip");

  // Загружаем сцену при изменении ID
  useEffect(() => {
    const fetchScene = async () => {
      if (!currentSceneId) {
        setLoading(false);
        setError('Не указан ID сцены');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Проверяем, не загружаем ли мы ту же сцену повторно
        if (alreadyLoaded[currentSceneId] && currentScene && currentScene.id === currentSceneId) {
          console.log(`Сцена уже загружена: ${currentSceneId}`);
          setLoading(false);
          return;
        }

        // Получаем сцену из Convex
        if (getSceneByKey) {
          const sceneData = getSceneByKey as ConvexScene;
          
          if (!sceneData) {
            throw new Error(`Сцена с ключом ${currentSceneId} не найдена`);
          }

          // Логирование для отладки
          console.log(`Загружена сцена: ${sceneData.title || 'Без названия'} (ID: ${currentSceneId})`);
          console.log('Фон сцены:', sceneData.background);
          
          // Преобразуем данные сцены из API в формат, ожидаемый компонентом
          const adaptedScene: Scene = {
            id: currentSceneId,
            title: sceneData.title || 'Без названия',
            backgroundUrl: sceneData.background || '',
            musicTrack: sceneData.music || '',
            dialogueLines: [{
              text: sceneData.text || '',
              characterSpriteId: sceneData.character?.name || '',
              speakerName: sceneData.character?.name || ''
            }],
            charactersInScene: sceneData.character ? [{
              id: 'character_1',
              name: sceneData.character.name,
              spriteUrl: sceneData.character.image,
              position: sceneData.character.position
            }] : [],
            choices: (sceneData.choices || []).map(choice => ({
              id: `choice_${Math.random().toString(36).substr(2, 9)}`,
              text: choice.text,
              nextSceneId: choice.nextSceneId ? String(choice.nextSceneId) : undefined,
              action: choice.action ? {
                type: choice.action,
                payload: {}
              } as ActionObject : undefined
            })),
            action: undefined // Convex API не возвращает поле action
          };
          
          // Добавляем ID в список уже загруженных сцен
          setAlreadyLoaded(prev => ({...prev, [currentSceneId]: true}));
          
          // Устанавливаем сцену
          setCurrentScene(adaptedScene);
        } else {
          // Используем тестовую сцену, если API запрос еще не выполнен
          const testScene = TEST_SCENES[currentSceneId];
          if (testScene) {
            setCurrentScene(testScene);
            setAlreadyLoaded(prev => ({...prev, [currentSceneId]: true}));
          } else {
            // Если нет тестовой сцены, создаем моковую
            const mockScene: Scene = {
              id: currentSceneId,
              title: 'Демо-сцена',
              backgroundUrl: '/backgrounds/trader_camp.png',
              musicTrack: '',
              dialogueLines: [{
                text: `Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары. Завидев вас, он поднимает взгляд.\n\n«А, ты за запчастями от Дитера? Вот, забирай, всё здесь. Только береги, их трудно добыть. И передай Дитеру, что в следующий раз пусть платит больше, или товар пойдёт в другие руки.»`,
                characterSpriteId: '',
                speakerName: 'Торговец'
              }],
              charactersInScene: [],
              choices: [
                {
                  id: 'take_parts',
                  text: 'Взять запчасти и отправиться к Дитеру',
                  action: {
                    type: 'TAKE_PARTS',
                    payload: {}
                  }
                }
              ]
            };
            
            setCurrentScene(mockScene);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки сцены:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке сцены');
      } finally {
        setLoading(false);
      }
    };

    fetchScene();
  }, [currentSceneId, getSceneByKey]);

  return {
    currentScene,
    loading,
    error,
    setCurrentSceneId
  };
}

 