// Диалоги для квеста "Доставка и дилемма"
// Интеграция с visual novel системой

export const deliveryQuestDialogs = [
  // ===================== СТАРТОВЫЙ ДИАЛОГ КВЕСТА =====================
  {
    _id: 'quest_start_dialog',
    dialogKey: 'quest_start_dialog',
    title: 'Шанс для новичка',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          '«Смотри сюда, — Ганс тычет пальцем в экран твоего КПК, — Я только что переслал тебе метку. Есть работа для такого, как ты. Не пыльная, но и не прогулка по парку. Нужно забрать кое-какие запчасти у одного старого торговца на окраине, в районе Старых складов, и отнести их мастеровому по имени Дитер в Промзону Артисанов. Оплата хорошая, но у Дитера горит проект, так что времени мало. Как раз проверим, на что ты годишься. Согласен?»',
        speakerKey: 'Ганс, боец FJR',
        choices: [
          {
            text: 'Я в деле. Спасибо за шанс.',
            nextNodeKey: 'quest_accepted',
            action: 'start_delivery_quest',
            eventOutcomeKey: 'accept_delivery_quest',
          },
          {
            text: 'Мне нужно сперва осмотреться. Я не готов.',
            nextNodeKey: 'quest_declined',
            action: 'decline_delivery_quest',
            eventOutcomeKey: 'decline_delivery_quest',
          },
        ],
      },
      quest_accepted: {
        text:
          '«Вот и славно. Торговца зовут Элиас, найдёшь его по вывеске с ржавым якорем. Покажешь ему этот код — он поймёт, от кого ты. И да, будь осторожен на окраинах. Там патрули FJR ходят реже. Время пошло!»',
        speakerKey: 'Ганс, боец FJR',
        choices: [
          { text: 'Понял. Выдвигаюсь.', nextNodeKey: null },
        ],
      },
      quest_declined: {
        text:
          '«Твоё дело. Но помни, во Фрайбурге репутация — валюта. И такие возможности долго не ждут. Удачи, она тебе понадобится.»',
        speakerKey: 'Ганс, боец FJR',
        choices: [
          { text: 'Я буду иметь в виду.', nextNodeKey: null },
        ],
      },
    },
    backgroundImage: '/images/backgrounds/freiburg_station.jpg',
    updatedAt: Date.now(),
  },

  // ===================== ВСТРЕЧА С ТОРГОВЦЕМ =====================
  {
    _id: 'trader_meeting_dialog',
    dialogKey: 'trader_meeting_dialog',
    title: 'Встреча с торговцем',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: 'Вы находите временный лагерь торговца на окраине города. Среди разбросанного товара и ящиков стоит пожилой мужчина с седой бородой.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Подойти к торговцу',
            nextNodeKey: 'trader_greeting'
          }
        ]
      },
      trader_greeting: {
        text: '«А, ты за запчастями от Дитера? Хорошо, что пришел. У меня как раз есть то, что ему нужно. Но сначала скажи - ты надежный человек?»',
        speakerKey: 'Торговец',
        choices: [
          {
            text: 'Можете на меня положиться',
            nextNodeKey: 'trader_trust'
          },
          {
            text: 'Просто дайте запчасти',
            nextNodeKey: 'trader_business'
          }
        ]
      },
      trader_trust: {
        text: '«Хорошо. Дитер - старый друг, и я не хочу, чтобы с его заказом что-то случилось. Вот запчасти. Береги их как зеницу ока.»',
        speakerKey: 'Торговец',
        choices: [
          {
            text: 'Взять запчасти и отправиться к Дитеру',
            nextNodeKey: 'parts_received',
            action: 'take_parts',
            eventOutcomeKey: 'parts_collected'
          }
        ]
      },
      trader_business: {
        text: '«Деловой подход, мне нравится. Вот твои запчасти. Только смотри, не потеряй - Дитер будет очень недоволен.»',
        speakerKey: 'Торговец',
        choices: [
          {
            text: 'Взять запчасти и отправиться к Дитеру',
            nextNodeKey: 'parts_received',
            action: 'take_parts',
            eventOutcomeKey: 'parts_collected'
          }
        ]
      },
      parts_received: {
        text: 'Вы получили запчасти от торговца. Теперь нужно доставить их Дитеру в центральную мастерскую.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отправиться к мастерской',
            nextNodeKey: null // Завершает диалог
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/trader_camp.png',
    updatedAt: Date.now()
  },

  // ===================== ВСТРЕЧА С МАСТЕРОВЫМ =====================
  {
    _id: 'craftsman_meeting_dialog',
    dialogKey: 'craftsman_meeting_dialog',
    title: 'Встреча с мастеровым Дитером',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: 'В центральной мастерской города вы находите Дитера - крепкого мужчину средних лет, покрытого машинным маслом и сажей. Он поднимает голову от верстака.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Подойти к Дитеру',
            nextNodeKey: 'craftsman_greeting'
          }
        ]
      },
      craftsman_greeting: {
        text: '«О, наконец-то! Я уже думал, что торговец меня подвел. У тебя есть запчасти?»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Передать запчасти',
            nextNodeKey: 'parts_delivered',
            action: 'deliver_parts',
            eventOutcomeKey: 'deliver_parts_to_craftsman'
          }
        ]
      },
      parts_delivered: {
        text: 'Дитер принимает запчасти и внимательно их осматривает. «Отлично! Именно то, что мне нужно. Но знаешь что... есть ещё одно дело, если ты не против подзаработать.»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Что нужно сделать?',
            nextNodeKey: 'additional_task'
          }
        ]
      },
      additional_task: {
        text: '«Недалеко отсюда активировался разлом. Там должен быть кристалл чистой энергии. Если принесешь его мне, заплачу в два раза больше. Но это опасно - там могут быть мутанты.»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Взяться за задание',
            nextNodeKey: 'accept_artifact_quest',
            action: 'accept_artifact_quest',
            eventOutcomeKey: 'accept_artifact_quest'
          },
          {
            text: 'Отказаться',
            nextNodeKey: 'decline_artifact_quest',
            action: 'decline_artifact_quest',
            eventOutcomeKey: 'decline_artifact_quest'
          }
        ]
      },
      accept_artifact_quest: {
        text: '«Отлично! Разлом находится в лесу к северу от города. Будь осторожен и возвращайся живым.»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Отправиться к аномальной зоне',
            nextNodeKey: 'quest_updated'
          }
        ]
      },
      decline_artifact_quest: {
        text: '«Понимаю, не каждый готов рисковать. Вот твоя оплата за доставку. Спасибо за работу.»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Завершить задание',
            nextNodeKey: 'quest_complete',
            action: 'complete_delivery_quest',
            eventOutcomeKey: 'complete_delivery_quest'
          }
        ]
      },
      quest_updated: {
        text: 'Квест обновлен! Теперь вам нужно найти аномальную зону и добыть кристалл энергии.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отправиться к аномальной зоне',
            nextNodeKey: null // Завершает диалог
          }
        ]
      },
      quest_complete: {
        text: 'Квест завершен! Вы получили оплату за доставку запчастей.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отлично!',
            nextNodeKey: null // Завершает диалог
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/workshop.jpg',
    updatedAt: Date.now()
  },

  // ===================== ИССЛЕДОВАНИЕ АНОМАЛЬНОЙ ЗОНЫ =====================
  {
    _id: 'anomaly_exploration_dialog',
    dialogKey: 'anomaly_exploration_dialog',
    title: 'Аномальная зона',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: 'Вы прибыли в указанное Дитером место. Воздух здесь странно искажается, а деревья выглядят неестественно. Это определенно аномальная зона.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Осмотреться в поисках артефакта',
            nextNodeKey: 'search_artifact'
          }
        ]
      },
      search_artifact: {
        text: 'Внезапно вы замечаете в лесной чаще странную сцену: орк-воин в потрепанной броне отбивается от зомбированного волка. Оба выглядят измотанными.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Помочь орку убить волка',
            nextNodeKey: 'help_ork',
            action: 'help_ork'
          },
          {
            text: 'Убить и орка, и волка',
            nextNodeKey: 'kill_both',
            action: 'kill_both'
          },
          {
            text: 'Не вмешиваться и продолжить поиск',
            nextNodeKey: 'ignore_encounter',
            action: 'ignore_encounter'
          }
        ]
      },
      help_ork: {
        text: 'Вы вступаете в бой на стороне орка. Вместе вам удается одолеть зомбированного волка. Орк благодарно кивает. «Даг\'ар благодарен, человек. Возьми это - поможет найти то, что ищешь.» Он протягивает вам странный прибор.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Поблагодарить и продолжить поиск',
            nextNodeKey: 'find_artifact_with_help',
            action: 'continue_after_ork_help'
          }
        ]
      },
      kill_both: {
        text: 'Вы решаете избавиться от обеих угроз. После жестокой схватки оба противника мертвы. Обыскивая тела, вы находите несколько ценных вещей, включая карту с отметками аномальных зон.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Продолжить поиск с новой информацией',
            nextNodeKey: 'find_artifact_with_loot',
            action: 'continue_after_kill_both'
          }
        ]
      },
      ignore_encounter: {
        text: 'Вы решаете не вмешиваться в чужую схватку и обходите место боя стороной. Вскоре ваше чутье приводит вас к небольшой расщелине, излучающей странное свечение.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Исследовать расщелину',
            nextNodeKey: 'find_artifact_alone',
            action: 'continue_search'
          }
        ]
      },
      find_artifact_with_help: {
        text: 'Благодаря детектору аномалий от орка, вы быстро находите источник энергии - кристалл чистой энергии, пульсирующий голубым светом.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Взять кристалл и вернуться к Дитеру',
            nextNodeKey: 'artifact_found',
            action: 'return_to_craftsman',
            eventOutcomeKey: 'return_to_craftsman'
          }
        ]
      },
      find_artifact_with_loot: {
        text: 'Используя найденную карту, вы легко обнаруживаете кристалл энергии в скрытой пещере. Дополнительные трофеи делают эту находку еще более ценной.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Взять кристалл и вернуться к Дитеру',
            nextNodeKey: 'artifact_found',
            action: 'return_to_craftsman',
            eventOutcomeKey: 'return_to_craftsman'
          }
        ]
      },
      find_artifact_alone: {
        text: 'После тщательных поисков вы обнаруживаете то, что искали — кристалл чистой энергии, спрятанный в расщелине. Его добыча потребовала времени, но результат того стоил.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Взять кристалл и вернуться к Дитеру',
            nextNodeKey: 'artifact_found',
            action: 'return_to_craftsman',
            eventOutcomeKey: 'return_to_craftsman'
          }
        ]
      },
      artifact_found: {
        text: 'Кристалл энергии у вас в руках! Теперь нужно вернуться к Дитеру и получить обещанную награду.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Вернуться к Дитеру',
            nextNodeKey: null // Завершает диалог
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/anomaly.jpg',
    updatedAt: Date.now()
  },

  // ===================== ЗАВЕРШЕНИЕ КВЕСТА С АРТЕФАКТОМ =====================
  {
    _id: 'quest_complete_with_artifact_dialog',
    dialogKey: 'quest_complete_with_artifact_dialog',
    title: 'Возвращение к Дитеру',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: 'Дитер внимательно изучает принесенный вами кристалл энергии. Его глаза загораются от восхищения.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Передать кристалл',
            nextNodeKey: 'final_reward'
          }
        ]
      },
      final_reward: {
        text: '«Впечатляет! Этот кристалл стоит целое состояние. Ты превзошел мои ожидания. Держи оплату - ты заслужил каждый кредит. И еще... возьми это как бонус.»',
        speakerKey: 'Дитер',
        choices: [
          {
            text: 'Завершить задание',
            nextNodeKey: 'quest_complete',
            action: 'complete_delivery_quest_with_artifact',
            eventOutcomeKey: 'complete_delivery_quest_with_artifact'
          }
        ]
      },
      quest_complete: {
        text: 'Квест "Доставка и дилемма" завершен! Вы получили щедрую награду за доставку запчастей и добычу артефакта. Дитер остался очень доволен вашей работой.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Превосходно!',
            nextNodeKey: null // Завершает диалог
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/workshop.jpg',
    updatedAt: Date.now()
  }
];
