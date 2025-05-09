import { useState, useEffect, useCallback } from 'react';
import { GameView } from '@/shared/types/gameScreen';
import { usePlayer, PlayerData } from '@/features/player/api/usePlayer';
import { useQuestActions, QuestActionsResult } from '@/features/quest/api/useQuestActions';
import { QuestStateEnum } from '@/shared/constants/quest';
import { $questState, questStateChanged } from '@/features/quest/model';
import { useUnit } from 'effector-react';

export interface UseGamePageReturn {
  player: PlayerData | null;
  playerLoading: boolean;
  playerError: string | null;
  activeTab: GameView; // Теперь это GameView
  currentQuestState: QuestStateEnum;
  currentSceneIdForNovel: string | null; // Для передачи в GameScreen
  questActions: QuestActionsResult;
  handleTabChange: (tab: GameView) => void;
  openNovelWithScene: (sceneId: string) => void;
}

export function useGamePage(): UseGamePageReturn {
  const { player, loading: playerLoading, error: playerError } = usePlayer();
  const [activeTab, setActiveTab] = useState<GameView>(GameView.MAP);
  const [currentSceneIdForNovel, setCurrentSceneIdForNovel] = useState<string | null>(null);

  // Используем Effector store для состояния квеста
  const currentQuestState = useUnit($questState);

  const handleQuestStateChange = useCallback((newState: QuestStateEnum) => {
    console.log(`useGamePage: Состояние квеста изменилось на: ${newState}`);
    questStateChanged(newState); // Обновляем Effector store
  }, []);

  const handleStepComplete = useCallback((stepId: string) => {
    console.log(`useGamePage: Шаг квеста выполнен: ${stepId}`);
    // Здесь можно добавить логику для $completedSteps, если нужно
  }, []);

  const openNovelWithScene = useCallback((sceneId: string) => {
    console.log(`useGamePage: Открываем новеллу с sceneId: ${sceneId}`);
    setCurrentSceneIdForNovel(sceneId);
    setActiveTab(GameView.NOVEL);
  }, []);

  const questActions = useQuestActions(
    player,
    handleQuestStateChange,
    handleStepComplete,
    openNovelWithScene // Передаем функцию для открытия новеллы
  );

  const handleTabChange = (tab: GameView) => {
    console.log(`useGamePage: Вкладка изменена на ${tab}`);
    setActiveTab(tab);
    if (tab !== GameView.NOVEL) {
      setCurrentSceneIdForNovel(null); // Сбрасываем ID сцены, если уходим из новеллы
    }
  };

  // Пример: Если состояние квеста меняется на такое, где должна быть новелла,
  // можно автоматически открыть ее, если есть sceneId от QR или другого действия.
  // Это сложная логика, которую нужно тщательно продумать.
  // useEffect(() => {
  // if (currentQuestState === QuestStateEnum.DELIVERY_STARTED && !currentSceneIdForNovel) {
  // Здесь может быть логика, инициирующая показ первой сцены квеста,
  // например, через вызов какого-то действия, которое в итоге вызовет openNovelWithScene
  // }
  // }, [currentQuestState, currentSceneIdForNovel, openNovelWithScene]);

  return {
    player,
    playerLoading,
    playerError,
    activeTab,
    currentQuestState,
    currentSceneIdForNovel,
    questActions,
    handleTabChange,
    openNovelWithScene,
  };
} 