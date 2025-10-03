import type { Scene } from '../model/types'

/**
 * Сценарии визуальной новеллы для пролога игры
 * 
 * Особенности пролога для Рационалиста:
 * - МЫСЛЬ (4): ЛОГИКА, ТЕХНОФИЛ, ЭНЦИКЛОПЕДИЯ
 * - ТЕЛО (2): РЕФЛЕКСЫ, ВОСПРИЯТИЕ  
 * - ПСИХЕ (1): ИНТУИЦИЯ (слабый голос)
 * - СОЦИУМ (1): АВТОРИТЕТ, ЭМПАТИЯ (почти не работают)
 */
export const scenarios: Record<string, Scene> = {
  // =====================================
  // ПРОЛОГ: НЕУМОЛЧНАЯ ЖАЛОБА
  // =====================================
  
  /**
   * 1. Начало пролога - тамбур поезда
   */
  prologue_start: {
    id: 'prologue_start',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        text: 'Тамбур. Ржавчина. Скрежет колёс. Вы стоите у мутного окна, докуривая последнюю сигарету.' 
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Неумолчная жалоба поезда. За окном — жёлтые, больные деревья. Конец пути. Или начало того же самого. Мысли путаются. Нужно чем-то занять руки, голову...' 
      },
    ],
    choices: [
      { 
        id: 'look_window', 
        text: 'Посмотреть в окно', 
        nextScene: 'prologue_memory_window',
        effects: {
          immediate: [],
          flags: [{ key: 'resume_to_last', value: true }]
        }
      },
      { 
        id: 'check_pockets', 
        text: 'Пошарить по карманам', 
        nextScene: 'prologue_check_pockets' 
      },
      { 
        id: 'look_around', 
        text: 'Осмотреться', 
        nextScene: 'prologue_companions',
        effects: {
          immediate: [],
          flags: [{ key: 'resume_to_last', value: true }]
        }
      },
    ],
  },

  /**
   * 2. Обнаружение посылки - активное проявление ЛОГИКИ
   */
  prologue_check_pockets: {
    id: 'prologue_check_pockets',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Вы машинально хлопаете себя по карманам старого плаща. Привычка выжившего — проверять, всё ли на месте.' 
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Дешёвая зажигалка. Работает через раз, но работает. Несколько мятых энергокредитов.' 
      },
      { 
        speaker: 'ЛОГИКА', 
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Этого не хватит и на трое суток в Фрайбурге. Первый же заработок — критически важен. Любой груз — потенциальный капитал. Сохраняй хладнокровие.',
        emotion: { primary: 'neutral', intensity: 80 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Ржавый мультитул. Рука сама собой проскальзывает глубже, в потайной карман на подкладке. Там... что-то твёрдое. Тяжёлое.' 
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Посылка.' 
      },
    ],
    choices: [
      { 
        id: 'examine_package', 
        text: 'Внимательно осмотреть упаковку', 
        nextScene: 'prologue_examine_package',
        effects: {
          immediate: [],
          flags: [{ key: 'has_package', value: true }]
        }
      },
      { 
        id: 'remember_order', 
        text: 'Вспомнить, как получил заказ', 
        nextScene: 'prologue_memory_order',
        effects: {
          immediate: [],
          flags: [{ key: 'has_package', value: true }]
        }
      },
      { 
        id: 'put_away', 
        text: 'Убрать посылку и забыть', 
        nextScene: 'prologue_train_stop',
        effects: {
          immediate: [],
          flags: [
            { key: 'has_package', value: true },
            { key: 'prologue_kept_sealed', value: true }
          ]
        }
      },
    ],
  },

  /**
   * 3. Осмотр посылки - проверка сильных навыков (Рационалист)
   */
  prologue_examine_package: {
    id: 'prologue_examine_package',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Вы вертите в руках портсигар. Празднично обёрнут чёрной шёлковой лентой. Место узла залито тёмно-синим воском. Печать.' 
      },
      { 
        speaker: 'ВОСПРИЯТИЕ', 
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Вес... не сходится. Слишком тяжёлый для простого портсигара. Внутри что-то плотное и, вероятно, экранированное.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      { 
        speaker: 'ИНТУИЦИЯ', 
        text: '(Едва слышный шепот: «Не смотри ему в глаза... Ой, это вещь. Оно не живое... но и не мертвое...»)',
        emotion: { primary: 'confused', intensity: 30 }
      },
      { 
        speaker: 'ТЕХНОФИЛ', 
        text: '[ПАРАМЕТР: МЫСЛЬ/ТЕХНОФИЛ (Успех)] Восковая печать от ИИ? Анахронизм. Умышленная маскировка под старину. Зачем скрывать технологическую природу груза?',
        emotion: { primary: 'neutral', intensity: 75 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'На печати выдавлены два латинских слова.' 
      },
    ],
    choices: [
      { 
        id: 'read_seal', 
        text: 'Попытаться прочесть надпись', 
        nextScene: 'prologue_read_seal' 
      },
      { 
        id: 'shake_guess_logic', 
        text: '[ЛОГИКА] Потрясти портсигар, пытаясь логически угадать содержимое (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '🧠',
          tooltip: 'Требуется ЛОГИКА 3+'
        },
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 7,
            successText: 'Вы успешно определили природу содержимого!',
            failureText: 'Переменных слишком много...',
          }
        },
        effects: {
          onSuccess: { nextScene: 'prologue_deduce_logic' },
          onFailure: { nextScene: 'prologue_deduce_failure' }
        }
      },
      { 
        id: 'pry_seal_tech', 
        text: '[ТЕХНОФИЛ] Попытаться поддеть печать аккуратно, чтобы сохранить воск (Сложность 9)',
        presentation: {
          color: 'skill',
          icon: '🔧',
          tooltip: 'Требуется ТЕХНОФИЛ 3+'
        },
        availability: {
          skillCheck: {
            skill: 'technophile',
            difficulty: 9,
            successText: 'Печать аккуратно снята!',
            failureText: 'Воск раскрошился...',
          }
        },
        effects: {
          onSuccess: { nextScene: 'prologue_open_package_success' },
          onFailure: { nextScene: 'prologue_open_package_failure' }
        }
      },
      { 
        id: 'pry_seal_brute', 
        text: '[СИЛА] Взломать печать, сорвав ленту (Сложность 15)',
        presentation: {
          color: 'negative',
          icon: '💪',
          tooltip: 'Очень сложно для вашей СИЛЫ'
        },
        availability: {
          skillCheck: {
            skill: 'strength',
            difficulty: 15,
            failureText: 'Вы слишком слабы для грубой силы...',
          }
        },
        effects: {
          onFailure: { nextScene: 'prologue_open_package_brute_failure' }
        }
      },
    ],
  },

  /**
   * 4. Чтение печати - активный бросок на ЛОГИКУ
   */
  prologue_read_seal: {
    id: 'prologue_read_seal',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Вы подносите печать ближе к тусклому свету из окна. "Acta, non verba".' 
      },
      { 
        speaker: 'ЭНЦИКЛОПЕДИЯ', 
        text: '[ПАРАМЕТР: МЫСЛЬ/ЭНЦИКЛОПЕДИЯ (Успех)] Древняя латынь. "Дела, а не слова". Классическая сентенция.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      { 
        speaker: 'ПАРАНОЙЯ', 
        text: 'Это угроза. Намеренно неясный приказ. Они будут отрицать свою причастность. Мы — расходный материал.',
        emotion: { primary: 'worried', intensity: 65 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Дела, а не слова. Заказчик был немногословен. И щедр. Билет до Фрайбурга — целое состояние. За что?' 
      },
    ],
    choices: [
      { 
        id: 'deduce_content', 
        text: '[ЛОГИКА] Провести дедукцию: кому выгоден этот шифр? (Сложность 7)',
        presentation: {
          color: 'skill',
          icon: '🧠',
          tooltip: 'Требуется ЛОГИКА 3+'
        },
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 7,
            successText: 'Логическая цепочка выстроена!',
            failureText: 'Слишком много переменных...',
          },
          conditions: [
            { type: 'skill', skill: 'logic', minLevel: 3 }
          ]
        },
        effects: {
          onSuccess: { nextScene: 'prologue_deduce_logic' },
          onFailure: { nextScene: 'prologue_deduce_failure' }
        }
      },
      { 
        id: 'trust_gut', 
        text: '[ИНТУИЦИЯ] Довериться чутью, что это за предмет (Сложность 15)',
        presentation: {
          color: 'mysterious',
          icon: '✨',
          tooltip: 'Почти невозможно с вашей слабой интуицией'
        },
        availability: {
          skillCheck: {
            skill: 'intuition',
            difficulty: 15,
            failureText: 'Чутьё вас подводит...',
          }
        },
        effects: {
          onFailure: { nextScene: 'prologue_deduce_failure_intuition' }
        }
      },
      { 
        id: 'stop_guess', 
        text: 'Перестать гадать. Важен только пункт назначения.', 
        nextScene: 'prologue_train_stop' 
      },
    ],
  },

  /**
   * 5. Успех ЛОГИКИ - дополнительная информация
   */
  prologue_deduce_logic: {
    id: 'prologue_deduce_logic',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'ЛОГИКА', 
        text: '[КРИТИЧЕСКИЙ УСПЕХ ЛОГИКИ] Если груз тяжёлый и экранированный, он либо радиоактивен (нелогично для курьера), либо содержит высокотехнологичную электронику, которую нельзя сканировать. "Дела, а не слова" – это отказ от пафоса и бюрократии FJR. Заказчик, вероятно, связан с **Артисанами** или **Синтезом**.',
        emotion: { primary: 'determined', intensity: 85 }
      },
      { 
        speaker: 'ТЕХНОФИЛ', 
        text: 'Экранированная электроника! Это может быть прототип. Если вскрыть его, мы потеряем гарантию, но получим доступ к неизвестной технологии!',
        emotion: { primary: 'excited', intensity: 75 }
      },
    ],
    nextScene: 'prologue_deduce',
  },

  /**
   * 6. Провал ЛОГИКИ
   */
  prologue_deduce_failure: {
    id: 'prologue_deduce_failure',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'ЛОГИКА', 
        text: '[ПРОВАЛ] Переменных слишком много. Это может быть что угодно: от золотого слитка до сжатого газа. Анализ невозможен без вскрытия.',
        emotion: { primary: 'confused', intensity: 50 }
      },
      { 
        speaker: 'ЦИНИЗМ', 
        text: 'Ну вот. Всю жизнь учился, а портсигар открыть не можешь.',
        emotion: { primary: 'sad', intensity: 40 }
      },
    ],
    nextScene: 'prologue_deduce',
  },

  /**
   * Промежуточная сцена перед решением
   */
  prologue_deduce: {
    id: 'prologue_deduce',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Теперь вы знаете чуть больше. Или думаете, что знаете. Но решение остаётся за вами.' 
      },
    ],
    choices: [
      { 
        id: 'continue_journey', 
        text: 'Продолжить путешествие с нераспечатанной посылкой', 
        nextScene: 'prologue_train_stop' 
      },
      { 
        id: 'try_open', 
        text: 'Попробовать вскрыть печать', 
        nextScene: 'prologue_examine_package' 
      },
    ],
  },

  /**
   * Временная заглушка для других веток
   */
  prologue_memory_window: {
    id: 'prologue_memory_window',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке]' 
      },
    ],
    choices: [
      { 
        id: 'back', 
        text: 'Вернуться', 
        nextScene: 'prologue_start' 
      },
    ],
  },

  prologue_companions: {
    id: 'prologue_companions',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке]' 
      },
    ],
    choices: [
      { 
        id: 'back', 
        text: 'Вернуться', 
        nextScene: 'prologue_start' 
      },
    ],
  },

  prologue_memory_order: {
    id: 'prologue_memory_order',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке]' 
      },
    ],
    choices: [
      { 
        id: 'continue', 
        text: 'Продолжить', 
        nextScene: 'prologue_train_stop' 
      },
    ],
  },

  prologue_open_package_success: {
    id: 'prologue_open_package_success',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке - успешное вскрытие]' 
      },
    ],
    choices: [
      { 
        id: 'continue', 
        text: 'Продолжить', 
        nextScene: 'prologue_train_stop' 
      },
    ],
  },

  prologue_open_package_failure: {
    id: 'prologue_open_package_failure',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке - провал вскрытия]' 
      },
    ],
    choices: [
      { 
        id: 'continue', 
        text: 'Продолжить', 
        nextScene: 'prologue_train_stop' 
      },
    ],
  },

  prologue_open_package_brute_failure: {
    id: 'prologue_open_package_brute_failure',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Вы пытаетесь сорвать ленту грубой силой, но ваши тощие пальцы (СИЛА 1) едва цепляются за шёлк. Печать остаётся нетронутой.' 
      },
      { 
        speaker: 'ЛОГИКА', 
        text: 'Предсказуемо. Физическая сила — не наш метод. Используй интеллект.',
        emotion: { primary: 'neutral', intensity: 60 }
      },
    ],
    nextScene: 'prologue_examine_package',
  },

  prologue_deduce_failure_intuition: {
    id: 'prologue_deduce_failure_intuition',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'ИНТУИЦИЯ', 
        text: '(Едва слышно) ...металл... холод... нет, тепло? Я не знаю...',
        emotion: { primary: 'confused', intensity: 20 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Ваша интуиция молчит. Или вы просто не умеете её слушать.' 
      },
    ],
    nextScene: 'prologue_deduce',
  },

  /**
   * Остановка поезда - переход к главе 1
   */
  prologue_train_stop: {
    id: 'prologue_train_stop',
    background: '/images/backgrounds/train.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Поезд начинает сбрасывать скорость. Визг тормозов. Вибрация по всему телу.' 
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Фрайбург. Конечная остановка.' 
      },
    ],
    choices: [
      { 
        id: 'arrival', 
        text: 'Выйти на платформу', 
        nextScene: 'arrival_sensory_overload',
        effects: {
          immediate: [],
          flags: [{ key: 'prologue_completed', value: true }]
        }
      },
    ],
  },

  // =====================================
  // ГЛАВА 1: ПРИБЫТИЕ В ФРАЙБУРГ
  // =====================================

  /**
   * 7. Взрыв ощущений на станции
   */
  arrival_sensory_overload: {
    id: 'arrival_sensory_overload',
    background: '/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'И вот, наконец, гул. Живой, человеческий, машинный. Вы делаете шаг на скользкую платформу, и мир взрывается.' 
      },
      { 
        speaker: 'ВОСПРИЯТИЕ', 
        text: '[ПАРАМЕТР: ПСИХЕ/ВОСПРИЯТИЕ (Успех)] Жареный лук. Невозможно! Запах настоящей, горячей еды! Но за ним — озон и едкий запах гниения. Активирована система фильтрации воздуха. Уровень загрязнения ниже ожидаемого.',
        emotion: { primary: 'surprised', intensity: 75 }
      },
      { 
        speaker: 'РЕФЛЕКСЫ', 
        text: '[ПАРАМЕТР: ТЕЛО/РЕФЛЕКСЫ (Успех)] Слишком много движения. Слева. Справа. Мозг успевает отследить критические траектории. Держи равновесие.',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'После недель пути по мёртвым землям, станция Фрайбурга — это лихорадочно бьющееся сердце. Хаос. Деятельный, почти радостный.' 
      },
    ],
    choices: [
      { 
        id: 'overwhelmed', 
        text: 'Опешить от количества людей', 
        nextScene: 'arrival_overwhelmed' 
      },
      { 
        id: 'push_forward_force', 
        text: '[СИЛА] Попытаться пробиться вперёд, расталкивая толпу (Сложность 12)',
        presentation: {
          color: 'negative',
          icon: '💪',
          tooltip: 'Слишком сложно для вашей СИЛЫ'
        },
        availability: {
          skillCheck: {
            skill: 'strength',
            difficulty: 12,
            failureText: 'Вы слишком слабы...',
          }
        },
        effects: {
          onSuccess: { nextScene: 'arrival_push_forward_success' },
          onFailure: { nextScene: 'arrival_push_forward_failure_rationalist' }
        }
      },
      { 
        id: 'observe_logic', 
        text: '[ЛОГИКА] Отступить и попытаться понять структуру движения', 
        nextScene: 'arrival_observe_logic' 
      },
    ],
  },

  /**
   * Провал СИЛЫ - высмеивание низкого навыка
   */
  arrival_push_forward_failure_rationalist: {
    id: 'arrival_push_forward_failure_rationalist',
    background: '/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Вы пытаетесь грубо растолкать толпу, но ваш тощий корпус (СИЛА 1) едва ощущается. Вы наталкиваетесь на плечо грузчика, который смотрит на вас как на муху. «Потерялся, Пробирка?» — усмехается он. Вам приходится извиниться и отойти.' 
      },
      { 
        speaker: 'ЛОГИКА', 
        text: 'Провал. Энергия потрачена неэффективно. Всегда используй минимальное достаточное усилие.',
        emotion: { primary: 'neutral', intensity: 65 }
      },
    ],
    nextScene: 'arrival_control',
  },

  /**
   * Успех ЛОГИКИ - Рационалист анализирует хаос
   */
  arrival_observe_logic: {
    id: 'arrival_observe_logic',
    background: '/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Нужно понять правила этого места, прежде чем делать ход. Вы отступаете к стене, становясь наблюдателем.' 
      },
      { 
        speaker: 'ЛОГИКА', 
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Хаос только кажется хаосом. Это работающий механизм. Прибывшие — к центру. Грузчики — вдоль путей. Патрули — по периметру. Основная масса избегает зоны досмотра FJR. Нам нужно двигаться по пути наименьшего сопротивления, чтобы минимизировать трение.',
        emotion: { primary: 'neutral', intensity: 85 }
      },
      { 
        speaker: 'ЦИНИЗМ', 
        text: 'Все суетятся, как опарыши в банке. Конечная цель одна — быть съеденным. Вопрос лишь в том, кем и когда.',
        emotion: { primary: 'sad', intensity: 50 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Вы замечаете патруль FJR раньше, чем они замечают вас.' 
      },
    ],
    nextScene: 'arrival_control',
  },

  /**
   * Временные заглушки
   */
  arrival_overwhelmed: {
    id: 'arrival_overwhelmed',
    background: '/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке]' 
      },
    ],
    choices: [
      { 
        id: 'continue', 
        text: 'Продолжить', 
        nextScene: 'arrival_control' 
      },
    ],
  },

  arrival_push_forward_success: {
    id: 'arrival_push_forward_success',
    background: '/images/backgrounds/station.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: '[Эта ветка в разработке - успех проталкивания]' 
      },
    ],
    choices: [
      { 
        id: 'continue', 
        text: 'Продолжить', 
        nextScene: 'arrival_control' 
      },
    ],
  },

  /**
   * 8. Досмотр FJR - NPC Густав
   */
  arrival_control: {
    id: 'arrival_control',
    background: '/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'right',
        sprite: '/images/characters/gustav.png',
        emotion: { primary: 'angry', intensity: 70 }
      }
    ],
    dialogue: [
      { 
        speaker: 'Контролёр Густав', 
        text: 'Прибывшие! Предъявить вещи к досмотру! Живо!',
        characterId: 'gustav',
        emotion: { primary: 'angry', intensity: 75 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Вы подходите к столу досмотра. Густав смотрит на вас тяжелым взглядом.' 
      },
      { 
        speaker: 'Густав', 
        text: 'Что внутри?',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 65 }
      },
      { 
        speaker: 'ПАРАНОЙЯ', 
        text: '(Кричит) Как быть?! Заберут же! Они знают, что это ценно!',
        emotion: { primary: 'worried', intensity: 80 }
      },
      { 
        speaker: 'ЛОГИКА', 
        text: '(Спокойно) Нервозность — худшая тактика. Сохраняй самообладание. Играй по правилам, пока не докажешь, что они нарушены.',
        emotion: { primary: 'neutral', intensity: 85 }
      },
      { 
        speaker: 'АВТОРИТЕТ', 
        text: '(Тонкая, дрожащая нота: «Э-э... сэр?») Не пытайся доминировать. Это провалится.',
        emotion: { primary: 'worried', intensity: 40 }
      },
    ],
    choices: [
      { 
        id: 'dominance_logic', 
        text: '[ЛОГИКА] Ответить спокойно: "Понятия не имею. Я просто курьер. Я не нарушаю закон, следуя договору." (Сложность 5)',
        presentation: {
          color: 'skill',
          icon: '🧠',
          tooltip: 'Требуется ЛОГИКА 3+'
        },
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 5,
            successText: 'Густав принимает рациональное объяснение',
            failureText: 'Логика даёт сбой...',
          },
          conditions: [
            { type: 'skill', skill: 'logic', minLevel: 3 }
          ]
        },
        effects: {
          onSuccess: { nextScene: 'arrival_post_inspection' },
          onFailure: { nextScene: 'arrival_control_failure_logic' }
        }
      },
      { 
        id: 'dominance_authority', 
        text: '[АВТОРИТЕТ] С вызовом: "А у вас есть ордер на вскрытие частной собственности?" (Сложность 14)',
        presentation: {
          color: 'bold',
          icon: '👑',
          tooltip: 'Почти невозможно с вашим слабым авторитетом'
        },
        availability: {
          skillCheck: {
            skill: 'authority',
            difficulty: 14,
            failureText: 'Вас легко проигнорировали...',
          }
        },
        effects: {
          onFailure: { nextScene: 'arrival_control_failure_authority' }
        }
      },
      { 
        id: 'dominance_empathy', 
        text: '[ЭМПАТИЯ] Разжалобить: "Послушайте, это мой единственный шанс..." (Сложность 12)',
        presentation: {
          color: 'cautious',
          icon: '💙',
          tooltip: 'Сложно с вашей слабой эмпатией'
        },
        availability: {
          skillCheck: {
            skill: 'empathy',
            difficulty: 12,
            failureText: 'Он остался равнодушен...',
          }
        },
        effects: {
          onFailure: { nextScene: 'arrival_control_failure_empathy' }
        }
      },
    ],
  },

  /**
   * Провал ЛОГИКИ
   */
  arrival_control_failure_logic: {
    id: 'arrival_control_failure_logic',
    background: '/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'right',
        sprite: '/images/characters/gustav.png',
        emotion: { primary: 'angry', intensity: 80 }
      }
    ],
    dialogue: [
      { 
        speaker: 'ЛОГИКА', 
        text: '[ПРОВАЛ] Вы пропустили дыру в аргументации. Вы сослались на закон, который здесь давно не действует.',
        emotion: { primary: 'confused', intensity: 55 }
      },
      { 
        speaker: 'Густав', 
        text: 'Закон? Здесь закон — это мой ботинок и этот металлодетектор. Открывай, курьер!',
        characterId: 'gustav',
        emotion: { primary: 'angry', intensity: 85 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Он хватает портсигар.' 
      },
    ],
    nextScene: 'arrival_post_inspection',
  },

  /**
   * Провал АВТОРИТЕТА
   */
  arrival_control_failure_authority: {
    id: 'arrival_control_failure_authority',
    background: '/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'right',
        sprite: '/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 60 }
      }
    ],
    dialogue: [
      { 
        speaker: 'АВТОРИТЕТ', 
        text: '[ПРОВАЛ] Позор. Ваш голос прозвучал как писк. Он даже не обратил внимания. Вас легко проигнорировать.',
        emotion: { primary: 'sad', intensity: 45 }
      },
      { 
        speaker: 'Густав', 
        text: 'Частная собственность, говоришь? А я говорю, что сейчас это государственная безопасность.',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 70 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Он выхватывает портсигар.' 
      },
    ],
    nextScene: 'arrival_post_inspection',
  },

  /**
   * Провал ЭМПАТИИ
   */
  arrival_control_failure_empathy: {
    id: 'arrival_control_failure_empathy',
    background: '/images/backgrounds/station_check.png',
    characters: [
      {
        id: 'gustav',
        name: 'Контролёр Густав',
        position: 'right',
        sprite: '/images/characters/gustav.png',
        emotion: { primary: 'neutral', intensity: 55 }
      }
    ],
    dialogue: [
      { 
        speaker: 'ЭМПАТИЯ', 
        text: '[ПРОВАЛ] Вы не смогли установить эмоциональную связь. Он вас не слышит.',
        emotion: { primary: 'sad', intensity: 40 }
      },
      { 
        speaker: 'Густав', 
        text: 'У каждого тут "единственный шанс". Открывай.',
        characterId: 'gustav',
        emotion: { primary: 'neutral', intensity: 65 }
      },
      { 
        speaker: 'Рассказчик', 
        text: 'Он протягивает руку за портсигаром.' 
      },
    ],
    nextScene: 'arrival_post_inspection',
  },

  /**
   * После досмотра - временная заглушка
   */
  arrival_post_inspection: {
    id: 'arrival_post_inspection',
    background: '/images/backgrounds/station_check.png',
    characters: [],
    dialogue: [
      { 
        speaker: 'Рассказчик', 
        text: 'Досмотр завершён. Вы делаете первые шаги в новой жизни.' 
      },
      { 
        speaker: 'Рассказчик', 
        text: '[Продолжение следует...]' 
      },
    ],
    choices: [
      { 
        id: 'end', 
        text: 'Конец демо', 
        nextScene: 'prologue_start' // Возврат к началу
      },
    ],
  },
}
