import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState, useCallback } from 'react';
import { QuestStateEnum } from '../../../shared/constants/quest';
import { PlayerData } from '../../player/api/usePlayer';
import { useMarkers } from '../../markers/api';
import { getMockQRScanResult, getMockQuestStartResult } from '../model/mockData';

// Функция для проверки валидности ID игрока
const isValidPlayerId = (playerId: any): boolean => {
  return typeof playerId === 'string' && 
         playerId.startsWith('players:') && 
         playerId.length > 8;
};

export interface QuestActionsResult {
  loading: boolean;
  error: string | null;
  handleQRScanSuccess: (code: string) => Promise<void>;
  handleStartDeliveryQuest: () => Promise<void>;
}

export function useQuestActions(
  player: PlayerData | null,
  onStateChange: (state: QuestStateEnum) => void, 
  onStepComplete: (stepId: string) => void,
  onSceneOpen: (sceneId: string) => void
): QuestActionsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Получаем Convex мутации
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);
  const startDeliveryQuest = useMutation(api.quest.startDeliveryQuest);
  
  // Получаем API маркеров
  const { 
    addMarkerInteraction, 
    toggleComplete, 
    showMarkerById, 
    updateMarkersByQuest 
  } = useMarkers();
  
  // Обработка успешного сканирования QR-кода
  const handleQRScanSuccess = useCallback(async (code: string) => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      try {
        // Улучшенная проверка ID игрока
        if (isValidPlayerId(player._id)) {
          result = await activateQuestByQR({
            playerId: player._id,
            qrCode: code
          });
        } else {
          console.warn("Invalid player ID format:", player._id);
          throw new Error("Invalid player ID format for API call");
        }
      } catch (apiError) {
        console.warn("API call failed, using mock data for QR activation:", apiError);
        // Используем моковые данные
        result = getMockQRScanResult(code);
      }
      
      if (result) {
        // Показываем уведомление
        alert(result.message);
        
        // Обрабатываем результат
        if (result.sceneId) {
          // Открываем сцену
          onSceneOpen(result.sceneId);
        }
        
        // Обновляем состояние квеста, если оно изменилось
        if (result.questState && Object.values(QuestStateEnum).includes(result.questState as QuestStateEnum)) {
          onStateChange(result.questState as QuestStateEnum);
          
          // Обновляем видимость маркеров на основе нового состояния
          updateMarkersByQuest(result.questState);
        }
      }
    } catch (err) {
      console.error('Error activating QR code:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, activateQuestByQR, onStateChange, onSceneOpen, updateMarkersByQuest]);
  
  // Обработка начала квеста
  const handleStartDeliveryQuest = useCallback(async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      // Пытаемся вызвать реальное API, но при ошибке используем мок
      try {
        // Улучшенная проверка ID игрока
        if (isValidPlayerId(player._id)) {
          result = await startDeliveryQuest({ 
            playerId: player._id
          });
        } else {
          console.warn("Invalid player ID format:", player._id);
          throw new Error("Invalid player ID format for API call");
        }
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError);
        // Используем моковые данные
        result = getMockQuestStartResult();
      }
      
      if (result && result.sceneId) {
        // Обновляем состояние квеста
        onStateChange(QuestStateEnum.DELIVERY_STARTED);
        
        // Отмечаем шаг квеста как выполненный
        onStepComplete('start_delivery');
        
        // Показываем маркер торговца на карте
        showMarkerById('trader');
      }
    } catch (err) {
      setError(`Error starting quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, startDeliveryQuest, onStateChange, onStepComplete, showMarkerById]);
  
  // Обработка клика по маркеру на карте
  const handleMarkerClick = useCallback(async (marker: any) => {
    if (!player || !marker.qrCode) return;
    
    try {
      setLoading(true);
      
      // Регистрируем взаимодействие с маркером
      addMarkerInteraction({
        markerId: marker.id,
        interactionType: 'activated',
        timestamp: Date.now(),
        data: { player: player._id }
      });
      
      // Если маркер - это задание, отмечаем его как выполненное
      if (marker.markerType === 'quest_point') {
        toggleComplete(marker.id);
      }
      
      // Отмечаем шаг как выполненный
      onStepComplete(marker.id);
      
      // Обрабатываем QR-код маркера
      await handleQRScanSuccess(marker.qrCode);
    } catch (err) {
      console.error('Error activating marker:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, handleQRScanSuccess, onStepComplete, addMarkerInteraction]);
  
  return {
    loading,
    error,
    handleQRScanSuccess,
    handleStartDeliveryQuest
  };
} 