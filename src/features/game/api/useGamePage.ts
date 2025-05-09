import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { QuestSessionState } from '../../../shared/constants/quest';
import { GameView } from '../../../shared/types/game.types';

// Обновляем тип GameTab, используя GameView
type GameTab = GameView;

type Player = {
  id: Id<'players'>;
  name: string;
  stats: Record<string, number>;
  // Прочие свойства игрока
};

type QuestState = Record<string, any>;

/**
 * Хук для управления состоянием и логикой главной игровой страницы
 * Обрабатывает навигацию по вкладкам, инициализацию игрока и сканирование QR-кодов
 */
export function useGamePage() {
  // Состояние страницы
  const [activeTab, setActiveTab] = useState<GameTab>(GameView.MAP);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [questState, setQuestState] = useState<QuestState>({});
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Роутинг
  const navigate = useNavigate();

  // Мутации Convex
  const getOrCreatePlayer = useMutation(api.player.getOrCreatePlayer);
  const activateQuestByQR = useMutation(api.quest.activateQuestByQR);

  // Инициализация игрока
  const initPlayer = async () => {
    try {
      setLoading(true);
      
      // Получаем userId из localStorage
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        navigate('/login');
        return;
      }
      
      // Получаем или создаем игрока через API Convex
      const playerData = await getOrCreatePlayer({ userId: userId as any });
      
      if (playerData) {
        setPlayer(playerData);
        // Инициализируем состояние квеста из данных игрока
        if (playerData.questState) {
          setQuestState(JSON.parse(JSON.stringify(playerData.questState)) as QuestState);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  // Вызываем инициализацию при монтировании компонента
  useEffect(() => {
    initPlayer();
  }, [navigate]);

  // Обработчик сканирования QR-кода
  const handleQRScanSuccess = async (code: string) => {
    try {
      // Пытаемся активировать квест по QR через API Convex
      const result = await activateQuestByQR({ 
        playerId: player?.id, 
        qrCode: code 
      });
      
      if (result && result.sceneId) {
        // Если получили sceneId, устанавливаем его и переключаемся на вкладку новеллы
        setTimeout(() => {
          setCurrentSceneId(result.sceneId as string);
          setActiveTab(GameView.NOVEL);
        }, 100);
        return;
      }
    } catch (error) {
      console.error('Ошибка при активации квеста:', error);
      
      // В случае ошибки API, используем мок-данные для разработки
      // Мок-логика на основе кода QR
      switch (code) {
        case 'delivery_start':
          setTimeout(() => {
            setCurrentSceneId('delivery_start');
            setActiveTab(GameView.NOVEL);
          }, 100);
          break;
        case 'shelter':
          setTimeout(() => {
            setCurrentSceneId('shelter_intro');
            setActiveTab(GameView.NOVEL);
          }, 100);
          break;
        case 'inventory':
          setActiveTab(GameView.INVENTORY);
          break;
        default:
          alert('Неизвестный QR-код: ' + code);
      }
    }
  };
  
  // Обработчик клика по вкладке
  const handleTabClick = (tab: GameTab) => {
    setActiveTab(tab);
  };
  
  // Обработчик выхода из игры
  const handleExit = () => {
    navigate('/');
  };
  
  // Обработчик выхода из режима визуальной новеллы
  const handleNovelExit = () => {
    setActiveTab(GameView.MAP);
  };
  
  // Обработчик изменения представления игры
  const handleViewChange = (view: GameView) => {
    setActiveTab(view);
  };

  return {
    // Состояние
    activeTab,
    loading,
    error,
    player,
    currentSceneId,
    questState,
    hasNewMessage,
    
    // Методы
    setActiveTab,
    handleQRScanSuccess,
    handleViewChange,
    handleTabClick,
    handleExit,
    handleNovelExit,
    
    // Утилиты
    refreshPlayer: initPlayer
  };
} 