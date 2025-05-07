import { useUnit } from 'effector-react';
import { useState, useCallback, useEffect } from 'react';
import { $currentScene, setCurrentScene, setSceneLoading, $sceneLoading } from '../../entities/scene/model';
import { Scene } from '../../shared/types/visualNovel';
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
    background: '/backgrounds/trader_camp.jpg',
    text: 'Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары...',
    choices: [
      { id: 'choice_0', text: 'Взять запчасти и отправиться к Дитеру', nextSceneId: 'craftsman_meeting' }
    ]
  },
  craftsman_meeting: {
    id: 'craftsman_meeting',
    title: 'Встреча с мастеровым',
    background: '/backgrounds/workshop.jpg',
    text: 'В центральной мастерской города вы находите Дитера...',
    choices: [
      { id: 'choice_0', text: 'Передать запчасти', nextSceneId: 'additional_task' }
    ]
  },
  // ... другие тестовые сцены
};

export function useSceneLoader(initialSceneId?: string) {
  const currentScene = useUnit($currentScene);
  const isLoading = useUnit($sceneLoading);
  const [error, setError] = useState<string | null>(null);

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
          background: apiScene.background,
          text: apiScene.text,
          choices: apiScene.choices.map((c: any, idx: number) => ({
            id: c.id || `choice_${idx}`,
            text: c.text,
            nextSceneId: c.nextSceneId,
            statChanges: c.statChanges,
            action: c.action,
            requiredStats: c.requiredStats,
          })),
          // ...добавьте остальные поля, если нужно
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

  // Автоматическая загрузка initialSceneId
  useEffect(() => {
    if (initialSceneId) {
      loadScene(initialSceneId);
    }
  }, [initialSceneId, loadScene]);

  return { currentScene, loading: isLoading, error, loadScene };
}

 