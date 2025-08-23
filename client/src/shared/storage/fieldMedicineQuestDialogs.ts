// Диалоги для квеста "Полевая Медицина"
// Интеграция с visual novel системой

export const fieldMedicineQuestDialogs = [
  // ===================== ДИАЛОГИ КВЕСТА "ПОЛЕВАЯ МЕДИЦИНА" =====================
  {
    _id: 'field_medicine_quest',
    dialogKey: 'field_medicine_quest',
    title: 'Полевая Медицина',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вы входите в медпункт "Синтеза". Внутри вас встречает молодая женщина в чистом лабораторном халате. Её взгляд — внимательный и профессиональный. Это доктор Лена Рихтер. «Ещё один смельчак, познакомившийся с местной фауной? Или просто попал под дождик без зонта? Ложитесь на кушетку, посмотрим, что с вами.»',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Мне нужна помощь.',
            nextNodeKey: 'treatment'
          }
        ]
      },
      treatment: {
        text:
          'Лена быстро и умело обрабатывает ваши раны / вводит вам антирадин. Вы чувствуете, как боль отступает. «Готово. Жить будете. С вас 15 кредитов за материалы. Или... вы можете отработать долг. У нас как раз есть одна проблема.»',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Заплатить 15 кредитов.',
            nextNodeKey: 'pay_for_treatment',
            condition: 'player_has_15_credits'
          },
          {
            text: 'Что за проблема? Я готов помочь.',
            nextNodeKey: 'accept_task'
          }
        ]
      },
      pay_for_treatment: {
        text:
          '«Спасибо. Берегите себя. Если снова понадобится помощь — вы знаете, где меня найти.» (Квест не начинается, но Лена становится доступна как врач и торговец).',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Спасибо, доктор.',
            nextNodeKey: null,
            action: 'unlock_synthesis_vendor'
          }
        ]
      },
      accept_task: {
        text:
          '«Отлично. Дело в том, что у нас почти закончился основной компонент для производства антитоксина — \'Пепельный мох\'. Он растёт только в одном месте: в руинах старого Ботанического сада, на границе \'Серой Зоны\'. Место поганое, полное ядовитых спор и мутировавших грибов. Наши научные сотрудники для такой вылазки не приспособлены. А вы — как раз то, что нужно.»',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Я соберу для вас этот мох. (Принять задание)',
            nextNodeKey: 'quest_accepted',
            action: 'start_field_medicine_quest',
            eventOutcomeKey: 'accept_field_medicine_quest'
          }
        ]
      },
      quest_accepted: {
        text:
          '«Я так и думала. Вот, возьмите. — Лена протягивает вам несколько доз антидота и респиратор получше. — Это поможет вам продержаться в заражённой зоне. Мне нужно хотя бы десять образцов мха. Он светится слабым серебристым светом в темноте, не перепутаете. Координаты сада я загрузила в ваш КПК. Будьте предельно осторожны.»',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Понял. Скоро вернусь.',
            nextNodeKey: null // Игрок отправляется на миссию
          }
        ]
      },

      quest_complete: {
        text:
          'Лена с благодарностью принимает образцы. «Превосходно! Этого хватит на целую партию антитоксина. Вы очень нам помогли. Считайте, ваш долг оплачен с лихвой. Вот, возьмите в награду. — Она протягивает вам набор качественных медикаментов. — И запомните, для вас мои услуги и товары теперь всегда со скидкой. Заходите, если что.»',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Спасибо, доктор. (Завершить квест)',
            nextNodeKey: null,
            action: 'complete_field_medicine_quest',
            eventOutcomeKey: 'complete_field_medicine_quest'
          }
        ]
    },
    },
    backgroundImage: '/images/backgrounds/synthesis_medbay.jpg',
    updatedAt: Date.now()
  },

  // ===================== СИСТЕМНОЕ ОПОВЕЩЕНИЕ О ТРАВМЕ =====================
  {
    _id: 'medical_emergency_notification',
    dialogKey: 'medical_emergency_notification',
    title: 'Системное оповещение',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          '[СИСТЕМНОЕ ОПОВЕЩЕНИЕ: Обнаружено критическое состояние. Рекомендуется обратиться в ближайший медпункт "Синтеза" по адресу: Karl-Rahner-Platz, Кампус "Синтеза".]',
        speakerKey: 'СИСТЕМА',
        choices: [
          {
            text: 'Направиться в медпункт "Синтеза".',
            nextNodeKey: 'go_to_synthesis',
            action: 'trigger_field_medicine_quest'
          },
          {
            text: 'Попытаться справиться самостоятельно.',
            nextNodeKey: 'ignore_treatment'
          }
        ]
      },
      go_to_synthesis: {
        text:
          'Координаты медпункта добавлены на вашу карту. Лучше поторопиться — состояние ухудшается.',
        speakerKey: 'СИСТЕМА',
        choices: [
          {
            text: 'Отправиться к доктору.',
            nextNodeKey: null
          }
        ]
      },
      ignore_treatment: {
        text:
          'Вы решаете не обращаться за медицинской помощью. Ваше состояние может ухудшиться. Медпункт "Синтеза" остается доступен на карте для будущих обращений.',
        speakerKey: 'СИСТЕМА',
        choices: [
          {
            text: 'Продолжить.',
            nextNodeKey: null
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/medical_emergency.jpg',
    updatedAt: Date.now()
  },

  // ===================== ДИАЛОГ СБОРА ПЕПЕЛЬНОГО МХА =====================
  {
    _id: 'ash_moss_collection_dialog',
    dialogKey: 'ash_moss_collection_dialog',
    title: 'В руинах Ботанического сада',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вы добрались до руин старого Ботанического сада. Когда-то это было место красоты и науки, теперь же заросли мутировавших растений окутаны ядовитыми парами. Воздух тяжёлый, дышать трудно даже через респиратор. В сгущающихся сумерках вы замечаете слабое серебристое свечение — это и есть пепельный мох.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Начать сбор пепельного мха.',
            nextNodeKey: 'collecting_moss'
          }
        ]
      },
      collecting_moss: {
        text:
          'Аккуратно срезая светящиеся наросты, вы собираете образцы в специальные контейнеры. Мох хрупкий и требует осторожного обращения. Внезапно из зарослей доносится странный шорох. Что-то приближается.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Продолжить сбор, игнорируя шум.',
            nextNodeKey: 'ignore_danger'
          },
          {
            text: 'Приготовиться к обороне.',
            nextNodeKey: 'prepare_defense'
          },
          {
            text: 'Попытаться скрыться.',
            nextNodeKey: 'hide_attempt'
          }
        ]
      },
      ignore_danger: {
        text:
          'Вы решаете сосредоточиться на работе. Удается собрать больше образцов, но внезапная атака мутировавшего растения застает вас врасплох. Получив несколько ран, вы все же завершаете сбор.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Вернуться к доктору Рихтер с образцами.',
            nextNodeKey: 'mission_complete_injured',
            action: 'complete_moss_collection_injured'
          }
        ]
      },
      prepare_defense: {
        text:
          'Ваша готовность к бою окупается. Когда из зарослей выползает огромный мутировавший плющ, вы успеваете отбить его атаку и нейтрализовать угрозу. Работа завершена без серьезных потерь.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Вернуться к доктору Рихтер с образцами.',
            nextNodeKey: 'mission_complete_success',
            action: 'complete_moss_collection_success'
          }
        ]
      },
      hide_attempt: {
        text:
          'Вам удается укрыться и переждать, пока опасность не минует. Осторожно завершив сбор, вы получаете качественные образцы, но потратили больше времени и антидота.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Вернуться к доктору Рихтер с образцами.',
            nextNodeKey: 'mission_complete_cautious',
            action: 'complete_moss_collection_cautious'
          }
        ]
      },
      mission_complete_injured: {
        text:
          'Несмотря на полученные раны, вы успешно собрали нужное количество пепельного мха. Пора возвращаться к доктору Рихтер.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отправиться в медпункт "Синтеза".',
            nextNodeKey: null
          }
        ]
      },
      mission_complete_success: {
        text:
          'Отличная работа! Вы собрали качественные образцы пепельного мха и успешно справились с опасностью. Доктор Рихтер будет довольна.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отправиться в медпункт "Синтеза".',
            nextNodeKey: null
          }
        ]
      },
      mission_complete_cautious: {
        text:
          'Осторожный подход оправдался. Вы собрали отличные образцы и избежали серьезных травм, хотя и потратили больше ресурсов.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отправиться в медпункт "Синтеза".',
            nextNodeKey: null
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/botanical_ruins.jpg',
    updatedAt: Date.now()
  },

  // ===================== ДИАЛОГ ВОЗВРАТА С МХОМ =====================
  {
    _id: 'return_with_moss_dialog',
    dialogKey: 'return_with_moss',
    title: 'Возвращение в медпункт',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: 'Вы возвращаетесь в медпункт с мхом.',
        speakerKey: 'Доктор Лена Рихтер',
        choices: [
          {
            text: 'Получить награду',
            nextNodeKey: null,
            action: 'complete_field_medicine_quest',
            eventOutcomeKey: 'complete_field_medicine_quest'
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/synthesis_medbay.jpg',
    updatedAt: Date.now()
  }
];
