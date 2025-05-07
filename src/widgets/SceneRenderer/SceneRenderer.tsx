import React, { useState, useEffect, useCallback } from 'react';
import { useSceneLoader } from '../../features/scene/useSceneLoader';
import { useSceneChoice } from '../../features/scene/useSceneChoice';
import { useSceneStateManager } from '../../features/scene/useSceneStateManager';
import { CharacterDisplay } from '../characterDisplay/CharacterDisplay';
import { DialogText } from '../dialogText/DialogText';
import { ChoiceList } from '../choiceList/ChoiceList';
import { StatsPanel } from '../statsPanel/StatsPanel';
import { BackgroundDisplay } from '../backgroundDisplay/BackgroundDisplay';
import { MusicPlayer } from '../musicPlayer/MusicPlayer';
import { Scene, ChoiceOption } from '../../shared/types/visualNovel';

interface SceneRendererProps {
  initialSceneId: string;
  playerId?: string;
  initialQuestState?: any;
  initialPlayerStats?: any;
  onExit?: (finalQuestState?: any, finalPlayerStats?: any) => void;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  initialSceneId,
  playerId,
  initialQuestState,
  initialPlayerStats,
  onExit,
}) => {
  const {
    currentScene,
    loading,
    error,
    setCurrentSceneId,
  } = useSceneLoader(initialSceneId);

  const sceneStateManager = useSceneStateManager(
    playerId,
    initialQuestState,
    initialPlayerStats
  );

  const { handleChoice } = useSceneChoice({
    setCurrentSceneId,
    sceneStateManager,
    onExit,
  });

  const [currentDialogueLineIndex, setCurrentDialogueLineIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [dialogueCompleted, setDialogueCompleted] = useState(false);

  // Отладочное логирование при изменении состояния
  useEffect(() => {
    console.log("Текущий индекс диалога:", currentDialogueLineIndex);
    console.log("Показывать выборы:", showChoices);
    console.log("Диалог завершен:", dialogueCompleted);
  }, [currentDialogueLineIndex, showChoices, dialogueCompleted]);

  useEffect(() => {
    // Сбрасываем состояние при смене сцены (новый ID)
    console.log("Загружена новая сцена:", currentScene?.title);
    setCurrentDialogueLineIndex(0);
    setShowChoices(false);
    setDialogueCompleted(false);
    
    if (currentScene?.onEnterScript) {
      // TODO: Execute onEnterScript (может менять state через sceneStateManager)
      // Например, sceneStateManager.executeScript(currentScene.onEnterScript);
    }
  }, [currentScene, sceneStateManager]);

  const advanceDialogue = useCallback(() => {
    if (!currentScene) {
      console.warn("Невозможно продвинуть диалог: сцена не загружена");
      return;
    }

    // Если диалог уже завершен, не делаем ничего, чтобы избежать повторного запуска сцены
    if (dialogueCompleted) {
      console.log("Диалог уже завершен, игнорируем нажатие");
      return;
    }

    console.log(`Продвигаем диалог: ${currentDialogueLineIndex} из ${currentScene.dialogueLines.length - 1}`);

    if (currentDialogueLineIndex < currentScene.dialogueLines.length - 1) {
      console.log("Переходим к следующей строке диалога");
      setCurrentDialogueLineIndex((prev) => prev + 1);
    } else {
      // Диалог закончен
      console.log("Все строки диалога показаны, завершаем диалог");
      setDialogueCompleted(true);
      
      if (currentScene.choices && currentScene.choices.length > 0) {
        console.log("Показываем варианты выбора:", currentScene.choices);
        setShowChoices(true);
      } else if (currentScene.action) { // Если нет выборов, но есть авто-действие на сцене
        console.log("Автоматическое действие:", currentScene.action);
        // Создаем временный объект Choice из action
        const tempChoice: ChoiceOption = {
          id: 'auto_action',
          text: 'Auto action',
          action: currentScene.action
        };
        handleChoice(tempChoice);
      } else {
        console.log("Нет выборов и действий, выходим из визуальной новеллы");
        // Конец ВН или ветки без явного выхода/выбора
        if (onExit) onExit(sceneStateManager.getQuestState(), sceneStateManager.getPlayerStats());
      }
    }
  }, [currentScene, currentDialogueLineIndex, handleChoice, onExit, sceneStateManager, dialogueCompleted]);

  if (loading) return <div>Загрузка сцены...</div>;
  if (error) return <div>Ошибка загрузки сцены: {error}</div>;
  if (!currentScene) return <div>Сцена не найдена.</div>;

  const currentLine = currentScene.dialogueLines[currentDialogueLineIndex];
  console.log("Текущая строка диалога:", currentLine);

  return (
    <div className="visual-novel-container">
      <MusicPlayer trackUrl={currentScene.musicTrack} />
      <BackgroundDisplay imageUrl={currentScene.backgroundUrl} />

      <CharacterDisplay
        characters={currentScene.charactersInScene}
        activeSpeakerSpriteId={currentLine?.characterSpriteId}
      />

      {!showChoices && currentLine && (
        <DialogText
          line={currentLine}
          onNext={advanceDialogue} // Клик по тексту двигает диалог дальше
        />
      )}

      {showChoices && currentScene.choices && (
        <ChoiceList
          choices={currentScene.choices}
          onChoiceSelected={(choice) => {
            console.log("Выбран вариант:", choice);
            if (currentScene.onExitScript) {
              // TODO: sceneStateManager.executeScript(currentScene.onExitScript);
            }
            handleChoice(choice);
          }}
          playerStats={sceneStateManager.getPlayerStats()}
          questState={sceneStateManager.getQuestState()}
          // Можно передать inventory={sceneStateManager.getInventory()}
        />
      )}

      {/* StatsPanel может быть частью общего HUD игры, а не только ВН */}
      {/* <StatsPanel stats={sceneStateManager.getPlayerStats()} /> */}
    </div>
  );
}; 