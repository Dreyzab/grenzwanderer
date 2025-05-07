import { useCallback } from 'react';
import { Choice } from '../../shared/types/visualNovel';
import { useSceneLoader } from './useSceneLoader';
import { updatePlayerStat } from '../../entities/player/model';
import { showMarker, hideMarker } from '../../entities/markers/model';
import { questActionPerformed } from '../quest/model';
import { QuestActionEnum } from '../../shared/constants/quest';

interface UseSceneChoiceProps {
  onExit?: () => void;
}

export function useSceneChoice({ onExit }: UseSceneChoiceProps = {}) {
  const { loadScene } = useSceneLoader();

  const handleChoice = useCallback(async (choice: Choice) => {
    // Обновление статов, если есть
    if (choice.statChanges) {
      Object.entries(choice.statChanges).forEach(([stat, value]) => {
        updatePlayerStat({ stat: stat as any, value: value as number });
      });
    }
    // Обработка action (квесты, маркеры, спецдействия)
    if (choice.action) {
      switch (choice.action) {
        case QuestActionEnum.ACCEPT_ARTIFACT_QUEST:
          showMarker('anomaly');
          questActionPerformed({ type: QuestActionEnum.ACCEPT_ARTIFACT_QUEST, stepId: choice.id });
          break;
        case QuestActionEnum.DECLINE_ARTIFACT_QUEST:
          hideMarker('anomaly');
          questActionPerformed({ type: QuestActionEnum.DECLINE_ARTIFACT_QUEST, stepId: choice.id });
          break;
        case QuestActionEnum.START_DELIVERY_QUEST:
          showMarker('trader');
          questActionPerformed({ type: QuestActionEnum.START_DELIVERY_QUEST, stepId: choice.id });
          break;
        case QuestActionEnum.TAKE_PARTS:
          showMarker('craftsman');
          questActionPerformed({ type: QuestActionEnum.TAKE_PARTS, stepId: choice.id });
          break;
        case QuestActionEnum.RETURN_TO_CRAFTSMAN:
          questActionPerformed({ type: QuestActionEnum.RETURN_TO_CRAFTSMAN, stepId: choice.id });
          break;
        case QuestActionEnum.COMPLETE_DELIVERY_QUEST:
          questActionPerformed({ type: QuestActionEnum.COMPLETE_DELIVERY_QUEST, stepId: choice.id });
          break;
        case 'exit_to_map':
          if (onExit) onExit();
          return;
        default:
          // Можно добавить другие действия
          break;
      }
    }
    // Переход к следующей сцене
    if (choice.nextSceneId) {
      await loadScene(choice.nextSceneId);
    }
  }, [loadScene, onExit]);

  return { handleChoice };
} 