import { useUnit } from 'effector-react';
import { useState, useCallback, useEffect } from 'react';
import { $currentScene, setCurrentScene, setSceneLoading, $sceneLoading } from '../../entities/scene/model';
import { Scene, DialogueLine } from '../../shared/types/visualNovel';
import { QR_CODES } from '../../entities/markers/model';
import { convexClient } from '../../shared/utils/convex';
import { api } from '../../../convex/_generated/api';

// Маппинг QR-кодов и Convex ID на sceneId
const QR_SCENE_MAPPING: Record<string, string> = {
  [QR_CODES.TRADER]: 'trader_meeting',
  [QR_CODES.CRAFTSMAN]: 'craftsman_meeting',
  [QR_CODES.ARTIFACT]: 'artifact_found',
  [QR_CODES.ANOMALY_ZONE]: 'artifact_hunt_start',
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
    backgroundUrl: '/backgrounds/trader_camp.jpg',
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

export function useSceneLoader(initialSceneId?: string) {
  const currentScene = useUnit($currentScene);
  const isLoading = useUnit($sceneLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | undefined>(initialSceneId);

  // Универсальный загрузчик сцен
  const loadScene = useCallback(async (sceneId: string) => {
    setSceneLoading(true);
    setError(null);
    try {
      let finalSceneId = sceneId;
      // Маппинг QR-кодов
      if (QR_SCENE_MAPPING[sceneId]) {
        finalSceneId = QR_SCENE_MAPPING[sceneId];
      }
      // Маппинг Convex ID
      if (CONVEX_ID_MAPPING[sceneId]) {
        finalSceneId = CONVEX_ID_MAPPING[sceneId];
      }
      // Попытка загрузить из Convex API
      let apiScene = null;
      try {
        apiScene = await convexClient.query(api.quest.getSceneByKey, { sceneKey: finalSceneId });
      } catch (e) {
        // ignore, fallback ниже
      }
      if (apiScene) {
        const mappedScene: Scene = {
          id: apiScene.sceneKey || String(apiScene._id),
          title: apiScene.title,
          backgroundUrl: apiScene.background,
          musicTrack: apiScene.music,
          dialogueLines: apiScene.dialogueLines || [{ 
            text: apiScene.text, 
            speakerName: apiScene.speakerName 
          }],
          charactersInScene: apiScene.characters?.map((c: any) => ({
            id: c.id || c.characterId,
            name: c.name,
            spriteUrl: c.spriteUrl
          })) || [],
          choices: apiScene.choices.map((c: any, idx: number) => ({
            id: c.id || `choice_${idx}`,
            text: c.text,
            nextSceneId: c.nextSceneId,
            statChanges: c.statChanges,
            action: c.action,
            requiredStats: c.requiredStats,
          })),
          onEnterScript: apiScene.onEnterScript,
          onExitScript: apiScene.onExitScript,
          action: apiScene.action
        };
        setCurrentScene(mappedScene);
        return;
      }
      // Fallback: локальные тестовые сцены
      const scene = TEST_SCENES[finalSceneId];
      if (scene) {
        setCurrentScene(scene);
      } else {
        setError('Сцена не найдена');
      }
    } catch (e) {
      setError('Ошибка загрузки сцены');
    } finally {
      setSceneLoading(false);
    }
  }, []);

  // Автоматическая загрузка при изменении currentSceneId
  useEffect(() => {
    if (currentSceneId) {
      loadScene(currentSceneId);
    }
  }, [currentSceneId, loadScene]);

  return { 
    currentScene, 
    loading: isLoading, 
    error, 
    loadScene,
    setCurrentSceneId
  };
}

 