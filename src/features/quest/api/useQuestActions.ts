import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState, useCallback } from 'react';
import { QuestStateEnum } from '../../../shared/constants/quest';
import { PlayerData } from '../../player/api/usePlayer';
import { 
  showMarker,
  completeMarker,
  addInteraction,
  updateMarkersByQuestState
} from '../../../entities/markers/model';
import { getMockQRScanResult, getMockQuestStartResult } from '../model/mockData';

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
  
  // Обработка успешного сканирования QR-кода
  const handleQRScanSuccess = useCallback(async (code: string) => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      try {
        // Проверяем, что ID игрока имеет правильный формат для API
        if (typeof player._id === 'string' && player._id.startsWith('players:')) {
          result = await activateQuestByQR({
            playerId: player._id,
            qrCode: code
          });
        } else {
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
          updateMarkersByQuestState(result.questState);
        }
      }
    } catch (err) {
      console.error('Error activating QR code:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, activateQuestByQR, onStateChange, onSceneOpen]);
  
  // Обработка начала квеста
  const handleStartDeliveryQuest = useCallback(async () => {
    if (!player) return;
    
    try {
      setLoading(true);
      
      let result;
      
      // Пытаемся вызвать реальное API, но при ошибке используем мок
      try {
        // Проверяем, что ID игрока имеет правильный формат
        if (typeof player._id === 'string' && player._id.startsWith('players:')) {
          result = await startDeliveryQuest({ 
            playerId: player._id
          });
        } else {
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
        showMarker('trader');
      }
    } catch (err) {
      setError(`Error starting quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [player, startDeliveryQuest, onStateChange, onStepComplete]);
  
  // Обработка клика по маркеру на карте
  const handleMarkerClick = useCallback(async (marker: any) => {
    if (!player || !marker.qrCode) return;
    
    try {
      setLoading(true);
      
      // Регистрируем взаимодействие с маркером
      addInteraction({
        markerId: marker.id,
        action: 'activated',
        data: { timestamp: Date.now() }
      });
      
      // Если маркер - это задание, отмечаем его как выполненное
      if (marker.markerType === 'quest_point') {
        completeMarker(marker.id);
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
  }, [player, handleQRScanSuccess, onStepComplete]);
  
  return {
    loading,
    error,
    handleQRScanSuccess,
    handleStartDeliveryQuest
  };
} 