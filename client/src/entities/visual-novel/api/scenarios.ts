import type { Scene } from '@/entities/visual-novel/model/types'

export const scenarios: Record<string, Scene> = {
  // ПРОЛОГ: Неумолчная Жалоба (Расширенная версия)
  prologue_start: {
    id: 'prologue_start',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { text: 'Тамбур. Ржавчина. Скрежет колёс. Вы стоите у мутного окна, докуривая последнюю сигарету.' },
      { speaker: 'Рассказчик', text: 'Неумолчная жалоба поезда. За окном — жёлтые, больные деревья. Конец пути. Или начало того же самого. Мысли путаются. Нужно чем-то занять руки, голову...' },
    ],
    choices: [
      { id: 'look_window', text: 'Посмотреть в окно', nextScene: 'prologue_memory_window' },
      { id: 'check_pockets', text: 'Пошарить по карманам', nextScene: 'prologue_check_pockets' },
      { id: 'look_around', text: 'Осмотреться в тамбуре', nextScene: 'prologue_companions' },
    ],
  },
  prologue_check_pockets: {
    id: 'prologue_check_pockets',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы машинально хлопаете себя по карманам старого плаща. Привычка выжившего — проверять, всё ли на месте.' },
      { speaker: 'Рассказчик', text: 'Дешёвая зажигалка. Работает через раз, но работает. Несколько мятых энергокредитов.' },
      { speaker: 'ЛОГИКА', text: 'Этого не хватит и на три дня. Первый же заработок — критически важен.' },
      { speaker: 'Рассказчик', text: 'Ржавый мультитул. Рука сама собой проскальзывает глубже, в потайной карман на подкладке. Там... что-то твёрдое. Тяжёлое.' },
      { speaker: 'Рассказчик', text: 'Посылка.' },
    ],
    choices: [
      { id: 'examine_package', text: 'Внимательно осмотреть упаковку', nextScene: 'prologue_examine_package', setFlags: { has_package: true } },
      { id: 'remember_order', text: 'Вспомнить, как получил заказ', nextScene: 'prologue_memory_order', setFlags: { has_package: true } },
      { id: 'put_away', text: 'Убрать посылку и забыть', nextScene: 'prologue_train_stop', setFlags: { has_package: true, prologue_kept_sealed: true } },
    ],
  },
  prologue_examine_package: {
    id: 'prologue_examine_package',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы вертите в руках портсигар. Празднично обёрнут чёрной шёлковой лентой. Место узла залито тёмно-синим воском. Печать.' },
      { speaker: 'ВОСПРИЯТИЕ', text: 'Вес... не сходится. Слишком тяжёлый для простого портсигара.' },
      { speaker: 'ИНТУИЦИЯ', text: 'От него веет... важностью. И опасностью.' },
      { speaker: 'ТЕХНОФИЛ', text: 'Восковая печать от ИИ? Редкость. Обычно они используют цифровые маркеры. Это... личное.' },
      { speaker: 'Рассказчик', text: 'На печати выдавлены два латинских слова.' },
    ],
    choices: [
      { id: 'read_seal', text: 'Попытаться прочесть надпись', nextScene: 'prologue_read_seal' },
      { id: 'shake_guess', text: 'Потрясти портсигар, пытаясь угадать содержимое', nextScene: 'prologue_deduce' },
      { id: 'pry_seal', text: 'Попытаться поддеть печать', nextScene: 'prologue_open_package' },
    ],
  },
  prologue_read_seal: {
    id: 'prologue_read_seal',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы подносите печать ближе к тусклому свету из окна. "Acta, non verba".' },
      { speaker: 'ЭНЦИКЛОПЕДИЯ', text: 'Древняя латынь. "Дела, а не слова".' },
      { speaker: 'ПРОФЕССИОНАЛ', text: 'Это инструкция. Не болтай. Просто сделай.' },
      { speaker: 'ПАРАНОЙЯ', text: 'Это угроза. Если проболтаешься — умрёшь.' },
      { speaker: 'Рассказчик', text: 'Дела, а не слова. Заказчик был немногословен. И щедр. Билет до Фрайбурга — целое состояние. За что? Что может быть так ценно в этом старом портсигаре?' },
    ],
    choices: [
      { id: 'deduce', text: 'Попытаться логически вычислить содержимое', nextScene: 'prologue_deduce' },
      { id: 'trust_gut', text: 'Довериться чутью', nextScene: 'prologue_deduce', setFlags: { prologue_trusted_gut: true } },
      { id: 'stop_guess', text: 'Перестать гадать. Важен только пункт назначения.', nextScene: 'prologue_train_stop' },
    ],
  },
  prologue_deduce: {
    id: 'prologue_deduce',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы прикидываете вес и размер.' },
      { speaker: 'ЛОГИКА', text: 'Плотный металл. Осмий? Вольфрам? Или... это вес не содержимого, а самого контейнера. Свинцовая оплётка. Экранирование.' },
      { speaker: 'ПАРАНОЙЯ', text: '(Вспышка) Экранированный! Значит, внутри что-то радиоактивное! Или то, что нельзя сканировать! Нас используют как "чистого" курьера! Подстава!' },
      { speaker: 'ИНТУИЦИЯ', text: '(Шёпот) Оно не мёртвое. Оно... спит. Внутри тишина, но это тишина перед грозой.' },
      { speaker: 'ДОФАМИН', text: '(Нетерпеливо) Да какая разница! Тяжёлое — значит, дорогое! Давай же, открой!' },
      { speaker: 'Рассказчик', text: 'Руки чешутся. Соблазн велик. Один раз взглянуть. Узнать, что ты везёшь. Узнать, стоит ли эта посылка твоей жизни.' },
    ],
    choices: [
      { id: 'open_package', text: 'Решиться. Вскрыть посылку.', nextScene: 'prologue_open_package' },
      { id: 'leave_package', text: 'Унять любопытство. Контракт есть контракт.', nextScene: 'prologue_leave_package', setFlags: { prologue_kept_sealed: true } },
    ],
  },
  prologue_open_package: {
    id: 'prologue_open_package',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы достаёте мультитул. Холодное лезвие касается края восковой печати...' },
    ],
    nextScene: 'prologue_train_stop',
  },
  prologue_leave_package: {
    id: 'prologue_leave_package',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы сжимаете кулак. Нет. Профессионалы выполняют работу. Вы убираете портсигар обратно в потайной карман...' },
    ],
    nextScene: 'prologue_train_stop',
  },
  prologue_train_stop: {
    id: 'prologue_train_stop',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Поезд дёрнулся.' },
      { speaker: 'SFX', text: '(Оглушительный скрежет тормозов. Вас бросает вперёд, вы упираетесь в стену. Сигарета падает и гаснет, рассыпая искры.)' },
      { speaker: 'РЕФЛЕКСЫ', text: 'Группируйся! Ноги согнуть!' },
      { speaker: 'ВЫНОСЛИВОСТЬ', text: 'Держись. Просто держись.' },
      { speaker: 'Рассказчик', text: 'Инерция. Реальность вернулась. Приехали.' },
      { speaker: 'Рассказчик', text: 'В тамбур врывается гул человеческих голосов с платформы. Сцена плавно перетекает в «Прибытие».' },
    ],
    nextScene: 'arrival_sensory_overload',
  },
  // Доп. ветки‑заглушки
  prologue_memory_window: {
    id: 'prologue_memory_window',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Мутное стекло и размазанные ленты света. В старом мире поезда тоже приходили к концу пути.' },
    ],
    nextScene: 'prologue_start',
  },
  prologue_memory_order: {
    id: 'prologue_memory_order',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Заказчик был немногословен. И щедр. Лицо в тени, слова — как печать: «Дела, а не слова».' },
    ],
    nextScene: 'prologue_examine_package',
  },
  prologue_companions: {
    id: 'prologue_companions',
    background: '/images/backgrounds/train.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Пустой тамбур, только вы и ритм колёс. Попутчики — за закрытой дверью.' },
    ],
    nextScene: 'prologue_start',
  },

  // ГЛАВА 1: Прибытие — Сцена 2: Сенсорная Перегрузка
  arrival_sensory_overload: {
    id: 'arrival_sensory_overload',
    background: '/images/backgrounds/station.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'И вот, наконец, гул. Живой, человеческий, машинный. Вы делаете шаг на скользкую платформу, и мир взрывается.' },
      { speaker: 'ВОСПРИЯТИЕ', text: 'Жареный лук. Невозможно! Запах настоящей, горячей еды! Сколько лет прошло?' },
      { speaker: 'ВЫНОСЛИВОСТЬ', text: '(Кашель) Воздух... плотный. Сажа, уголь, немытые тела. Дышать тяжело.' },
      { speaker: 'РЕФЛЕКСЫ', text: 'Слишком много движения. Слева. Справа. Ребёнок бежит. Дрезина едет. Мозг не успевает отследить все траектории.' },
      { speaker: 'Рассказчик', text: 'После недель пути по мёртвым землям, станция Фрайбурга — это лихорадочно бьющееся сердце. Люди снуют, кричат, торгуются. Десятки дрезин загромождают пути. Хаос. Деятельный, почти радостный.' },
    ],
    choices: [
      { id: 'overwhelmed', text: 'Опешить от количества людей', nextScene: 'arrival_overwhelmed' },
      { id: 'push_forward', text: 'Попытаться пробиться вперёд', nextScene: 'arrival_push_forward' },
      { id: 'observe', text: 'Осмотреться, ища ориентиры', nextScene: 'arrival_observe' },
    ],
  },
  arrival_overwhelmed: {
    id: 'arrival_overwhelmed',
    background: '/images/backgrounds/station.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Вы замираете на месте. Слишком много. Слишком громко.' },
      { speaker: 'ЭМПАТИЯ', text: 'Столько боли. И надежды. Каждое лицо — отдельная история. Трагедия, втиснутая в один вокзал.' },
      { speaker: 'ПАРАНОЙЯ', text: 'Они смотрят. Каждый второй. Оценивают. Ищут слабину. Один из них уже следит за тобой. Чувствуешь? Взгляд в спину. Холодный.' },
      { speaker: 'Рассказчик', text: 'Чужое плечо грубо подталкивает вас вперёд — поток не терпит остановок.' },
    ],
    nextScene: 'arrival_control',
  },
  arrival_push_forward: {
    id: 'arrival_push_forward',
    background: '/images/backgrounds/station.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Стоять здесь нельзя — сомнут. Нужно двигаться.' },
      { speaker: 'АВТОРИТЕТ', text: 'Расступись! Ты здесь по делу. Ты не такой, как они.' },
      { speaker: 'СИЛА', text: 'Локти — лучшее оружие в толпе. Один точный удар — и путь свободен. Второй — и они начинают уважать твоё пространство.' },
      { speaker: 'Рассказчик', text: 'Вы делаете несколько шагов вперёд, расталкивая толпу.' },
    ],
    nextScene: 'arrival_control',
  },
  arrival_observe: {
    id: 'arrival_observe',
    background: '/images/backgrounds/station.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Нужно понять правила этого места, прежде чем делать ход. Вы отступаете к стене, становясь наблюдателем.' },
      { speaker: 'ЛОГИКА', text: 'Хаос только кажется хаосом. Смотри. Есть потоки. Прибывшие — к центру. Грузчики — вдоль путей. Патрули — по периметру. Это не муравейник, это работающий механизм.' },
      { speaker: 'ЦИНИЗМ', text: 'Все суетятся, как опарыши в банке. Конечная цель одна — быть съеденным. Вопрос лишь в том, кем и когда.' },
      { speaker: 'Рассказчик', text: 'Вы замечаете патруль FJR раньше, чем они замечают вас.' },
    ],
    nextScene: 'arrival_control',
  },

  // Сцена 3: Контроль
  arrival_control: {
    id: 'arrival_control',
    background: '/images/backgrounds/station_check.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Контролёр Густав', text: 'Прибывшие! Предъявить вещи к досмотру! Живо!' },
      { speaker: 'Рассказчик', text: 'Обыск унизительный и деловитый. Один из бойцов бесцеремонно роется в вашем рюкзаке. Густав смотрит на вас. Его взгляд останавливается на потайном кармане вашего плаща.' },
      { speaker: 'Густав', text: 'А это что у нас?' },
      { speaker: 'Рассказчик', text: 'Сердце ухает вниз. Он забирает портсигар.' },
      { speaker: 'ПАРАНОЙЯ', text: '(Кричит) ОНИ ЗНАЮТ! ЭТО ЗАПАДНЯ! ОНИ ЖДАЛИ НАС!' },
      { speaker: 'ЛОГИКА', text: '(Спокойно) Стандартная процедура проверки. Нервозность — худшая тактика. Сохраняй самообладание.' },
      { speaker: 'АВТОРИТЕТ', text: '(Раздражённо) Не позволяй ему смотреть на тебя сверху вниз. Ты не преступник. Пока.' },
      { speaker: 'ЭМПАТИЯ', text: '(Тихо) Он устал. Сотни таких, как ты, проходят через его руки каждый день. Это просто работа.' },
      { speaker: 'ЦИНИЗМ', text: '(Усмехается) Да, работа. Унижать людей за паёк и чувство власти. Классика.' },
      { speaker: 'Густав', text: 'Что внутри?' },
    ],
    choices: [
      { id: 'dominance_logic', text: 'Ответить честно и спокойно: "Понятия не имею. Я просто курьер. Попросили доставить."', nextScene: 'arrival_post_inspection', setFlags: { dominance_logic: true, inspection_done: true } },
      { id: 'dominance_authority', text: 'С вызовом: "А у вас есть ордер на вскрытие частной собственности?"', nextScene: 'arrival_post_inspection', setFlags: { dominance_authority: true, inspection_done: true } },
      { id: 'dominance_empathy', text: 'Разжалобить: "Послушайте, это всё, что у меня есть. Единственный шанс..."', nextScene: 'arrival_post_inspection', setFlags: { dominance_empathy: true, inspection_done: true } },
      { id: 'dominance_paranoia', text: 'Молчать и нервно смотреть на посылку.', nextScene: 'arrival_post_inspection', setFlags: { dominance_paranoia: true, inspection_done: true } },
    ],
  },
  arrival_post_inspection: {
    id: 'arrival_post_inspection',
    background: '/images/backgrounds/station_check.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Густав уже тянется к печати, но останавливается, прищурившись: взгляд цепляется за имя на ярлыке адресата.' },
      { speaker: 'Густав', text: 'Хм... Профессору? Так что же вы не сказали сразу.' },
      { speaker: 'Боец FJR', text: 'Не вскрываем. Адресат — достопочтенный профессор. Сегодня, кстати, юбилей — семьдесят.' },
      { speaker: 'Густав', text: 'Ладно. Держите и передайте профессорe поздравления от меня.' },
      { speaker: 'Рассказчик', text: 'Портсигар возвращают. Конец досмотра.' },
    ],
    nextScene: 'arrival_bureau',
  },
  // Сцена 4: Бюро — Информационная Перегрузка
  arrival_bureau: {
    id: 'arrival_bureau',
    background: '/images/backgrounds/station_bureau.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Густав', text: 'К учётному бюро. Получите временный талон. Без него вы здесь — просто мусор.' },
      { speaker: 'Рассказчик', text: 'Вы подходите. За стеклом сидит старуха, словно сотканная из пергамента и тонких веточек. Но её глаза — живые, проницательные.' },
      { speaker: 'Старуха‑регистратор', text: 'Голубчик, новенький? Вижу, FJR уже обнюхали. Слушай сюда...' },
      { speaker: 'Рассказчик', text: 'Она начинает говорить — быстро, скрипуче, выдавая концентрат выживания в этом городе.' },
      { speaker: 'Старуха‑регистратор', text: 'Если руки из плеч растут, иди к Артисанам в промзону. Платят мало, но кормят. Если ты мозговитый — в «Синтез», может и найдёшь место пробирки мыть.' },
      { speaker: 'ЭНЦИКЛОПЕДИЯ', text: 'Артисаны — гильдия ремесленников, образованная в 2157 году после Падения. «Синтез» — научный альянс, прямой наследник довоенного университета Фрайбурга.' },
      { speaker: 'ФИЛОСОФИЯ', text: 'Руки из плеч. Метафора предназначения? Или простая констатация нормы?' },
      { speaker: 'ДОФАМИН', text: 'Деньги! Она говорит про РАБОТУ! Наконец‑то!' },
      { speaker: 'Старуха‑регистратор', text: 'Нужно убежище — к отцу Иоанну в кафедральный собор. Но держись подальше от анархистов на Августинской — там только разврат и наркотики, пропадёшь.' },
    ],
    choices: [
      { id: 'listen_carefully', text: 'Внимательно слушать и запоминать', nextScene: 'arrival_bureau_after_choice', setFlags: { insight_logic_plus1: true, map_hints_upgraded: true } },
      { id: 'be_skeptical', text: 'Отнестись скептически', nextScene: 'arrival_bureau_after_choice', setFlags: { insight_cynicism_plus1: true } },
      { id: 'be_thankful', text: 'Поблагодарить искренне', nextScene: 'arrival_bureau_after_choice', setFlags: { insight_empathy_plus1: true, registrar_friendly: true } },
    ],
  },
  arrival_bureau_after_choice: {
    id: 'arrival_bureau_after_choice',
    background: '/images/backgrounds/station_bureau.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Старуха‑регистратор', text: 'А если совсем прижмёт — FJR всегда ищут добровольцев. Призывной пункт у Мэрии. Держи. — Она просовывает в окошко тонкую пластиковую карточку. — Временный талон. Не потеряй.' },
      { speaker: 'Рассказчик', text: 'Она машет костлявой рукой, подзывая проходящий мимо патруль FJR.' },
    ],
    nextScene: 'arrival_pda_grant',
  },
  // Сцена 5: Получение КПК — Финальное Пробуждение
  arrival_pda_grant: {
    id: 'arrival_pda_grant',
    background: '/images/backgrounds/station_platform.jpg',
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Двое солдат останавливаются. Один из них, помоложе, снимает шлем. Усталое, но честное лицо.' },
      { speaker: 'Солдат FJR (Ганс)', text: 'Что случилось, тётушка?' },
      { speaker: 'Старуха‑регистратор', text: 'Вот, Ганс, новенький. Совсем потерянный. Выдайте ему хоть какой‑нибудь аппарат, а то пропадёт. Видно, что не из местных головорезов.' },
      { speaker: 'Рассказчик', text: 'Ганс окидывает вас оценивающим взглядом.' },
      { speaker: 'Ганс', text: 'Ладно. По приказу мэра Фокс, всем зарегистрированным прибывшим выдаётся личный коммуникатор. Для учёта и экстренной связи. — Он достаёт из подсумка тяжёлый, поцарапанный прибор. — Вот, держи. «Эхо‑7».' },
      { speaker: 'ТЕХНОФИЛ', text: 'Военная модель M7‑Echo. Защищённый корпус, автономное питание до 72 часов. Классика.' },
      { speaker: 'Ганс', text: 'Здесь карта, контакты фракций и система оповещения. Не потеряй. И не пытайся разобрать — внутри датчик слежения и небольшой заряд. На всякий случай.' },
      { speaker: 'ПАРАНОЙЯ', text: 'Датчик слежения! Взрывчатка! ЭТО ЭЛЕКТРОННЫЙ ОШЕЙНИК!' },
      { speaker: 'ЛОГИКА', text: 'Логичный компромисс. Они дают тебе инструмент, но сохраняют контроль. Разумная мера предосторожности.' },
      { speaker: 'ДОФАМИН', text: 'БЕСПЛАТНЫЙ ГАДЖЕТ! Наконец‑то хоть что‑то хорошее! Бери, не думай!' },
      { speaker: 'ЦИНИЗМ', text: 'Добро пожаловать в систему. Твой номер в очереди на переработку теперь в цифровом формате.' },
      { speaker: 'Рассказчик', text: 'Вы берёте в руки тяжёлый, холодный пластик.' },
      { speaker: 'Ганс', text: 'А теперь слушай. Советы моей тётки дельные, но жизнь сложнее. Если хочешь не просто выжить, а закрепиться, тебе нужна работа...' },
      { speaker: 'ЭМПАТИЯ', text: 'Он сочувствует. Видишь, как он избегает смотреть в глаза, когда говорит о «частной просьбе»? Он тоже заложник этой системы.' },
      { speaker: 'АВТОРИТЕТ', text: 'Условия диктуют они. Но можно играть по их правилам и всё равно выиграть. Это просто первая фигура на доске.' },
      { speaker: 'ФИЛОСОФИЯ', text: 'Каждый прибор — это продолжение души. Что же эта маленькая коробочка с зарядом внутри говорит о душе этого города?' },
      { speaker: 'Рассказчик', text: 'Гул вокзала, тяжесть КПК в руке, мигающее уведомление о задании и туманные перспективы, нарисованные старухой. Всё это обрушивается на вас одновременно.' },
      { speaker: 'ВНУТРЕННИЙ ГОЛОС', text: 'Итак... что дальше?' },
      { action: 'go_to_map_with_dialog', dialogKey: 'phase_1_choice_dialog', text: '' },
    ],
  },
}
