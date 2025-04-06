// src/pages/visualNovel/VisualNovel.tsx
import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { 
  $currentScene, 
  setCurrentScene, 
  setSceneLoading,
  $sceneLoading
} from '../../entities/scene/model';
import {
  $playerStats,
  updatePlayerStat
} from '../../entities/player/model';
import { showMarker, hideMarker } from '../../entities/markers/model';
import { CharacterDisplay } from '../../widgets/characterDisplay/CharacterDisplay';
import { DialogText } from '../../widgets/dialogText/DialogText';
import { StatsPanel } from '../../widgets/statsPanel/StatsPanel';
import { ChoiceList } from '../../widgets/choiceList/ChoiceList';
import { Choice, Scene } from '../../schared/types/visualNovel';
import './VisualNovel.css';

// Определяем константы для действий квеста
export const ACTION = {
  ACCEPT_ARTIFACT_QUEST: 'ACCEPT_ARTIFACT_QUEST',
  DECLINE_ARTIFACT_QUEST: 'decline_artifact_quest',
  START_DELIVERY_QUEST: 'START_DELIVERY_QUEST',
  TAKE_PARTS: 'TAKE_PARTS',
  HELP_ORK: 'HELP_ORK',
  KILL_BOTH: 'KILL_BOTH',
  IGNORE_ENCOUNTER: 'IGNORE_ENCOUNTER',
  RETURN_TO_CRAFTSMAN: 'RETURN_TO_CRAFTSMAN',
  COMPLETE_DELIVERY_QUEST: 'COMPLETE_DELIVERY_QUEST',
  ARTIFACT_FOUND: 'ARTIFACT_FOUND'
};

// Определяем состояние квеста
export enum QuestState {
  REGISTERED = 'REGISTERED',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  TRAINING_MISSION = 'TRAINING_MISSION',
  DELIVERY_STARTED = 'DELIVERY_STARTED',
  PARTS_COLLECTED = 'PARTS_COLLECTED',
  ARTIFACT_HUNT = 'ARTIFACT_HUNT',
  ARTIFACT_FOUND = 'ARTIFACT_FOUND',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  FREE_ROAM = 'FREE_ROAM',
  NEW_MESSAGE = 'NEW_MESSAGE'
}

// Локальные сцены для тестирования
const TEST_SCENES: Record<string, Scene> = {
  'trader_meeting': {
    id: 'trader_meeting',
    title: 'Встреча с торговцем',
    background: '/backgrounds/trader_camp.jpg',
    text: 'Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары. Завидев вас, он поднимает взгляд.\n\n«А, ты за запчастями от Дитера? Вот, забирай, всё здесь. Только береги, их трудно добыть. И передай Дитеру, что в следующий раз пусть платит больше, или товар пойдёт в другие руки.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Взять запчасти и отправиться к Дитеру',
        action: ACTION.TAKE_PARTS
      },
      {
        id: 'choice_1',
        text: 'Что у тебя есть на продажу?',
        nextSceneId: 'trader_shop'
      },
      {
        id: 'choice_2',
        text: 'Что нового происходит в мире?',
        nextSceneId: 'trader_gossip'
      }
    ]
  },
  'trader_shop': {
    id: 'trader_shop',
    title: 'Товары торговца',
    background: '/backgrounds/trader_camp.jpg',
    text: '«У меня есть многое, что может пригодиться сталкеру вроде тебя. От консервов и аптечек до патронов и снаряжения. Но за хорошие вещи нужно платить хорошую цену. Что именно тебя интересует?»\n\nТорговец показывает вам свой ассортимент товаров.',
    choices: [
      {
        id: 'choice_0',
        text: 'Я передумал. Лучше я возьму запчасти и отправлюсь к Дитеру',
        action: ACTION.TAKE_PARTS,
        nextSceneId: 'trader_meeting'
      },
      {
        id: 'choice_1',
        text: 'Вернуться к предыдущему разговору',
        nextSceneId: 'trader_meeting'
      }
    ]
  },
  'trader_gossip': {
    id: 'trader_gossip',
    title: 'Новости от торговца',
    background: '/backgrounds/trader_camp.jpg',
    text: '«Новости? Тут всякое болтают... Говорят, аномальная активность растет — на севере видели новый разлом. Военные оцепили район, никого не пускают. А еще слухи ходят о каких-то исследователях, которые ищут особый артефакт. За него, говорят, любую цену готовы заплатить... Но до этих мест пока не добрались, слишком опасно.»\n\nТорговец понижает голос:\n\n«И еще, кажется, появились новые группировки. Ведут себя странно, не как обычные мародеры или охотники за артефактами. Будь осторожен, если встретишь незнакомцев.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Интересно. Теперь я возьму запчасти и отправлюсь к Дитеру',
        action: ACTION.TAKE_PARTS,
        nextSceneId: 'trader_meeting'
      },
      {
        id: 'choice_1',
        text: 'Вернуться к предыдущему разговору',
        nextSceneId: 'trader_meeting'
      }
    ]
  },
  'craftsman_meeting': {
    id: 'craftsman_meeting',
    title: 'Встреча с мастеровым',
    background: '/backgrounds/workshop.jpg',
    text: 'В центральной мастерской города вы находите Дитера — пожилого мастерового с седыми усами, склонившегося над верстаком. Увидев вас с запчастями, он оживляется.\n\n«О, наконец-то! Я уже думал, эти детали никогда не придут. Молодец, сталкер, быстро справился.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Передать запчасти',
        nextSceneId: 'additional_task'
      },
      {
        id: 'choice_1',
        text: 'Что ты делаешь в своей мастерской?',
        nextSceneId: 'craftsman_work'
      },
      {
        id: 'choice_2',
        text: 'Расскажи о себе, Дитер',
        nextSceneId: 'craftsman_story'
      }
    ]
  },
  'additional_task': {
    id: 'additional_task',
    title: 'Дополнительное задание',
    background: '/backgrounds/workshop.jpg',
    text: 'Дитер принимает запчасти и внимательно их осматривает. Затем поднимает взгляд на вас.\n\n«Есть ещё одно дело, если хочешь подзаработать.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Что нужно сделать?',
        nextSceneId: 'artifact_task'
      },
      {
        id: 'choice_1',
        text: 'Пожалуй, я пока откажусь',
        nextSceneId: 'craftsman_farewell'
      }
    ]
  },
  'craftsman_work': {
    id: 'craftsman_work',
    title: 'Работа мастера',
    background: '/backgrounds/workshop.jpg',
    text: '«Я ремонтирую и создаю вещи, которые никто другой в городе не сможет сделать. Модификация оружия, особое снаряжение, специальные устройства для работы в аномальных зонах. Многие из моих изобретений помогают сталкерам выжить там, где обычный человек бы не протянул и часа.»\n\nДитер показывает вам несколько своих работ — улучшенные прицелы, модифицированные детекторы аномалий, легкую но прочную броню.\n\n«Конечно, для создания таких вещей нужны особые материалы, которые не так просто добыть. Поэтому услуги мои недешевы, но, поверь, они того стоят.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Теперь давай вернемся к запчастям',
        nextSceneId: 'craftsman_meeting'
      }
    ]
  },
  'craftsman_story': {
    id: 'craftsman_story',
    title: 'История Дитера',
    background: '/backgrounds/workshop.jpg',
    text: '«Я здесь с самого начала, почти с первых разломов. Раньше был инженером в крупной компании, разрабатывал оборудование для горнодобывающей промышленности. Когда начали появляться аномалии, большинство бежало из этих мест. А я... я увидел возможность. Не для наживы, нет. Для изучения, для создания чего-то нового.»\n\nДитер замолкает на мгновение, его взгляд устремляется куда-то вдаль.\n\n«Я потерял семью во время Второго Прорыва. Жена и дочь... Теперь мои инструменты и эта мастерская — всё, что у меня есть. Помогаю людям выживать в этом новом мире — это стало моим призванием.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Мне жаль это слышать. Давай вернемся к запчастям',
        nextSceneId: 'craftsman_meeting'
      }
    ]
  },
  'craftsman_farewell': {
    id: 'craftsman_farewell',
    title: 'Прощание с мастером',
    background: '/backgrounds/workshop.jpg',
    text: '«Как знаешь. Если передумаешь, ты знаешь, где меня найти. И спасибо за запчасти — они действительно очень нужны.»\n\nДитер возвращается к своей работе, но вы чувствуете, что приобрели ценного союзника. Может быть, стоит заглянуть к нему позже, когда вы будете готовы к новым заданиям.',
    choices: [
      {
        id: 'choice_0',
        text: 'Уйти (вернуться на карту)',
        action: 'exit_to_map'
      }
    ]
  },
  'artifact_task': {
    id: 'artifact_task',
    title: 'Поиск артефакта',
    background: '/backgrounds/workshop.jpg',
    text: '«Недалеко отсюда активировался разлом. Мои инструменты засекли в зоне активности редкий артефакт — кристалл чистой энергии. Если принесёшь, заплачу щедро. Но будь осторожен, в таких местах водится всякое.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Взяться за задание',
        action: ACTION.ACCEPT_ARTIFACT_QUEST,
        nextSceneId: 'artifact_hunt_start'
      },
      {
        id: 'choice_1',
        text: 'Отказаться',
        action: ACTION.DECLINE_ARTIFACT_QUEST,
        nextSceneId: 'craftsman_farewell'
      }
    ]
  },
  'artifact_hunt_start': {
    id: 'artifact_hunt_start',
    title: 'Начало охоты за артефактом',
    background: '/backgrounds/workshop.jpg',
    text: '«Умный выбор. Вот, возьми эти координаты. Район опасный, но данные анализаторов говорят, что кристалл того стоит. Когда доберешься туда, используй этот детектор — он настроен на частоту подобных артефактов.»\n\nДитер передает вам небольшой прибор, похожий на счетчик Гейгера, но с необычным интерфейсом.\n\n«Будь осторожен там. Аномалии имеют свойство... менять всё вокруг. И не только местность.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Отправиться к месту поиска артефакта',
        nextSceneId: 'artifact_area',
        action: 'goto_anomaly'
      }
    ]
  },
  'artifact_area': {
    id: 'artifact_area',
    title: 'Аномальная зона',
    background: '/backgrounds/anomaly.jpg',
    text: 'Вы прибыли в указанное место. Воздух здесь странно искажается, а окружающий пейзаж словно подёрнут дымкой. Вы ощущаете характерное покалывание — признак близости аномальной активности. Где-то здесь должен быть кристалл...',
    choices: [
      {
        id: 'choice_0',
        text: 'Осмотреться в поисках артефакта',
        nextSceneId: 'ork_encounter',
        action: 'search_artifact'
      }
    ]
  },
  'ork_encounter': {
    id: 'ork_encounter',
    title: 'Неожиданная встреча',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Внезапно вы замечаете в лесной чаще странную сцену: орк-воин, раненый и измотанный, с трудом отбивается от крупного зомбированного волка, покрытого язвами и выделяющего ядовитые испарения. Ситуация критическая, и вам нужно решить, как поступить.',
    choices: [
      {
        id: 'choice_0',
        text: 'Помочь орку убить волка',
        nextSceneId: 'help_ork',
        action: ACTION.HELP_ORK
      },
      {
        id: 'choice_1',
        text: 'Убить и орка, и волка',
        nextSceneId: 'kill_both',
        action: ACTION.KILL_BOTH
      },
      {
        id: 'choice_2',
        text: 'Не вмешиваться и продолжить поиск',
        nextSceneId: 'ignore_encounter',
        action: ACTION.IGNORE_ENCOUNTER
      }
    ]
  },
  'artifact_found': {
    id: 'artifact_found',
    title: 'Артефакт найден',
    background: '/backgrounds/artifact_found.jpg',
    text: 'После тщательных поисков вы обнаруживаете то, что искали — кристалл чистой энергии, пульсирующий голубоватым светом. Осторожно взяв его специальными щипцами, вы помещаете артефакт в контейнер. Пора возвращаться к Дитеру.',
    choices: [
      {
        id: 'choice_0',
        text: 'Вернуться к Дитеру',
        nextSceneId: 'quest_complete',
        action: ACTION.RETURN_TO_CRAFTSMAN
      }
    ]
  },
  'quest_complete': {
    id: 'quest_complete',
    title: 'Задание выполнено',
    background: '/backgrounds/workshop.jpg',
    text: 'Дитер внимательно изучает принесенный вами кристалл, и его глаза загораются от восторга.\n\n«Впечатляет! Ты оправдал моё доверие. Держи оплату и запомни: всегда думай дважды, прежде чем вмешиваться в дела разломов. Это может стоить дороже, чем кажется.»\n\nВы получаете обещанную награду и чувствуете, что приобрели ценного союзника в лице мастерового.',
    choices: [
      {
        id: 'choice_0',
        text: 'Завершить задание',
        action: ACTION.COMPLETE_DELIVERY_QUEST,
        nextSceneId: 'quest_end'
      }
    ]
  },
  'quest_end': {
    id: 'quest_end',
    title: 'Конец задания',
    background: '/backgrounds/city_view.jpg',
    text: 'Вы успешно выполнили задание. Теперь перед вами открываются новые возможности в этом странном мире. Куда вы отправитесь дальше?\n\nКажется, что с каждым выполненным заданием вы всё больше понимаете устройство этого мира, полного опасностей и тайн.',
    choices: [
      {
        id: 'choice_0',
        text: 'Вернуться на карту',
        action: 'exit_to_map'
      }
    ]
  }
};

interface VisualNovelProps {
  initialSceneId?: string;
  playerId?: string;
  onExit?: () => void;
  questState?: {
    currentState: string;
    updateState: (state: string) => void;
  };
}

interface SceneChoice {
  text: string;
  nextSceneId?: Id<"scenes">;
  action?: string;
  statChanges?: {
    energy?: number;
    willpower?: number;
    attractiveness?: number;
    fitness?: number;
    intelligence?: number;
    corruption?: number;
    money?: number;
  };
}

export const VisualNovel: React.FC<VisualNovelProps> = ({ 
  initialSceneId,
  playerId,
  onExit,
  questState
}) => {
  const currentScene = useUnit($currentScene);
  const playerStats = useUnit($playerStats);
  const isLoading = useUnit($sceneLoading);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneKey, setCurrentSceneKey] = useState(initialSceneId || "");
  
  // Get Convex queries and mutations
  const scene = useQuery(api.quest.getSceneByKey, { sceneKey: currentSceneKey });
  const makeSceneChoice = useMutation(api.quest.makeSceneChoice);
  
  // Load initial scene
  useEffect(() => {
    if (initialSceneId) {
      setCurrentSceneKey(initialSceneId);
      loadScene(initialSceneId);
    }
  }, [initialSceneId]);
  
  // Function to load a scene by ID
  const loadScene = async (sceneId: string) => {
    try {
      setSceneLoading(true);
      setError(null);
      setCurrentSceneKey(sceneId);
      
      // Попробуем загрузить сцену из API
      let parsedScene: Scene | null = null;
      
      // Если есть сцена в API
      if (scene) {
        // Convert Convex scene to our internal Scene type
        parsedScene = {
          id: scene._id.toString(),
          title: scene.title,
          background: scene.background || undefined,
          text: scene.text,
          character: scene.character ? {
            id: scene.character.name,
            name: scene.character.name,
            image: scene.character.image,
            position: scene.character.position as 'left' | 'center' | 'right'
          } : undefined,
          choices: scene.choices.map((choice: SceneChoice, index: number) => ({
            id: `choice_${index}`,
            text: choice.text,
            nextSceneId: choice.nextSceneId?.toString(),
            action: choice.action,
            statChanges: choice.statChanges ? {
              energy: choice.statChanges.energy,
              willpower: choice.statChanges.willpower,
              attractiveness: choice.statChanges.attractiveness,
              fitness: choice.statChanges.fitness,
              intelligence: choice.statChanges.intelligence,
              corruption: choice.statChanges.corruption,
              money: choice.statChanges.money
            } : undefined
          }))
        };
      } 
      // Если сцены нет в API, но есть в локальных тестовых сценах
      else if (TEST_SCENES[sceneId]) {
        console.log(`Используем локальную тестовую сцену: ${sceneId}`);
        parsedScene = TEST_SCENES[sceneId];
      }
      // Если сцены нигде нет
      else {
        setError(`Сцена не найдена: ${sceneId}`);
        return;
      }
      
      // Устанавливаем сцену
      setCurrentScene(parsedScene);
    } catch (err) {
      setError(`Ошибка загрузки сцены: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setSceneLoading(false);
    }
  };
  
  // Handle player choice
  const handleChoiceSelected = async (choice: Choice) => {
    try {
      setSceneLoading(true);
      
      // Apply stat changes if any
      if (choice.statChanges) {
        Object.entries(choice.statChanges).forEach(([stat, value]) => {
          if (value !== undefined) {
            updatePlayerStat({ 
              stat: stat as keyof typeof playerStats, 
              value 
            });
          }
        });
      }
      
      // Handle special actions for quest state and markers
      if (choice.action) {
        switch (choice.action) {
          case ACTION.ACCEPT_ARTIFACT_QUEST:
            // Активируем маркер аномальной зоны при принятии задания
            showMarker('anomaly');
            if (questState) {
              questState.updateState(QuestState.ARTIFACT_HUNT);
            }
            console.log('Маркер аномальной зоны активирован');
            break;
            
          case ACTION.DECLINE_ARTIFACT_QUEST:
            // Скрываем маркер аномальной зоны при отказе от задания
            hideMarker('anomaly');
            console.log('Маркер аномальной зоны скрыт');
            break;
            
          case ACTION.START_DELIVERY_QUEST:
            // Активируем маркер торговца при начале задания доставки
            showMarker('trader');
            if (questState) {
              questState.updateState(QuestState.DELIVERY_STARTED);
            }
            console.log('Маркер торговца активирован');
            break;
            
          case ACTION.TAKE_PARTS:
            // Активируем маркер мастерской при взятии запчастей
            showMarker('craftsman');
            if (questState) {
              questState.updateState(QuestState.PARTS_COLLECTED);
            }
            console.log('Маркер мастерской активирован');
            break;
            
          case ACTION.RETURN_TO_CRAFTSMAN:
            // Показываем все маркеры при возвращении к мастеру
            if (questState) {
              questState.updateState(QuestState.ARTIFACT_FOUND);
            }
            break;
            
          case ACTION.COMPLETE_DELIVERY_QUEST:
            // Завершаем квест
            if (questState) {
              questState.updateState(QuestState.QUEST_COMPLETION);
            }
            break;
            
          case 'exit_to_map':
            if (onExit) {
              onExit();
              return;
            }
            break;
            
          case 'end_character_creation':
            if (onExit) {
              onExit();
              return;
            }
            break;
        }
      }
      
      // If we have playerId, send the choice to the server
      if (playerId && currentScene) {
        try {
          const result = await makeSceneChoice({
            playerId: playerId as Id<"players">,
            sceneId: currentScene.id as Id<"scenes">,
            choiceIndex: parseInt(choice.id.split('_')[1])
          });
          
          // If there's a next scene, load it
          if (result.nextSceneId) {
            await loadScene(result.nextSceneId.toString());
          } else if (onExit) {
            onExit();
          }
        } catch (apiErr) {
          console.warn('API error, using local scene navigation:', apiErr);
          // Если API недоступно, просто переходим к следующей сцене, если она есть
          if (choice.nextSceneId) {
            await loadScene(choice.nextSceneId);
          } else if (onExit) {
            onExit();
          }
        }
      } 
      // Otherwise, just navigate if we have nextSceneId
      else if (choice.nextSceneId) {
        await loadScene(choice.nextSceneId);
      } else if (onExit) {
        onExit();
      }
    } catch (err) {
      setError(`Error processing choice: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSceneLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="vn-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка сцены...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="vn-error">
        <p>{error}</p>
        <button onClick={onExit}>Вернуться на карту</button>
      </div>
    );
  }
  
  // Show empty state
  if (!currentScene) {
    return (
      <div className="vn-empty">
        <p>Нет активной сцены. Сцена с ID: {currentSceneKey} не найдена.</p>
        <button onClick={onExit}>Вернуться на карту</button>
      </div>
    );
  }
  
  return (
    <div className="visual-novel">
      {/* Background */}
      {currentScene.background && (
        <div 
          className="vn-background"
          style={{ backgroundImage: `url(${currentScene.background})` }}
        />
      )}
      
      {/* Character */}
      <CharacterDisplay character={currentScene.character} />
      
      {/* UI Container */}
      <div className="vn-ui-container">
        {/* Title */}
        <div className="vn-title">{currentScene.title}</div>
        
        {/* Stats Panel */}
        <div className="vn-stats-container">
          <StatsPanel />
        </div>
        
        {/* Dialog & Choices */}
        <div className="vn-dialog-container">
          <DialogText />
          <ChoiceList onChoiceSelected={handleChoiceSelected} />
        </div>
      </div>
    </div>
  );
};
