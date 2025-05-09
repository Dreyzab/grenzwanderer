import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState, useCallback } from 'react';
import { 
  QuestState,
  QuestAction,
  QRScanResult,
  QuestStartResult,
  QuestActionResult
} from '../../../shared/types/quest.types';
import { PlayerData } from '../../../entities/player/api/usePlayer';
import { useMarkers } from '../../markers/api/useMarkers';
import { getMockQRScanResult, getMockQuestStartResult } from '../model/mockData';
import { Id } from '../../../../convex/_generated/dataModel';
import { questActionPerformed } from '../model';

// Интерфейс для коллбэков изменений
interface QuestCallbacks {
  onStateChange?: (state: QuestState) => void;
  onSceneOpen?: (sceneId: string) => void;
  onStepComplete?: (stepId: string) => void;
}

// Результат хука
export interface QuestActionsResult {
  scanQRCode: (code: string) => Promise<{ message: string }>;
  startQuest: (questId?: string) => Promise<{ message: string }>;
  questState: QuestState | null;
  loading: boolean;
  error: string | null;
}

/**
 * Создаем квестовое действие указанного типа
 * Вспомогательная функция для типизированного создания действий
 */
function createQuestAction(
  type: QuestAction, 
  payload?: Record<string, any>
): { type: QuestAction } & Record<string, any> {
  return {
    type,
    ...payload
  };
}

/**
 * Хук для действий, связанных с квестами
 */
export function useQuestActions({
  playerId,
  onStateChange,
  onSceneOpen,
  onStepComplete
}: {
  playerId?: string;
} & QuestCallbacks): QuestActionsResult {
  // Состояние
  const [questState, setQuestState] = useState<QuestState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Получаем функции для управления маркерами
  const { updateMarkersByQuest } = useMarkers();

  // Мутации Convex
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const startDeliveryQuestMutation = useMutation(api.quest.startDeliveryQuest);

  // Функция сканирования QR-кода
  const scanQRCode = useCallback(
    async (code: string): Promise<{ message: string }> => {
      setLoading(true);
      setError(null);

      try {
        // В реальном приложении вызываем API
        let result: QuestActionResult | null = null;
        
        if (playerId) {
          result = await activateQuestByQR({ 
            qrCode: code, 
            playerId: playerId as Id<"players"> 
          }) as QuestActionResult;
        }
        
        if (result) {
          // Обрабатываем результат
          if (result.questState && onStateChange) {
            setQuestState(result.questState);
            onStateChange(result.questState);
            updateMarkersByQuest(result.questState);
            
            // Диспетчеризуем событие для модели Effector
            if (result.action) {
              const action = createQuestAction(result.action, {});
              questActionPerformed(action);
            }
          }
          
          // Если есть шаг для завершения, отмечаем его
          if (result.completedStep && onStepComplete) {
            onStepComplete(result.completedStep);
          }
          
          // Если есть sceneKey, открываем его
          if (result.sceneId && onSceneOpen) {
            onSceneOpen(result.sceneId);
          }

          return { message: result.message };
        } else {
          // Используем моковые данные, если API недоступно или вернуло null
          const mockResult = getMockQRScanResult(code);
          setQuestState(mockResult.questState || null);
          
          if (mockResult.questState && onStateChange) {
            onStateChange(mockResult.questState);
            updateMarkersByQuest(mockResult.questState);
            
            if (mockResult.action) {
              const action = createQuestAction(mockResult.action, {});
              questActionPerformed(action);
            }
          }
          
          if (mockResult.completedStep && onStepComplete) {
            onStepComplete(mockResult.completedStep);
          }
          
          if (mockResult.sceneId && onSceneOpen) {
            onSceneOpen(mockResult.sceneId);
          }
          
          return { message: mockResult.message };
        }
      } catch (err) {
        console.error('Ошибка при сканировании QR:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        return { message: 'Ошибка при сканировании QR-кода' };
      } finally {
        setLoading(false);
      }
    },
    [playerId, activateQuestByQR, onStateChange, onSceneOpen, onStepComplete, updateMarkersByQuest]
  );

  // Функция запуска квеста
  const startQuest = useCallback(
    async (questId?: string): Promise<{ message: string }> => {
      setLoading(true);
      setError(null);

      try {
        // В реальном приложении вызываем API
        let result: QuestStartResult | null = null;
        
        if (playerId) {
          result = await startDeliveryQuestMutation({ 
            playerId: playerId as Id<"players">
          }) as QuestStartResult;
        }
        
        if (result) {
          // Обрабатываем результат так же, как и при сканировании QR
          if (result.questState && onStateChange) {
            setQuestState(result.questState);
            onStateChange(result.questState);
            
            if (result.action) {
              const action = createQuestAction(result.action, {});
              questActionPerformed(action);
            }
          }
          
          if (result.sceneId && onSceneOpen) {
            onSceneOpen(result.sceneId);
          }
          
          return { message: result.message };
        } else {
          // Используем моковые данные
          const mockResult = getMockQuestStartResult();
          
          if (mockResult.questState && onStateChange) {
            setQuestState(mockResult.questState);
            onStateChange(mockResult.questState);
            
            if (mockResult.action) {
              const action = createQuestAction(mockResult.action, {});
              questActionPerformed(action);
            }
          }
          
          if (mockResult.sceneId && onSceneOpen) {
            onSceneOpen(mockResult.sceneId);
          }
          
          return { message: mockResult.message };
        }
      } catch (err) {
        console.error('Ошибка при запуске квеста:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        return { message: 'Ошибка при запуске квеста' };
      } finally {
        setLoading(false);
      }
    },
    [playerId, startDeliveryQuestMutation, onStateChange, onSceneOpen]
  );

  // Создаем отдельную функцию для начала квеста с действием START_GAME
  const handleQuestStart = useCallback(
    (questId?: string): Promise<{ message: string }> => {
      // Создаем действие START_GAME и отправляем его в модель
      const action = createQuestAction(QuestAction.START_GAME, { playerId });
      questActionPerformed(action);
      return startQuest(questId);
    },
    [playerId, startQuest]
  );

  return {
    scanQRCode,
    startQuest: handleQuestStart,
    questState,
    loading,
    error
  };
} 