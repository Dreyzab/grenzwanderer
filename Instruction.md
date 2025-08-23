## Руководство: как добавлять и масштабировать квесты

В проекте используется FSD, Convex и единая модель квестов с асинхронной синхронизацией прогресса. Ниже — пошаговая инструкция и чек-листы для создания нового квеста и масштабирования системы.

### 1) Определите базовые артефакты квеста
- **Идентификатор квеста**: стабильный `questId` (например, `combat_baptism`).
- **Шаги/этапы**: минимальный список ключевых шагов, например: `available_on_board` → `assigned` → `in_progress` → `completed`.
- **Награды/эффекты**: кредиты, fame, изменения репутаций, флаги, фаза и т.д.

Результат: короткий черновик с монолитным сценарием (VN) и списком шагов.

### 2) Диалоги (Visual Novel)
- Файл: `client/src/shared/storage/<yourQuest>Dialogs.ts`.
- Разбейте сценарий на сцены/диалоги, как в доставке и боевом квесте.
- Для каждой сцены задайте:
  - `_id`, `dialogKey`, `title`, `startNodeKey`, `nodes`, опционально `backgroundImage`.
  - В `choices` используйте `action` и/или `eventOutcomeKey` для связи с действиями (см. раздел 4).

Пример короткого узла с action:
```ts
choices: [
  { text: 'Начать патруль', nextNodeKey: null, action: 'myquest_start_patrol' }
]
```

После создания файла — зарегистрируйте диалоговый модуль в общем реестре диалогов (если требуется в вашем каталоге).

### 3) Точки карты и биндинги (Convex)
- Файл: `client/convex/mapPoints.ts` (dev-сиды) и `client/src/shared/api/mapPoints` (клиентские вызовы).
- Добавьте недостающие точки в сид: ключ, координаты, тип (`npc`, `anomaly`, `board`…), опционально `dialogKey`.
- Добавьте биндинги в массив `bindings` (dev-сид), где укажете:
  - `pointKey`: ключ точки
  - `questId`: ваш квест
  - Одно из: `isStart + startKey` (для стартовых точек) или `stepKey` (для точек шага)
  - Опционально: `dialogKey`, `phaseFrom/phaseTo`, `requiresLowHealth` и др.

Шаблон биндинга шага:
```ts
{
  pointKey: 'my_point',
  questId: 'my_quest',
  stepKey: 'in_progress',
  dialogKey: 'my_scene_key',
  phaseFrom: 1, phaseTo: 99, order: 10,
}
```

Важно: стартовые биндинги отображаются только для незавершённых квестов (фильтр есть в `useClientVisiblePoints`).

### 4) Маппинг действий диалогов → внутренние события
- Файлы: `client/src/features/quest-progress/model/actionMapConfig.ts` и `actionMap.ts`.
- В `actionMapConfig.ts` добавьте ключи `action` из ваших диалогов и сопоставьте их с описателями:
  - `kind: 'fsm'`, `machine: '<delivery|combat|...>'`, `event: { type: 'START' | 'ASSIGN' | 'ADVANCE' | 'COMPLETE', step?: '<stepKey>' }`
  - Либо `kind: 'quest'` (start/advance/complete), либо `kind: 'player'` (операции со здоровьем и т.п.).

Пример:
```ts
accept_my_quest: { kind: 'fsm', machine: 'myquest', event: { type: 'ASSIGN' } },
go_to_site:        { kind: 'fsm', machine: 'myquest', event: { type: 'ADVANCE', step: 'in_progress' } },
finish_my_quest:   { kind: 'fsm', machine: 'myquest', event: { type: 'COMPLETE' } },
```

### 5) Координатор действий (клиент) и синхронизация прогресса
- Файл: `client/src/features/quest-progress/model/actionCoordinator.ts`.
- Координатор читает действия из диалогов, двигает квест через `useQuest()`, выстреливает побочные эффекты (награды, здоровье) и синхронизирует прогресс.
- В проекте включена немедленная отправка снапшота на каждый шаг:
  - `syncSnapshot()` собирает `activeQuests` и `completedQuests` из `useQuestStore` и вызывает `questsApi.syncProgress()`.
  - Вызывается при `START/ASSIGN/ADVANCE/COMPLETE` и при generic `quest start/advance/complete`.

Что добавить для нового квеста:
- В ветке вашей машины (`if (mapped.machine === 'myquest')`) реализуйте обработчики `START/ASSIGN/ADVANCE/COMPLETE`.
- Побочные эффекты (награды):
  - Клиент: можно обновить локальный стор (кредиты, fame и пр.)
  - Сервер: начисление — в Convex (см. раздел 6) для консистентности.

### 6) Серверная логика (Convex): инициализация, прогресс, награды
- Файл: `client/convex/quests.ts`.
- `initializeSession`: возвращает снимок прогресса/каталогов/точек; берёт `phase` = max(client, server).
- `syncProgress`: атомарно перезаписывает прогресс по `deviceId`/`userId` и создаёт записи `quest_progress`. Здесь же можно начислять награды за завершение квестов:
```ts
for (const questId of progress.completedQuests ?? []) {
  await db.insert('quest_progress', { deviceId, questId, currentStep: 'completed', startedAt: now, updatedAt: now, completedAt: now })
  // Награда
  const state = await getOrEnsurePlayerState(ctx, deviceId)
  if (state?._id) await db.patch(state._id, { fame: (state.fame??0)+X, credits: (state.credits??0)+Y, updatedAt: now })
}
```
- Схема: `client/convex/schema.ts` — при необходимости добавьте новые поля (например, `credits`).

### 7) Видимость точек на карте и подсветка активной цели
- Файл: `client/src/widgets/MapWidget/model/useClientVisiblePoints.ts`:
  - Фаза: биндинги фильтруются по `phaseFrom/phaseTo`.
  - Текущий шаг: показывает биндинги текущего шага или стартовые.
  - Здоровье: биндинги с `requiresLowHealth` отображаются при `health < 0.5`.
  - Стартовые биндинги скрываются, если квест уже в `completedQuests`.
- Файл: `client/src/widgets/MapWidget/MapWidget.tsx`:
  - `trackedTargetId` подсвечивает активную точку для текущего шага — добавьте правила для нового квеста.

### 8) Конвенции по именованию и структурированию
- `questId`: snake_case, стабильный ключ (совпадает в биндингах, диалогах, маппинге и координаторе).
- `stepKey`: описательный snake_case.
- `dialogKey`: совпадает с ключом диалога в `*Dialogs.ts`.
- `action` в диалогах: короткий ключ, отражающий намерение, маппится в `actionMapConfig.ts`.

### 9) Чек‑лист добавления нового квеста
1. Создать `*Dialogs.ts` с разбивкой на сцены и корректными `action`/`dialogKey`.
2. Засеять точки и биндинги (dev): `mapPoints.ts`. Проверить `phaseFrom/phaseTo`, `isStart/startKey` или `stepKey`.
3. Добавить маппинг действий в `actionMapConfig.ts` (минимум: `ASSIGN`, `ADVANCE step`, `COMPLETE`).
4. В `actionCoordinator.ts` добавить ветку вашей машины и побочные эффекты.
5. При необходимости — начисление наград на сервере в `syncProgress`.
6. Обновить `MapWidget.tsx` (подсветка) при добавлении новых целевых точек.
7. (Опционально) условия отображения (здоровье и пр.) через поля биндингов.
8. Пройти flow вручную: старт → шаги → завершение; убедиться, что `quest_progress` создаётся/обновляется, а стартовые точки скрываются для завершённых квестов.

### 10) Отладка и диагностика
- Включены бложки `MAP`, `DIALOG`, `QUEST`, `STORE` — используйте их для трассировки.
- Типичные проблемы:
  - «Dialog not found»: `dialogKey` в биндинге не совпадает с ключом в `*Dialogs.ts` или диалог не зарегистрирован.
  - Маркер не пульсирует: не обновлён `trackedTargetId` в `MapWidget.tsx`.
  - Точка не видна: `phaseFrom/phaseTo`, неверный шаг, `requiresLowHealth`, квест уже завершён.
  - Прогресс не в Convex: проверьте вызовы `quests.syncProgress` (немедленный и фоновый), сетку индексов в схеме и интернет‑соединение.

### 11) Dev‑сид и безопасность
- Dev‑сид требует `VITE_DEV_SEED_TOKEN`. В сид-мутаторе — строгая проверка токена.
- Не заливайте сиды в prod или защищайте их конфигом.

### 12) Шаблон для нового квеста (минимальный набор)
1) `client/src/shared/storage/myQuestDialogs.ts`
2) Сиды: `client/convex/mapPoints.ts` — точки и биндинги
3) `actionMapConfig.ts` — ключи действий
4) `actionCoordinator.ts` — ветка машины, побочные эффекты, вызов `syncSnapshot()`
5) (Опц.) `quests.ts/syncProgress` — начисление наград
6) `MapWidget.tsx` — подсветка активной точки

Следуя этому рецепту, новый квест будет полностью интегрирован: диалоги запускаются по маркерам, шаги отображаются на карте, прогресс сохраняется асинхронно в Convex, а завершённые квесты не мешают навигации.


