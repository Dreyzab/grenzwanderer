import { useCallback } from 'react';
import { ChoiceOption } from '../../shared/types/visualNovel';
import { questActionPerformed } from '../quest/model';
import { QuestActionEnum } from '../../shared/constants/quest';

interface UseSceneChoiceProps {
  setCurrentSceneId: (sceneId: string) => void;
  sceneStateManager: any; // Используем any временно, впоследствии нужно типизировать
  onExit?: (finalQuestState?: any, finalPlayerStats?: any) => void;
}

export function useSceneChoice({ 
  setCurrentSceneId, 
  sceneStateManager, 
  onExit 
}: UseSceneChoiceProps) {
  const handleChoice = useCallback((choice: ChoiceOption) => {
    // Проверка условий для выполнения выбора
    const isValid = sceneStateManager.checkCondition(choice.condition);
    
    // Если условия не прошли проверку
    if (!isValid) {
      // Если есть специальный обработчик для неудачного чека
      if (choice.action?.type === 'CHECK_STAT' && choice.action.payload.failScene) {
        setCurrentSceneId(choice.action.payload.failScene);
      }
      // Можно показать уведомление с текстом об ошибке
      console.log(choice.feedbackOnFail || 'Вы не соответствуете требованиям для этого выбора');
      return;
    }
    
    // Если есть действие, выполняем его
    if (choice.action) {
      switch (choice.action.type) {
        case 'UPDATE_QUEST_STATE':
          const { questId, state, ...otherData } = choice.action.payload;
          sceneStateManager.updateQuestState(questId, { state, ...otherData });
          
          // Если это стандартное квестовое действие, отправляем в Effector
          if (Object.values(QuestActionEnum).includes(state as QuestActionEnum)) {
            questActionPerformed({ 
              type: state as QuestActionEnum, 
              stepId: choice.id 
            });
          }
          break;
          
        case 'GIVE_ITEM':
          const { itemId, itemName, quantity } = choice.action.payload;
          sceneStateManager.givePlayerItem(itemId, itemName, quantity);
          break;
          
        case 'EXIT_VN':
          if (onExit) {
            onExit(
              sceneStateManager.getQuestState(), 
              sceneStateManager.getPlayerStats()
            );
          }
          return; // Важно: прерываем выполнение, чтобы избежать перехода к другой сцене
          
        case 'CHECK_STAT':
          // Проверка статов уже выполнена выше
          if (choice.action.payload.successScene) {
            setCurrentSceneId(choice.action.payload.successScene);
            return; // Прерываем выполнение, т.к. уже переходим на другую сцену
          }
          break;
          
        case 'UPDATE_STATS':
          const { stats } = choice.action.payload;
          if (stats) {
            Object.entries(stats).forEach(([stat, value]) => {
              sceneStateManager.updatePlayerStat(stat, Number(value));
            });
          }
          break;
          
        case 'CUSTOM_SCRIPT':
          sceneStateManager.executeScript(choice.action.payload);
          break;
          
        default:
          console.warn(`Неизвестный тип действия: ${choice.action.type}`);
          break;
      }
    }
    
    // Если указана следующая сцена, переходим к ней
    if (choice.nextSceneId) {
      setCurrentSceneId(choice.nextSceneId);
    } else if (!choice.action?.type || choice.action?.type !== 'EXIT_VN') {
      // Если нет явного перехода или выхода, завершаем визуальную новеллу
      if (onExit) {
        onExit(
          sceneStateManager.getQuestState(),
          sceneStateManager.getPlayerStats()
        );
      }
    }
  }, [setCurrentSceneId, sceneStateManager, onExit]);

  return { handleChoice };
} 