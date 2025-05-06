/**
 * Local scene registry as fallback when server data is unavailable
 */
import { SceneData, SceneRegistry } from './types';
import { QuestActionEnum } from '../quest/types';

/**
 * Registry of local scenes for fallback and offline mode
 */
export const LOCAL_SCENES: SceneRegistry = {
  // Sample scenes
  'trader_meeting': {
    id: 'trader_meeting',
    title: 'Встреча с торговцем',
    background: '/backgrounds/trader_camp.jpg',
    text: 'Вы находите временный лагерь на окраине города, где торговец в широкополой шляпе сортирует свои товары. Завидев вас, он поднимает взгляд.\n\n«А, ты за запчастями от Дитера? Вот, забирай, всё здесь. Только береги, их трудно добыть. И передай Дитеру, что в следующий раз пусть платит больше, или товар пойдёт в другие руки.»',
    choices: [
      {
        id: 'take_parts',
        text: 'Взять запчасти и отправиться к Дитеру',
        action: QuestActionEnum.TAKE_PARTS,
        nextSceneId: 'craftsman_meeting'
      },
      {
        id: 'ask_inventory',
        text: 'Что у тебя есть на продажу?',
        nextSceneId: 'trader_shop'
      }
    ],
    onEnterActions: []
  },
  
  'craftsman_meeting': {
    id: 'craftsman_meeting',
    title: 'Встреча с мастеровым',
    background: '/backgrounds/workshop.jpg',
    text: 'В центральной мастерской города вы находите Дитера — пожилого мастерового с седыми усами, склонившегося над верстаком. Увидев вас с запчастями, он оживляется.\n\n«О, наконец-то! Я уже думал, эти детали никогда не придут. Молодец, сталкер, быстро справился.»',
    choices: [
      {
        id: 'deliver_parts',
        text: 'Передать запчасти',
        nextSceneId: 'additional_task'
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
        id: 'what_to_do',
        text: 'Что нужно сделать?',
        nextSceneId: 'artifact_task'
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
        id: 'accept_task',
        text: 'Взяться за задание',
        action: QuestActionEnum.ACCEPT_ARTIFACT_QUEST,
        nextSceneId: 'artifact_area'
      },
      {
        id: 'decline_task',
        text: 'Отказаться',
        action: QuestActionEnum.DECLINE_ARTIFACT_QUEST,
        nextSceneId: 'quest_complete'
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
        id: 'search',
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
        id: 'help_ork',
        text: 'Помочь орку убить волка',
        nextSceneId: 'help_ork',
        action: QuestActionEnum.HELP_ORK
      },
      {
        id: 'kill_both',
        text: 'Убить и орка, и волка',
        nextSceneId: 'kill_both',
        action: QuestActionEnum.KILL_BOTH
      },
      {
        id: 'ignore',
        text: 'Не вмешиваться и продолжить поиск',
        nextSceneId: 'ignore_encounter',
        action: QuestActionEnum.IGNORE_ENCOUNTER
      }
    ]
  },
  
  'help_ork': {
    id: 'help_ork',
    title: 'Помощь орку',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Вы вступаете в бой, помогая орку одолеть зомбированного волка. Когда с чудовищем покончено, орк благодарно кивает вам.\n\n«Даг\'ар благодарен. Ты не похож на других людей. Возьми это — поможет найти то, что ищешь.»\n\nОрк передает вам странный прибор, похожий на компас, но стрелка которого реагирует на энергетические всплески.',
    choices: [
      {
        id: 'continue',
        text: 'Поблагодарить и продолжить поиск',
        nextSceneId: 'artifact_found',
        action: 'continue_after_ork_help'
      }
    ],
    statChanges: {
      willpower: 1
    }
  },
  
  'kill_both': {
    id: 'kill_both',
    title: 'Двойное убийство',
    background: '/backgrounds/forest_encounter.jpg',
    text: 'Вы решаете избавиться от обоих существ. Сначала расправляетесь с ослабленным волком, а затем атакуете уже раненого орка, который не ожидал удара от вас. После боя вы обыскиваете тела и находите несколько ценных вещей, включая карту, на которой отмечено местонахождение артефактов в этой области.',
    choices: [
      {
        id: 'continue',
        text: 'Продолжить поиск с новой информацией',
        nextSceneId: 'artifact_found',
        action: 'continue_after_kill_both'
      }
    ],
    statChanges: {
      corruption: 2
    }
  },
  
  'ignore_encounter': {
    id: 'ignore_encounter',
    title: 'Продолжение поиска',
    background: '/backgrounds/anomaly.jpg',
    text: 'Вы решаете не вмешиваться в бой и обходите сцену стороной, продолжая поиск артефакта. Вскоре чутье приводит вас к небольшой расщелине, из которой исходит странное свечение.',
    choices: [
      {
        id: 'continue',
        text: 'Исследовать расщелину',
        nextSceneId: 'artifact_found',
        action: 'continue_search'
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
        id: 'return',
        text: 'Вернуться к Дитеру',
        nextSceneId: 'quest_complete',
        action: QuestActionEnum.RETURN_TO_CRAFTSMAN
      }
    ],
    onEnterActions: ['FIND_ARTIFACT']
  },
  
  'quest_complete': {
    id: 'quest_complete',
    title: 'Задание выполнено',
    background: '/backgrounds/workshop.jpg',
    text: 'Дитер внимательно изучает принесенный вами кристалл, и его глаза загораются от восторга.\n\n«Впечатляет! Ты оправдал моё доверие. Держи оплату и запомни: всегда думай дважды, прежде чем вмешиваться в дела разломов. Это может стоить дороже, чем кажется.»\n\nВы получаете обещанную награду и чувствуете, что приобрели ценного союзника в лице мастерового.',
    choices: [
      {
        id: 'complete',
        text: 'Завершить задание',
        action: QuestActionEnum.COMPLETE_DELIVERY_QUEST
      }
    ],
    isEnding: true
  },
}; 