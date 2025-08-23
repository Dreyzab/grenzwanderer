// Диалоги для квеста "Боевое Крещение"
// Интеграция с visual novel системой

export const combatBaptismQuestDialogs = [
  // ===================== ДИАЛОГИ КВЕСТА "БОЕВОЕ КРЕЩЕНИЕ" =====================
  {
    _id: 'Briefing',
    dialogKey: 'Briefing',
    title: 'Боевое Крещение',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вас встречает суровый ветеран, сержант Крюгер. Он обводит взглядом собравшихся добровольцев с нескрываемым скепсисом. «Так, салага, слушай сюда! Это вам не по рынку гулять. Stadtgarten — гнездо мутантов и прочей дряни. Наша задача — пройти по периметру, проверить датчики движения и зачистить любую угрозу. Ваша задача, добровольцы, — прикрывать наши спины, тащить снарягу и не путаться под ногами. И главное — выполнять приказы без вопросов. Ясно?»',
        speakerKey: 'Сержант Крюгер',
        choices: [
          {
            text: 'Так точно, сержант!',
            nextNodeKey: null,
            action: 'combat_patrol_start'
          },
          {
            text: 'Есть какие-то особые указания?',
            nextNodeKey: 'patrol_details'
          }
        ]
      },
      patrol_details: {
        text:
          '«Особые указания? Да. Не отставать, не геройствовать, стрелять только по моей команде. Если увидишь что-то странное — докладываешь мне, а не лезешь проверять сам. А теперь хватит болтать. Встать в строй! Выдвигаемся!»',
        speakerKey: 'Сержант Крюгер',
        choices: [
          {
            text: 'Есть!',
            nextNodeKey: null,
            action: 'combat_patrol_start'
          }
        ]
      },
    },
    backgroundImage: '/images/backgrounds/fjr_headquarters.jpg',
    updatedAt: Date.now(),
  },
  // ===================== ПАТРУЛЬ (быстрый вход на узел patrol_start) =====================
  {
    _id: 'combat_patrol_entry',
    dialogKey: 'patrol_start',
    title: 'Патруль Stadtgarten',
    startNodeKey: 'patrol_start',
    nodes: {
      patrol_start: {
        text:
          'Отряд входит в заросший парк. Тишину нарушает лишь хруст веток под ногами и треск рации. Вы идёте по маршруту, проверяя датчики. Напряжение нарастает.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Внезапно рация оживает. «Внимание всем постам! В вашем секторе прорыв! Несколько \'скарабеев\' прорвали ограждение!»',
            nextNodeKey: 'ambush'
          }
        ]
      },
      ambush: {
        text:
          '«К оружию! — орёт Крюгер. — Занять позиции! Приготовиться к бою!» Из зарослей с визгом и скрежетом на вас несётся несколько хитиновых тварей.',
        speakerKey: 'Сержант Крюгер',
        choices: [
          {
            text: 'Вступить в бой!',
            nextNodeKey: 'combat_sequence',
            action: 'start_combat_tutorial_scarabs'
          }
        ]
      },
      combat_sequence: {
        text:
          '/* Здесь происходит бой. Игрок знакомится с основами боевой системы: укрытия, стрельба, использование гранат (если есть), помощь раненым товарищам. */',
        speakerKey: 'СИСТЕМА',
        choices: [
          {
            text: 'После жестокой схватки последний скарабей падает замертво.',
            nextNodeKey: 'aftermath'
          }
        ]
      },
      aftermath: {
        text:
          'Воздух наполнен запахом пороха и кислотной слизи тварей. Один из бойцов FJR ранен. Сержант Крюгер подходит к вам, его суровое лицо выражает... почти одобрение.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Подождать приказа.',
            nextNodeKey: 'sergeant_feedback'
          }
        ]
      },
      sergeant_feedback: {
        text:
          '«А ты не так бесполезен, как я думал, новичок. Держался неплохо. Не запаниковал. — Он кивает на прокусанное плечо. — Сходите к Лене Рихтер, она попробует вам помочь. Миссия выполнена, возвращаемся на базу. Зайди ко мне за оплатой.»',
        speakerKey: 'Сержант Крюгер',
        choices: [
          {
            text: 'Есть, сержант.',
            nextNodeKey: null
          }
        ]
      },
    },
    backgroundImage: '/images/backgrounds/stadtgarten_patrol.jpg',
    updatedAt: Date.now()
  },
  // ===================== ДЕБРИФИНГ ПОСЛЕ БОЯ (завершение у FJR) =====================
  {
    _id: 'combat_debrief',
    dialogKey: 'combat_debrief',
    title: 'Дебрифинг в штабе FJR',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Вы докладываете о выполнении задания. Сержант Крюгер выслушивает краткий отчёт и кивает. «Неплохо отработал, доброволец. Получи плату. Приходи ещё, если не передумал.»',
        speakerKey: 'Сержант Крюгер',
        choices: [
          {
            text: 'Получить награду и завершить задание.',
            nextNodeKey: null,
            action: 'complete_combat_baptism_quest',
            eventOutcomeKey: 'complete_combat_baptism_quest'
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/fjr_headquarters.jpg',
    updatedAt: Date.now()
  },
  // ===================== ДОСКА ОБЪЯВЛЕНИЙ FJR =====================
  {
    _id: 'fjr_bulletin_board_dialog',
    dialogKey: 'fjr_bulletin_board_dialog',
    title: 'Доска объявлений FJR',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          'Перед вами массивная доска объявлений у штаба FJR. Среди различных уведомлений и приказов бросается в глаза свежее объявление, написанное крупными буквами.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Прочитать объявление о наборе добровольцев.',
            nextNodeKey: 'read_recruitment_notice'
          }
        ]
      },
      read_recruitment_notice: {
        text:
          '[ТРЕБУЮТСЯ ДОБРОВОЛЬЦЫ! FJR проводит набор ассистентов для патрулирования городских окраин. Оплата: 25 ЭК за смену + паёк. Требования: базовая боевая подготовка, отсутствие связей с криминалом. Запись у дежурного офицера.]',
        speakerKey: 'Объявление',
        choices: [
          {
            text: 'Записаться добровольцем.',
            nextNodeKey: 'officer_registration',
            condition: 'player_can_join_fjr'
          },
          {
            text: 'Пока не готов к такой работе.',
            nextNodeKey: 'not_ready'
          }
        ]
      },
      officer_registration: {
        text:
          'Дежурный офицер внимательно изучает ваши документы и задаёт несколько вопросов о боевом опыте. «Хм, выглядите вы крепко. И рекомендации неплохие. Ладно, записываю вас на завтрашнее патрулирование. Явка в 06:00 к сборному пункту у Stadtgarten. Не опаздывайте — сержант Крюгер не любит разгильдяев.»',
        speakerKey: 'Дежурный офицер',
        choices: [
          {
            text: 'Понял. Буду вовремя.',
            nextNodeKey: 'assignment_accepted',
            action: 'accept_combat_baptism_quest',
            eventOutcomeKey: 'accept_combat_baptism_quest'
          }
        ]
      },
      assignment_accepted: {
        text:
          'Вы записались на патрулирование с FJR. Завтра в 06:00 нужно явиться к сборному пункту у входа в Stadtgarten для участия в операции по зачистке.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Отлично. Пора готовиться.',
            nextNodeKey: null
          }
        ]
      },
      not_ready: {
        text:
          'Вы решаете, что пока не готовы к такой ответственной работе. Возможно, стоит сначала набраться опыта.',
        speakerKey: 'Рассказчик',
        choices: [
          {
            text: 'Вернуться позже.',
            nextNodeKey: null
          }
        ]
      }
    },
    backgroundImage: '/images/backgrounds/fjr_headquarters.jpg',
    updatedAt: Date.now()
  },

  // ===================== ПРОВЕРКА ПРОГРЕССА: FJR ДОСКА / СБОРНЫЙ ПУНКТ =====================
  {
    _id: 'combat_progress_check',
    dialogKey: 'combat_progress_check',
    title: 'Боевые будни',
    startNodeKey: 'start',
    nodes: {
      start: {
        text:
          '«Записан на патруль? Тогда явись к сборному пункту вовремя. Уже идёт набор добровольцев — не подведи.»',
        speakerKey: 'Дежурный офицер',
        choices: [
          { text: 'Понял, буду.', nextNodeKey: null },
        ],
      },
    },
    backgroundImage: '/images/backgrounds/fjr_headquarters.jpg',
    updatedAt: Date.now(),
  }
];
