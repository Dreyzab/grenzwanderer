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

// Константы для действий
export const ACTION = {
  ACCEPT_ARTIFACT_QUEST: 'accept_artifact_quest',
  DECLINE_ARTIFACT_QUEST: 'decline_artifact_quest',
  START_DELIVERY_QUEST: 'start_delivery_quest',
  TAKE_PARTS: 'take_parts',
  RETURN_TO_CRAFTSMAN: 'return_to_craftsman',
  COMPLETE_DELIVERY_QUEST: 'complete_delivery_quest',
  HELP_ORK: 'help_ork',
  KILL_BOTH: 'kill_both',
  IGNORE_ENCOUNTER: 'ignore_encounter'
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
  'help_ork': {
    id: 'help_ork',
    title: 'Помощь орку',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Вы решаете вмешаться и помочь орку. Метким выстрелом вы раните зомби-волка, привлекая его внимание. Орк использует этот момент, чтобы нанести решающий удар.\n\nКогда существо падает, орк поворачивается к вам. Его лицо, покрытое шрамами, выражает смесь удивления и благодарности.\n\n«Человек помог Грукашу. Это редкость. Грукаш не забудет.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Спросить о кристалле',
        nextSceneId: 'ork_crystal_info'
      },
      {
        id: 'choice_1',
        text: 'Продолжить поиски артефакта',
        nextSceneId: 'artifact_found'
      }
    ]
  },
  'ork_crystal_info': {
    id: 'ork_crystal_info',
    title: 'Информация о кристалле',
    background: '/backgrounds/forest_encounter.jpg',
    text: '«Грукаш знает о светящемся камне. Грукаш видел его глубже в лесу, возле искаженного дерева. Но там опасно - воздух жжет кожу, земля меняется.»\n\nОрк указывает направление и дает вам небольшой мешочек.\n\n«Это защитит от воздуха разлома. Берегись теней - они не то, чем кажутся.»',
    choices: [
      {
        id: 'choice_0',
        text: 'Поблагодарить и отправиться к кристаллу',
        nextSceneId: 'artifact_found'
      }
    ]
  },
  'kill_both': {
    id: 'kill_both',
    title: 'Двойное убийство',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Вы решаете, что ни орк, ни волк не заслуживают жизни. Быстрыми и точными движениями вы устраняете обоих. Осмотрев тела, вы находите у орка карту с отметкой неподалеку.\n\nПохоже, он тоже искал что-то ценное в этом районе. Возможно, это поможет вам найти артефакт быстрее.',
    choices: [
      {
        id: 'choice_0',
        text: 'Использовать карту для поиска',
        nextSceneId: 'artifact_found'
      }
    ]
  },
  'ignore_encounter': {
    id: 'ignore_encounter',
    title: 'Не вмешиваться',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Вы решаете не вмешиваться в естественный ход событий. Спрятавшись за деревом, вы наблюдаете жестокую схватку. В конце концов, обе стороны серьезно ранены, но орк все же побеждает и, шатаясь, уходит в лес.\n\nКогда все стихает, вы продолжаете свой путь. Детектор показывает, что артефакт совсем близко.',
    choices: [
      {
        id: 'choice_0',
        text: 'Продолжить поиски',
        nextSceneId: 'artifact_found'
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

// Mapping между ID сцен из БД и локальными тестовыми сценами
const SCENE_DB_ID_MAPPING: Record<string, string> = {
  // ID сцены "Встреча с торговцем"
  'ks74qv6bqz04312j7qj5bw6xsd7d7cw6': 'trader_meeting',
  // ID сцены "Встреча с мастеровым"
  'ks7d3k1dgt3yrwc1gqdmagdcf17d7k4c': 'craftsman_meeting',
  // ID сцены "Дополнительное задание"
  'ks7a7s9j2yryv32nz48z7m69ds7d6rct': 'additional_task',
  // ID сцены "Поиск артефакта"
  'ks741c7a0r6qvnx0fkf92y5e557d6a07': 'artifact_task'
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
  const [sceneLoading, setSceneLoading] = useState(false);
  const [canClick, setCanClick] = useState(true);
  
  // Флаг для использования тестовых сцен, когда API недоступно
  const [useTestScenes, setUseTestScenes] = useState(true);

  // Get Convex queries and mutations
  const scene = useQuery(api.quest.getSceneByKey, { sceneKey: currentSceneKey });
  const makeSceneChoice = useMutation(api.quest.makeSceneChoice);
  
  // Инициализация сцены при монтировании
  useEffect(() => {
    // Если есть начальная сцена, загружаем ее
    if (initialSceneId) {
      console.log(`Инициализация с начальной сценой: ${initialSceneId}`);
      loadScene(initialSceneId);
    } else {
      // Если нет начальной сцены, показываем сообщение
      setError('Не указана начальная сцена. Пожалуйста, выберите сцену.');
      setSceneLoading(false);
    }
    
    // Очистка при размонтировании
    return () => {
      setCurrentScene(null);
      setCurrentSceneKey('');
    };
  }, [initialSceneId]);
  
  // Загрузка сцены
  const loadScene = async (sceneId: string) => {
    try {
      // Не показываем загрузку, если мы уже отображаем сцену с таким ID
      if (currentScene?.id === sceneId) {
        console.log(`Сцена ${sceneId} уже загружена`);
        return;
      }
      
      setError(null);
      setSceneLoading(true);
      
      console.log(`Загрузка сцены: ${sceneId}`);
      
      // 1. Проверка QR-кодов и маппинг на ID сцен
      const qrCodeMapping: Record<string, string> = {
        'grenz_npc_trader_01': 'trader_meeting',
        'grenz_npc_craftsman_01': 'craftsman_meeting',
        'grenz_loc_anomaly_01': 'anomaly_exploration'
      };
      
      let finalSceneId = sceneId;
      
      // Если это QR-код, заменяем его на ID сцены
      if (sceneId.startsWith('grenz_')) {
        const mappedId = qrCodeMapping[sceneId];
        if (mappedId) {
          console.log(`QR-код ${sceneId} соответствует сцене ${mappedId}`);
          finalSceneId = mappedId;
        } else {
          console.log(`Неизвестный QR-код: ${sceneId}`);
        }
      }
      
      // Обработка ID в формате Convex (ks...)
      if (sceneId.startsWith('ks')) {
        console.log(`Получен ID сцены в формате Convex: ${sceneId}`);
        // Для сцены с торговцем
        if (sceneId === 'ks74qv6bqz04312j7qj5bw6xsd7d7cw6') {
          console.log('Загрузка сцены с торговцем по ID');
          finalSceneId = 'trader_meeting';
        }
        // Для сцены с мастером
        else if (sceneId === 'ks7d3k1dgt3yrwc1gqdmagdcf17d7k4c') {
          console.log('Загрузка сцены с мастером по ID');
          finalSceneId = 'craftsman_meeting';
        }
        // Для сцены с аномалией
        else if (sceneId === 'ks7a7s9j2yryv32nz48z7m69ds7d6rct') {
          console.log('Загрузка сцены с аномалией по ID');
          finalSceneId = 'anomaly_exploration';
        }
      }
      
      // Обновляем текущий ключ сцены
      setCurrentSceneKey(finalSceneId);
      
      // 2. Загружаем из тестовых сцен
      if (TEST_SCENES[finalSceneId]) {
        console.log(`Найдена тестовая сцена: ${finalSceneId}`);
        setCurrentScene(TEST_SCENES[finalSceneId]);
        return;
      }
      
      // 3. Поиск по ключевым словам
      if (finalSceneId.includes('trader')) {
        console.log('Загрузка сцены для торговца');
        setCurrentScene(TEST_SCENES.trader_meeting);
        return;
      } 
      
      if (finalSceneId.includes('craft')) {
        console.log('Загрузка сцены для мастера');
        setCurrentScene(TEST_SCENES.craftsman_meeting);
        return;
      }
      
      if (finalSceneId.includes('anomaly')) {
        console.log('Загрузка сцены для аномальной зоны');
        setCurrentScene(TEST_SCENES.anomaly_exploration);
        return;
      }
      
      // 4. Если ничего не найдено, используем сцену по умолчанию
      console.warn(`Сцена ${finalSceneId} не найдена, используем сцену по умолчанию`);
      
      // Создаем сцену с правильной структурой
      const defaultScene: Scene = {
        id: 'unknown_location',
        title: 'Неизвестная локация',
        background: 'wasteland.jpg',
        text: `Здесь еще ничего не создано. Сцена "${finalSceneId}" не найдена.`,
        choices: [
          {
            id: 'choice_0',
            text: 'Вернуться к карте',
            action: 'exit_to_map'
          }
        ]
      };
      
      setCurrentScene(defaultScene);
      
    } catch (err) {
      console.error('Ошибка при загрузке сцены:', err);
      setError(`Ошибка загрузки сцены: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setSceneLoading(false);
    }
  };
  
  // Обработка выбора
  const handleChoiceSelected = async (choice: Choice) => {
    setCanClick(false);
    
    try {
      console.log("Обработка выбора:", choice);
      
      // Особая обработка для кнопки "Взять запчасти" у торговца
      if (currentScene?.id === 'trader_meeting' && choice.text.includes("Взять запчасти")) {
        console.log("Выбрано 'Взять запчасти и отправиться к Дитеру'");
        
        // Обновляем состояние квеста для перехода к мастеру
        if (questState) {
          questState.updateState("PARTS_COLLECTED");
        }
        
        // Активируем маркер мастерской
        showMarker && showMarker('craftsman');
        
        // Выход из визуальной новеллы (возврат к карте)
        onExit && onExit();
        return;
      }
      
      // Обработка ID в формате Convex
      if (choice.nextSceneId && typeof choice.nextSceneId === 'string' && choice.nextSceneId.startsWith('ks')) {
        console.log(`Распознаем ID сцены в формате Convex: ${choice.nextSceneId}`);
        
        // Для сцены с мастером
        if (choice.nextSceneId === 'ks7d3k1dgt3yrwc1gqdmagdcf17d7k4c') {
          console.log('Переход к сцене с мастером по ID');
          loadScene('craftsman_meeting');
          return;
        }
        
        // Для сцены с аномалией
        if (choice.nextSceneId === 'ks7a7s9j2yryv32nz48z7m69ds7d6rct') {
          console.log('Переход к сцене с аномалией по ID');
          loadScene('anomaly_exploration');
          return;
        }
      }
      
      // Особая обработка для кнопки "Передать запчасти" у мастера
      if (currentScene?.id === 'craftsman_meeting' && choice.text.includes("Передать запчасти")) {
        console.log("Выбрано 'Передать запчасти'");
        
        // Загружаем сцену с дополнительным заданием
        loadScene('additional_task');
        return;
      }
      
      // Обработка статистики и специальных действий
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
      
      // Обработка специальных действий
      if (choice.action) {
        switch (choice.action) {
          case ACTION.ACCEPT_ARTIFACT_QUEST:
            showMarker && showMarker('anomaly');
            questState?.updateState(QuestState.ARTIFACT_HUNT);
            console.log('Маркер аномальной зоны активирован');
            break;
            
          case ACTION.DECLINE_ARTIFACT_QUEST:
            hideMarker && hideMarker('anomaly');
            console.log('Маркер аномальной зоны скрыт');
            break;
            
          case ACTION.START_DELIVERY_QUEST:
            showMarker && showMarker('trader');
            questState?.updateState(QuestState.DELIVERY_STARTED);
            console.log('Маркер торговца активирован');
            break;
            
          case ACTION.TAKE_PARTS:
            showMarker && showMarker('craftsman');
            questState?.updateState(QuestState.PARTS_COLLECTED);
            console.log('Маркер мастерской активирован');
            break;
            
          case ACTION.RETURN_TO_CRAFTSMAN:
            questState?.updateState(QuestState.ARTIFACT_FOUND);
            break;
            
          case ACTION.COMPLETE_DELIVERY_QUEST:
            questState?.updateState(QuestState.QUEST_COMPLETION);
            break;
            
          case 'exit_to_map':
          case 'end_character_creation':
            onExit && onExit();
            return;
        }
      }
      
      // Стандартная обработка через API или локально
      if (playerId && currentScene) {
        try {
          const result = await makeSceneChoice({
            playerId: playerId as Id<"players">,
            sceneId: currentScene.id as Id<"scenes">,
            choiceIndex: parseInt(choice.id.split('_')[1])
          });
          
          // Если есть следующая сцена, загружаем её
          if (result.nextSceneId) {
            await loadScene(result.nextSceneId.toString());
          } else {
            onExit && onExit();
          }
        } catch (apiErr) {
          console.warn('Ошибка API, используем локальную навигацию:', apiErr);
          // Если API недоступно, используем локальную навигацию
          if (choice.nextSceneId) {
            await loadScene(choice.nextSceneId.toString());
          } else {
            onExit && onExit();
          }
        }
      } 
      // Если нет playerId, используем только локальную навигацию
      else if (choice.nextSceneId) {
        await loadScene(choice.nextSceneId.toString());
      } else {
        onExit && onExit();
      }
    } catch (err) {
      console.error('Ошибка при обработке выбора:', err);
      setError(`Ошибка обработки выбора: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setSceneLoading(false);
      setCanClick(true);
    }
  };
  
  // Проверка загрузки сцены
  useEffect(() => {
    if (currentScene) {
      console.log("Сцена загружена и готова к отображению:", currentScene);
    }
  }, [currentScene]);

  // Функция для обработки пути к изображению
  const getImagePath = (path: string | undefined) => {
    if (!path) return '';
    
    // Особый случай для торговца - используем конкретное имя файла
    if (path.includes('trader_camp')) {
      return 'backgrounds/trader_camp.png';
    }
    
    // Для других сцен
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Возвращаем путь
    return path;
  };

  // Определяем, какой фон использовать для сцены
  const getBackgroundStyle = () => {
    if (!currentScene) return {};
    
    console.log("Подготовка стиля фона для сцены:", currentScene.id);
    
    // Для сцены торговца используем прямой путь
    if (currentScene.id === 'trader_meeting' || currentSceneKey === 'trader_meeting') {
      console.log("Устанавливаем фон для торговца:", `/backgrounds/trader_camp.png`);
      return {
        backgroundImage: `url(/backgrounds/trader_camp.png)`,
        backgroundColor: '#352e4a', // Фиолетовый фон как запасной вариант
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    // Для остальных сцен
    const bgPath = getImagePath(currentScene.background);
    console.log("Путь к фону для сцены:", bgPath);
    
    return {
      backgroundImage: bgPath ? `url(/${bgPath})` : 'none',
      backgroundColor: '#352e4a', // Фиолетовый фон как запасной вариант
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  // Основной рендер
  return (
    <div className="visual-novel">
      {sceneLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка сцены...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => onExit && onExit()}>Вернуться к карте</button>
        </div>
      ) : currentScene ? (
        <>
          {/* Фон */}
          <div 
            className="scene-background" 
            style={getBackgroundStyle()}
          >
            <div className="background-overlay"></div>
          </div>
            
          {/* Контейнер для содержимого */}
          <div className="scene-content">
            {/* Персонаж */}
            {currentScene.character && (
              <div className={`character ${currentScene.character.position || 'center'}`}>
                <img src={`/${getImagePath(currentScene.character.image)}`} alt={currentScene.character.name} />
              </div>
            )}
            
            {/* Панель диалога */}
            <div className="dialog-box">
              <h2 className="scene-title">{currentScene.title || 'Неизвестная сцена'}</h2>
              <div className="dialog-text">{currentScene.text || 'Текст сцены отсутствует'}</div>
              
              {/* Выборы */}
              {currentScene.choices && currentScene.choices.length > 0 ? (
                <div className="choices-container">
                  {currentScene.choices.map((choice, index) => (
                    <button
                      key={choice.id || `choice_${index}`}
                      className="choice-button"
                      onClick={() => handleChoiceSelected(choice)}
                      disabled={!canClick}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="choices-container">
                  <button
                    className="choice-button"
                    onClick={() => onExit && onExit()}
                  >
                    Вернуться к карте
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Отладочная информация */}
          {import.meta.env.DEV && (
            <div className="debug-info">
              <p>Текущая сцена: {currentScene.id}</p>
              <p>Ключ сцены: {currentSceneKey}</p>
              <p>Путь к фону: {currentScene.background}</p>
              <p>Исправленный путь: /{getImagePath(currentScene.background)}</p>
              <p>Состояние квеста: {questState?.currentState}</p>
              <button 
                onClick={() => console.log("Текущая сцена:", currentScene)} 
                className="debug-button"
              >
                Логировать сцену
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="error-container">
          <p>Сцена не загружена. Пожалуйста, попробуйте еще раз.</p>
          <button onClick={() => onExit && onExit()}>Вернуться к карте</button>
        </div>
      )}
    </div>
  );
};