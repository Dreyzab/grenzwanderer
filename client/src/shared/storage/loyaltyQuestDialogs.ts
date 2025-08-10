// Диалоги квеста "Разделённые Лояльности" (FJR / Анархисты / Двойная игра)

export const loyaltyQuestDialogs = [
  // Старт у капрала Ганса
  {
    _id: 'loyalty_quest_start',
    dialogKey: 'loyalty_quest_start',
    title: 'Особое поручение FJR',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          '«Войдите, — голос капрала Ганса сухой, но без обычной для FJR надменности. Он сидит за столом, на котором разложены карты и какие-то отчёты. — Вы — тот самый новичок, Томас Рихтер, что доставил груз Дитеру? Я слышал, вы произвели на него впечатление. Это хорошо. У FJR есть для вас... особое поручение. Не совсем стандартное, но крайне важное для безопасности города.»',
        speakerKey: 'Капрал Ганс',
        choices: [
          { text: 'Я слушаю, капрал.', nextNodeKey: 'briefing_part1' },
          { text: 'Что именно вы имеете в виду под «особым поручением»?', nextNodeKey: 'briefing_part1_inquisitive' },
        ],
      },
      briefing_part1: {
        text:
          '«В районе, известном как \'Дыра\' – это тот самый сквот анархистов на Августинской площади, — есть старый узел дренажных тоннелей. Наши данные указывают, что именно там может проходить заброшенный канализационный коллектор Старого Мира, ведущий глубоко под город. Этот коллектор — потенциальная лазейка для тварей из Горы, если они найдут, как туда пробиться. Анархисты там давно живут, они знают этот лабиринт лучше нас.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'И что я должен сделать?', nextNodeKey: 'briefing_part2' }],
      },
      briefing_part1_inquisitive: {
        text:
          '«Имею в виду, что мы не можем отправить туда наших патрульных. Во-первых, это вызовет бунт среди анархистов, а во-вторых... ну, они там как дома. Наши парни там заблудятся или нарвутся на ловушки. А вот вы, \'сталкер\'… вы не привязаны к униформе. — Ганс кивает на карту. — В районе, известном как \'Дыра\' – это тот самый сквот анархистов на Августинской площади, — есть старый узел дренажных тоннелей. Наши данные указывают, что именно там может проходить заброшенный канализационный коллектор Старого Мира, ведущий глубоко под город. Этот коллектор — потенциальная лазейка для тварей из Горы, если они найдут, как туда пробиться. Анархисты там давно живут, они знают этот лабиринт лучше нас.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Понятно. Задача?', nextNodeKey: 'briefing_part2' }],
      },
      briefing_part2: {
        text:
          '«Ваша задача — проникнуть в \'Дыру\'. Найти там одного из старых обитателей, его зовут Шрам. Говорят, он когда-то был инженером-картографом до Зимы. Он наверняка знает, где хранятся старые карты или схемы этого коллектора. Вам нужно добыть их. Любым способом. Ясно?»',
        speakerKey: 'Капрал Ганс',
        choices: [
          { text: 'Ясно. Что насчёт оплаты?', nextNodeKey: 'briefing_reward' },
          { text: 'А если Шрам не захочет сотрудничать?', nextNodeKey: 'briefing_reluctance' },
        ],
      },
      briefing_reward: {
        text:
          '«Оплата? — Ганс усмехается. — За такую работу — полная гражданская прописка, разовая премия в пятьдесят кредитов и постоянное место в ополчении FJR. Думаю, для новичка это щедрое предложение. Принесете карту — получите всё. Рискнете. Что скажете?»',
        speakerKey: 'Капрал Ганс',
        choices: [
          {
            text: 'Принять задание. (Принять задание FJR)',
            nextNodeKey: 'quest_accepted_fjr',
            action: 'start_loyalty_quest_fjr',
            eventOutcomeKey: 'accept_fjr_quest',
          },
          { text: 'Извините, это слишком рискованно.', nextNodeKey: 'quest_declined', action: 'decline_loyalty_quest', eventOutcomeKey: 'decline_loyalty_quest' },
        ],
      },
      briefing_reluctance: {
        text:
          '«Не захочет? — Ганс смотрит на вас стальным взглядом. — Вы же сталкер, не так ли? Найдите способ. У нас нет времени на сантименты. Безопасность города важнее его... анархистских убеждений. Но не применяйте излишнюю силу, если можно обойтись без неё. Мы не хотим полномасштабного конфликта. Просто карта. И никаких следов FJR. Оплата? Полная гражданская прописка, разовая премия в пятьдесят кредитов и постоянное место в ополчении FJR. Что скажете?»',
        speakerKey: 'Капрал Ганс',
        choices: [
          {
            text: 'Принять задание. (Принять задание FJR)',
            nextNodeKey: 'quest_accepted_fjr',
            action: 'start_loyalty_quest_fjr',
            eventOutcomeKey: 'accept_fjr_quest',
          },
          { text: 'Нет, спасибо. Я не готов на такое.', nextNodeKey: 'quest_declined', action: 'decline_loyalty_quest', eventOutcomeKey: 'decline_loyalty_quest' },
        ],
      },
      quest_accepted_fjr: {
        text: '«Отлично. На твоём КПК уже есть метка, как добраться до \'Дыры\' наиболее незаметным маршрутом. Удачи. Не подведи.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Выдвигаюсь.', nextNodeKey: null }],
      },
      quest_declined: {
        text:
          '«Как хотите. Но помните, что отказ от таких поручений не прибавляет вам очков в глазах FJR. И в этом городе без нашей защиты вы… всего лишь беженец.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Понял.', nextNodeKey: null }],
      },
    },
    backgroundImage: '/images/backgrounds/workshop.jpg',
    updatedAt: Date.now(),
  },

  // Проникновение в «Дыру» и встреча со Шрамом
  {
    _id: 'infiltration_squat_dialog',
    dialogKey: 'infiltration_squat_dialog',
    title: 'Сердце «Дыры»',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Указанный Гансом маршрут приводит вас в самое сердце «Дыры». Это не просто квартал, это целый мир под открытым небом, построенный из того, что оставил старый город: обломки зданий, горы мусора, покорёженные машины. Из каждого закоулка доносится музыка, смех, ругань. Повсюду развешаны анархистские флаги и граффити. Местные жители, многие из которых выглядят так, будто пережили слишком много Зим, смотрят на вас с любопытством, которое быстро сменяется настороженностью.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Искать Шрама.', nextNodeKey: 'find_scar' }],
      },
      find_scar: {
        text:
          'После недолгих поисков, следуя указаниям местных, вы находите жилище Шрама. Это нечто среднее между кузницей и библиотекой, расположенное в подвале старой прачечной. Пахнет копотью и прогорклой бумагой. Шрам — пожилой мужчина с лицом, изрытым старыми шрамами, отсюда и прозвище. Он сидит на табурете, освещённый керосиновой лампой, и внимательно изучает какую-то древнюю схему, нарисованную на кальке.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Представиться и изложить цель визита.', nextNodeKey: 'scar_greeting' }],
      },
      scar_greeting: {
        text:
          '«Ну, и кто это к нам пожаловал? FJR совсем мозги потеряли, посылать сюда своих шестёрок без брони? — Шрам поднимает голову. Его глаза цепкие, умные, несмотря на возраст. — По виду — новичок. По походке — не анархист. Говори, зачем пришёл, пока я не позвал своих \'друзей\'.»',
        speakerKey: 'Шрам',
        choices: [
          { text: 'Я ищу старые карты дренажных тоннелей. Для FJR. (Правда)', nextNodeKey: 'scar_fjr_truth' },
          { text: 'Я здесь по частному делу. Дитер рекомендовал вас как знатока старых схем. (Ложь)', nextNodeKey: 'scar_lie_about_dieter' },
        ],
      },
      scar_fjr_truth: {
        text:
          '«Ха! Я так и знал. Думал, может, хоть у сталкеров хватит мозгов не лезть в это грязное дело. FJR нужна не \'безопасность города\', дурень. Им нужны эти карты, чтобы проложить путь для своих рейд-отрядов. Чтобы однажды ночью ворваться сюда, зачистить \'Дыру\' и установить свой порядок. Вы — пешка в их грязной игре.»',
        speakerKey: 'Шрам',
        choices: [{ text: 'Откуда такая уверенность?', nextNodeKey: 'scar_dilemma_unveiled' }],
      },
      scar_lie_about_dieter: {
        text:
          '«Дитер? Старый выдумщик. Он никогда не присылал ко мне своих курьеров. И не лги мне, парень. Я вижу за версту, кто на поводке у FJR. Твой КПК фонит их сигнатурой. Говори, зачем пришёл, пока твоё враньё не вылезло тебе боком.»',
        speakerKey: 'Шрам',
        choices: [{ text: 'Я ищу старые карты… (Признаться)', nextNodeKey: 'scar_dilemma_unveiled' }],
      },
      scar_dilemma_unveiled: {
        text:
          '«Теперь слушай внимательно. Эти карты, что нужны FJR, — они у меня. Не потому, что я их храню, а потому, что это мой дом! И этот коллектор — это наш единственный путь для отхода, если они решат нас \'зачистить\'. Если эти карты попадут в руки FJR, \'Дыра\' будет стёрta с лица земли, а мы все окажемся в бараках или хуже. У тебя есть выбор, сталкер. Отдать карты этим псам порядка, предав нас, или... помочь нам. FJR не единственные, кто может платить. И не единственные, кто может ценить верность.»',
        speakerKey: 'Шрам',
        choices: [
          { text: 'Предложить сотрудничество с FJR за долю.', nextNodeKey: 'scar_double_cross_offer' },
          { text: 'Что вы предлагаете?', nextNodeKey: 'scar_anarchist_offer' },
          { text: 'Я не могу предать FJR.', nextNodeKey: 'scar_reject_anarchist_offer' },
        ],
      },
      scar_double_cross_offer: {
        text:
          '«Ха! Сразу видно, кто ты такой. Ладно, мне это нравится. FJR не узнает, что карта поддельная. И получат они... не совсем то, что ожидают. А ты получишь свою оплату от них, и ещё немного от нас за твою... креативность. Плюс кое-что ещё. Например, доступ к нашим тайным тропам, если придётся прятаться от FJR. Что скажешь?»',
        speakerKey: 'Шрам',
        choices: [
          { text: 'Согласиться на подделку карты. (Двойная игра)', nextNodeKey: 'accept_double_cross', action: 'accept_double_cross', eventOutcomeKey: 'accept_double_cross' },
          { text: 'Нет, это слишком опасно.', nextNodeKey: 'scar_reject_double_cross' },
        ],
      },
      scar_anarchist_offer: {
        text:
          '«Мы не можем дать тебе \'гражданскую прописку\' или место в их карманном ополчении. Но мы дадим тебе то, чего у них нет — нашу полную поддержку в \'Дыре\'. Доступ к нашим тайным складам... А главное — знание. И ты получишь моё слово, что \'Дыра\' будет для тебя убежищем. Но тогда карта FJR не достанется. Что выбираешь?»',
        speakerKey: 'Шрам',
        choices: [
          { text: 'Согласиться помочь анархистам. (Сторона Анархистов)', nextNodeKey: 'accept_anarchist_side', action: 'accept_anarchist_side', eventOutcomeKey: 'accept_anarchist_side' },
          { text: 'Нет, я должен выполнить задание FJR.', nextNodeKey: 'scar_reject_anarchist_offer' },
        ],
      },
      scar_reject_anarchist_offer: {
        text:
          '«Значит, ты выбрал их. Жаль. Тогда тебе придётся взять её силой... Пусть попробуют забрать.» — Шрам поднимает нож, из теней выходят фигуры.',
        speakerKey: 'Шрам',
        choices: [{ text: 'Напасть на Шрама. (Силовой вариант для FJR)', nextNodeKey: 'fight_scar_for_map', action: 'fight_scar_for_map', eventOutcomeKey: 'fight_scar_for_map' }],
      },
      scar_reject_double_cross: {
        text:
          '«Тогда ты либо идиот, либо трус. Уходи. И пусть тебе повезёт.» — Несколько анархистов преграждают путь. «Всю карту. Целиком.»',
        speakerKey: 'Шрам',
        choices: [{ text: 'Уйти с пустыми руками. (Провал квеста)', nextNodeKey: 'quest_failed_no_map', action: 'fail_loyalty_quest_no_map', eventOutcomeKey: 'fail_loyalty_quest_no_map' }],
      },
      accept_double_cross: {
        text:
          '«Отлично. Слушай: вот настоящая карта, а вот — наша \'версия\'. Скажешь FJR, что нашёл после схватки... На ней будет пара \'ошибок\'. А вот тебе первый транш и наш \'подарок\'.»',
        speakerKey: 'Шрам',
        choices: [{ text: "Взять награду и 'поддельную' карту. Вернуться к FJR.", nextNodeKey: 'return_to_fjr_double_cross', action: 'return_to_fjr_with_fake_map', eventOutcomeKey: 'return_to_fjr_with_fake_map' }],
      },
      accept_anarchist_side: {
        text:
          '«Отличный выбор. FJR не получит карты. — Шрам кивает, карту бросают в костёр. — Вот твоя награда. \'Дыра\' всегда тебя прикроет.»',
        speakerKey: 'Шрам',
        choices: [{ text: 'Взять награду и вернуться. (Вернуться к Одину)', nextNodeKey: 'return_to_one_anarchist_side', action: 'return_to_one_anarchist_side', eventOutcomeKey: 'return_to_one_anarchist_side' }],
      },
      fight_scar_for_map: {
        text:
          'Схватка была короткой и жестокой... Шрам повержен. На верстаке — искомая карта. Цена — кровь. Теперь нужно отнести её Гансу.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Взять карту и вернуться к Гансу.', nextNodeKey: 'return_to_fjr_with_map', action: 'return_to_fjr_with_map', eventOutcomeKey: 'return_to_fjr_with_map' }],
      },
      quest_failed_no_map: {
        text:
          'Вы уходите из «Дыры» с пустыми руками. Задание провалено. Репутация перед FJR пострадала. Пора искать другого работодателя.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Принять поражение.', nextNodeKey: null }],
      },
    },
    backgroundImage: '/images/backgrounds/forest_encounter.jpg',
    updatedAt: Date.now(),
  },

  // Завершение — FJR
  {
    _id: 'quest_complete_fjr_side',
    dialogKey: 'quest_complete_fjr_side',
    title: 'Доклад о проделанной работе',
    startNodeKey: 'start',
    nodes: {
      start: {
        text: '«Ну что, сталкер? Принёс? — Ганс протягивает руку. — Не тяни. От этого зависит судьба операции.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Передать карту.', nextNodeKey: 'map_delivery' }],
      },
      map_delivery: {
        text: 'Ганс разворачивает карту и сопоставляет с голограммой города. Тишина тягучая.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Ждать реакции.', nextNodeKey: 'fjr_reaction' }],
      },
      fjr_reaction: {
        text:
          '«Отлично! Именно то, что нужно. Ты молодец, Рихтер. Прописка будет оформлена, премия переведена, и ты зачислен в ополчение. Работы будет много.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Принять награду. (Квест завершён)', nextNodeKey: 'quest_complete_fjr', action: 'complete_loyalty_quest_fjr', eventOutcomeKey: 'complete_loyalty_quest_fjr' }],
      },
      quest_complete_fjr: {
        text:
          "Квест 'Разделённые Лояльности' завершён! Вы выполнили задание FJR, заслужили их доверие и обеспечили себе будущее во Фрайбурге.",
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Отлично.', nextNodeKey: null }],
      },
    },
    backgroundImage: '/images/backgrounds/workshop.jpg',
    updatedAt: Date.now(),
  },

  // Завершение — Анархисты
  {
    _id: 'quest_complete_anarchist_side',
    dialogKey: 'quest_complete_anarchist_side',
    title: 'Свои среди чужих',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вы находите Одина в его баре. Он ждёт вас и одобрительно кивает.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Доложить о выполнении.', nextNodeKey: 'anarchist_reaction' }],
      },
      anarchist_reaction: {
        text:
          '«Шрам уже доложил. Ты сделал правильный выбор. Мы не забываем. — Один протягивает мешочек монет и гравитационный крюк. — Теперь ты один из нас.»',
        speakerKey: 'Один',
        choices: [{ text: 'Принять награду. (Квест завершён)', nextNodeKey: 'quest_complete_anarchist', action: 'complete_loyalty_quest_anarchist', eventOutcomeKey: 'complete_loyalty_quest_anarchist' }],
      },
      quest_complete_anarchist: {
        text:
          "Квест 'Разделённые Лояльности' завершён! Ты встал на сторону анархистов и обрёл новых союзников. 'Дыра' укроет тебя.",
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Свобода.', nextNodeKey: null }],
      },
    },
    backgroundImage: '/images/backgrounds/forest_encounter.jpg',
    updatedAt: Date.now(),
  },

  // Завершение — Двойная игра
  {
    _id: 'quest_complete_double_cross',
    dialogKey: 'quest_complete_double_cross',
    title: 'Тонкая игра',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вы возвращаетесь к Гансу, стараясь выглядеть потрёпанным. Он ждёт карту.',
        speakerKey: 'Рассказчик',
        choices: [{ text: "Передать 'поддельную' карту.", nextNodeKey: 'fake_map_delivery' }],
      },
      fake_map_delivery: {
        text: 'Ганс изучает карту через лупу. Напряжение растёт.',
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Ждать приговора.', nextNodeKey: 'fjr_fake_reaction' }],
      },
      fjr_fake_reaction: {
        text:
          '«Похоже на то, что нужно... хотя есть неточности. Ладно. Ты своё сделал: прописка, премия, ополчение — да. Но я буду за тобой смотреть.»',
        speakerKey: 'Капрал Ганс',
        choices: [{ text: 'Принять награду и предупреждение. (Квест завершён)', nextNodeKey: 'quest_complete_double', action: 'complete_loyalty_quest_double_cross', eventOutcomeKey: 'complete_loyalty_quest_double_cross' }],
      },
      quest_complete_double: {
        text:
          "Квест 'Разделённые Лояльности' завершён! Вы сыграли в двойную игру — выгода с обеих сторон, но и риски выше.",
        speakerKey: 'Рассказчик',
        choices: [{ text: 'Так держать.', nextNodeKey: null }],
      },
    },
    backgroundImage: '/images/backgrounds/workshop.jpg',
    updatedAt: Date.now(),
  },
]

export default loyaltyQuestDialogs


