import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/shared/ui';

// Импортируем виджеты из правильных модулей
import { 
  NovelBackgroundWidget, 
  CharacterDisplayWidget, 
  DialogueBoxWidget, 
  ChoiceListWidget 
} from '@/widgets/novel';

// Определяем интерфейсы для хуков сцены
interface Scene {
  id: string;
  title: string;
  // другие поля сцены
}

interface SceneCharacter {
  id: string;
  name: string;
  position: 'left' | 'center' | 'right';
  // другие поля персонажа
}

interface DialogueLine {
  speakerId?: string;
  speakerName?: string;
  text: string;
  // другие поля диалоговой строки
}

interface Choice {
  id: string;
  text: string;
  // другие поля выбора
}

interface TemporaryStats {
  questUpdates?: Record<string, any>;
  statsUpdates?: Record<string, any>;
  // другие временные состояния
}

interface SceneLoaderResult {
  scene: Scene | null;
  isLoading: boolean;
  error: Error | null;
}

interface SceneStateResult {
  currentLine: DialogueLine | null;
  characters: SceneCharacter[];
  background: string;
  choices: Choice[];
  advanceScene: () => void;
  temporaryStats: TemporaryStats;
  isSceneComplete: boolean;
}

interface SceneChoiceResult {
  handleChoice: (choiceId: string) => any;
}

// Имитируем хуки, которые будут заменены на реальные
const useSceneLoader = (sceneId: string): SceneLoaderResult => {
  const [state, setState] = useState<SceneLoaderResult>({
    scene: null,
    isLoading: true,
    error: null
  });
  
  useEffect(() => {
    // Здесь будет реальная загрузка сцены
    console.log(`Loading scene with ID: ${sceneId}`);
    
    // Имитация загрузки для демонстрации
    setTimeout(() => {
      setState({
        scene: { id: sceneId, title: 'Тестовая сцена' },
        isLoading: false,
        error: null
      });
    }, 1000);
    
    return () => {
      // Отмена запросов при размонтировании
    };
  }, [sceneId]);
  
  return state;
};

const useSceneStateManager = (scene: Scene | null): SceneStateResult => {
  const [state, setState] = useState<SceneStateResult>({
    currentLine: { text: 'Добро пожаловать в визуальную новеллу!' },
    characters: [],
    background: 'default-background.jpg',
    choices: [],
    advanceScene: () => {},
    temporaryStats: {},
    isSceneComplete: false
  });
  
  useEffect(() => {
    if (scene) {
      // Инициализация состояния сцены на основе данных
      // В реальном приложении здесь будет логика управления сценой
    }
  }, [scene]);
  
  return state;
};

const useSceneChoice = (scene: Scene | null, temporaryStats: TemporaryStats): SceneChoiceResult => {
  return {
    handleChoice: (choiceId: string) => {
      console.log(`Choice selected: ${choiceId}`);
      return {}; // Возвращаем пустой объект как результат выбора
    }
  };
};

interface VisualNovelLocationState {
  sceneId?: string;
  playerId?: string;
  questState?: any;
  playerStats?: any;
  returnPath?: string;
}

/**
 * Объединенный компонент визуальной новеллы
 * Поддерживает оба способа инициализации:
 * 1. Через параметры URL (/novel/:sceneId)
 * 2. Через состояние навигации (location.state)
 */
export const VisualNovelPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sceneId: sceneIdParam } = useParams<{ sceneId: string }>();
  
  // Получаем параметры из состояния навигации или используем значения из URL
  const { 
    sceneId: sceneIdState = undefined,
    playerId,
    questState: initialQuestState,
    playerStats: initialPlayerStats,
    returnPath
  } = (location.state as VisualNovelLocationState) || {};
  
  // Приоритет отдаём URL-параметру, если он существует
  const sceneId = sceneIdParam || sceneIdState || 'default_scene';
  
  // Локальное состояние для отслеживания изменений
  const [currentQuestState, setCurrentQuestState] = useState<Record<string, any>>(initialQuestState || {});
  const [currentPlayerStats, setCurrentPlayerStats] = useState<Record<string, any>>(initialPlayerStats || {});
  
  // Загрузка сцены по ID
  const { scene, isLoading, error } = useSceneLoader(sceneId);
  
  // Управление состоянием сцены
  const { 
    currentLine, 
    characters, 
    background, 
    choices, 
    advanceScene, 
    temporaryStats, 
    isSceneComplete 
  } = useSceneStateManager(scene);
  
  // Обработка выборов
  const { handleChoice } = useSceneChoice(scene, temporaryStats);
  
  // Обработка завершения сцены
  useEffect(() => {
    if (isSceneComplete) {
      // Обновляем состояние квеста и игрока перед выходом
      const finalQuestState = { ...currentQuestState, ...temporaryStats.questUpdates };
      const finalPlayerStats = { ...currentPlayerStats, ...temporaryStats.statsUpdates };
      
      // Возвращаемся на предыдущую страницу или указанный путь
      if (returnPath) {
        navigate(returnPath, { 
          state: { 
            questState: finalQuestState, 
            playerStats: finalPlayerStats 
          },
          replace: true
        });
      } else {
        navigate(-1);
      }
      
      // Логирование (можно убрать в продакшене)
      console.log('Visual novel complete:', { finalQuestState, finalPlayerStats });
    }
  }, [isSceneComplete, navigate, returnPath, currentQuestState, currentPlayerStats, temporaryStats]);
  
  // Функция для обработки выбора с обновлением состояния
  const handleChoiceWithState = (choiceId: string) => {
    // Обрабатываем выбор через существующий хук
    const result = handleChoice(choiceId);
    
    // Обновляем состояние на основе результата
    if (result) {
      if (result.questUpdates) {
        setCurrentQuestState((prev: Record<string, any>) => ({ ...prev, ...result.questUpdates }));
      }
      
      if (result.statsUpdates) {
        setCurrentPlayerStats((prev: Record<string, any>) => ({ ...prev, ...result.statsUpdates }));
      }
    }
  };
  
  // Обработчик принудительного выхода (например, по кнопке)
  const handleExit = () => {
    // Возвращаемся на предыдущую страницу или указанный путь
    if (returnPath) {
      navigate(returnPath, { 
        state: { 
          questState: currentQuestState, 
          playerStats: currentPlayerStats 
        },
        replace: true
      });
    } else {
      navigate(-1);
    }
  };
  
  // Отображение загрузки
  if (isLoading) {
    return (
      <PageLayout
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-2xl text-accent">Загрузка сцены...</div>
          </div>
        }
      />
    );
  }
  
  // Обработка ошибки
  if (error || !scene) {
    return (
      <PageLayout
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-2xl text-error">Ошибка загрузки сцены</div>
          </div>
        }
      />
    );
  }
  
  // Основной контент визуальной новеллы
  const novelContent = (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      {/* Фон сцены */}
      <NovelBackgroundWidget imageUrl={background} />
      
      {/* Персонажи */}
      <div className="absolute inset-0 pointer-events-none">
        {characters.map((character: SceneCharacter) => (
          <CharacterDisplayWidget 
            key={character.id}
            character={character}
            isActive={character.id === currentLine?.speakerId}
            position={character.position}
          />
        ))}
      </div>
      
      {/* Диалоговое окно с текстом и именем говорящего */}
      <div className="mt-auto">
        <DialogueBoxWidget 
          dialogue={currentLine?.text || ''}
          speakerName={currentLine?.speakerName}
          onAdvance={choices.length ? undefined : advanceScene}
          onExit={handleExit}
        />
        
        {/* Варианты выбора, если есть */}
        {choices.length > 0 && (
          <ChoiceListWidget 
            choices={choices}
            onChoiceSelected={handleChoiceWithState}
          />
        )}
      </div>
    </div>
  );
  
  return (
    <PageLayout
      content={
        <div className="w-full h-full flex justify-center items-center relative overflow-hidden bg-black">
          {novelContent}
        </div>
      }
    />
  );
};

export default VisualNovelPage; 