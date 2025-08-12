Модернизация квестовой системы — пошаговый план (масштабируемо на все квесты)

Цели коротко
- NPC‑хабы и приоритеты: выдача квестов по приоритетам (сюжетные → личные → процедурные) с проверкой условий.
- Доски объявлений: список доступных квестов, авто‑фильтрация по требованиям.
- Fame/Репутации/Отношения: глобальные критерии доступа и реакции мира.
- Флаги и фазы мира: последствия действий и gateway‑квесты.
- Диалоги ↔ квесты: ветвления, проверки, триггеры.

Дорожная карта по спринтам

Спринт 1 — Серверная база (Convex)
1) Расширить схему `player_state`:
   - `fame?: number`, `reputations?: Record<string, number>`, `relationships?: Record<string, number>`, `flags?: string[]`, `status?: string`.
2) Добавить таблицу `world_state` (глобальные флаги/фаза):
   - `{ key: 'global', phase: number, flags: string[], updatedAt: number }` + индекс `by_key`.
3) Добавить таблицу `quest_registry` (метаданные всех квестов):
   - `questId: string`, `type: 'story'|'faction'|'personal'|'procedural'`, `giverNpcId?: string`, `boardKey?: string`, `repeatable?: boolean`, `priority: number`,
     `phaseGate?: number`, `requirements?: { fameMin?; phaseMin?; phaseMax?; requiredFlags?; forbiddenFlags?; reputations?; relationships? }`.
   - Индексы: `by_giver` (giverNpcId), `by_board` (boardKey), `by_type` (type).
4) Новые серверные методы в `quests.ts`:
   - `getAvailableQuestsForNpc(npcId)`: вернуть квесты (по giverNpcId), отсортированные по приоритету, с фильтром по `requirements`, фазе и прогрессу (неповторяемые недоступны после завершения).
   - `getAvailableBoardQuests(boardKey)`: вернуть квесты для доски с теми же правилами фильтрации.
   - `applyOutcome(...)`: атомарно применить последствия (fameΔ, repΔ, relΔ, flagsAdd/Remove, worldFlagsAdd/Remove, phaseSet?, statusSet?).
   - (Опционально) `setWorldPhase(phase)`.
5) Усилить валидацию в `startQuest/advanceQuest/completeQuest` (guard по фазе и `quest_registry` при наличии).

Спринт 2 — Клиентские стора и API
6) Zustand‑стора игрока/мира:
   - В `usePlayerStore`: добавить проекции `fame`, `reputations`, `relationships`, `flags`, `status` с синхронизацией из сервера.
   - Добавить store для `worldState` (phase, flags) либо расширить имеющийся `progressionStore`.
7) API‑обертки:
   - В `shared/api/quests/convex.ts`: методы для `getAvailableQuestsForNpc`, `getAvailableBoardQuests`, `applyOutcome`.
   - Хелперы нормализации данных (значения по умолчанию).

Спринт 3 — FSM (XState) для квестов
8) Ввести XState‑машины для ключевых квестов (`delivery_and_dilemma`, `combat_baptism`, `citizenship_invitation`, далее — остальные):
   - Вложенные состояния = шаги/ветки; guards = fame/rep/relations/flags/phase; actions = вызовы Convex (`start/advance/complete`, `applyOutcome`).
   - Унифицированные события: `QUEST/START`, `QUEST/ADVANCE`, `QUEST/COMPLETE`, `OUTCOME/APPLY`.
9) Общий координатор действий из диалогов:
   - [ГОТОВО] Заменено разветвление `switch(actionKey)` на диспетчер по таблице маппинга `dialogAction → questEvent | outcome` + FSM (delivery/combat).

Спринт 4 — NPC‑хабы и Доски
10) UI NPC‑хаба: экран «Доступные задания» (первый пункт — топ‑приоритет), запрос `getAvailableQuestsForNpc`.
11) Доски объявлений: открывают список `getAvailableBoardQuests(boardKey)`; пример FJR — «Боевое крещение» при `player_can_join_fjr`.

Спринт 5 — Интеграция с картой и диалогами
12) Серверная фильтрация `map_points` с учётом фазы/флагов/прогресса (минимизировать клиентские заглушки в `visibility.ts`).
13) Диалоговые проверки (fame/skills/flags/relations) и действия переводов в события FSM.

Спринт 6 — Фазы и gateway‑квесты
14) «Приглашение в Цитадель»: открыть при `fame > 50` и выполненных N вводных; завершение ставит `status='citizen'`, `world.phase=2`, включает пул Фазы 2.
15) Перенести логику прохода фаз на сервер (`setWorldPhase`/`setPlayerPhase` с проверками прогресса).

Спринт 7 — Масштабирование на все квесты
16) Заполнить `quest_registry` для всех существующих квестов (type, priority, requirements, giver/board).
17) Для оставшихся квестов ввести FSM по шаблону (единую фабрику/утилиты guards/actions) для повторного использования.

Acceptance criteria
- NPC‑хабы и доски возвращают корректные стеки, отсортированные и отфильтрованные по условиям.
- Delivery: автозапуск из вводной VN, ветка артефакта после Дитера.
- Combat baptism: старт с доски FJR; исход влияет на отношения/репутации.
- Citizenship: доступ при `fame > 50`, переход во 2‑ю фазу.
- Все серверные изменения идемпотентны, клиентские стора синхронизируются.

Порядок выполнения сейчас
- Реализовать Спринт 1 (схемы и серверные методы) + Спринт 2 (API‑обертки).
- Затем начать Спринт 3 для `delivery_and_dilemma` (как эталон для масштабирования).



Обновление плана — что уже сделано
- Сервер (Convex):
  - Расширен `player_state` (`fame`, `reputations`, `relationships`, `flags`, `status`).
  - Добавлены `world_state` и `quest_registry` с индексами.
  - Реализованы: `getWorldState`, `setWorldPhase`, `getAvailableQuestsForNpc`, `getAvailableBoardQuests`, `applyOutcome`, `upsertQuestRegistry`.
  - Добавлен дев‑сид `seedQuestRegistryDev` для массовой регистрации квестов (типы, приоритеты, гейты, giver/board).
- Клиент:
  - API (`shared/api/quests/convex.ts`): `getWorldState`, `getAvailableQuestsForNpc`, `getAvailableBoardQuests`, `applyOutcome`, `seedQuestRegistryDev` — готово.
  - Гидрация: `QuestHydrator` синхронизирует локальную фазу с `world_state`; дополнительно гидрируется `player_state` (`fame/rep/relations/flags/status`) в `usePlayerStore`.
  - UI NPC/Доски: на карте клик по `fjr_board`/`fjr_office_start` открывает модалку со списком доступных квестов (серверная фильтрация) и кнопкой старта.
  - FSM: машины для `delivery_and_dilemma` и `combat_baptism`; координатор работает через `actionMap` (switch удалён).
  - Outcomes: добавлена таблица `eventOutcomeKey → applyOutcome` для всех ключевых квестов (loyalty, freedom, water, eyes, void, bell, citizenship).
  - QuestsPage: разделы «Активные/Завершённые» для отладки.
- Контент/карта:
  - Добавлена карта‑точка `fjr_board` (доска объявлений FJR), диалог `fjr_bulletin_board_dialog` уже был.

Следующие шаги (ближайшие)
- Довести серверную фильтрацию `map_points` до единого источника истины (в prod — без `visibility.ts`, сохранить его как dev‑fallback).
- В модалке доступных квестов: описания из `quest_registry`, фильтры/сортировки, иконки.
- Журнал квестов: отдельная страница или секция с историей событий/outcomes и репутациями.
