# Grenzwanderer Development Roadmap

_Актуально на 2026-03-08_

## Цель документа

Этот roadmap фиксирует реалистичный порядок развития проекта `Grenzwanderer` на основе текущего состояния репозитория, а не на основе старых планов или внешних предположений.

Документ отвечает на четыре вопроса:

1. В каком состоянии проект находится сейчас.
2. Что нужно сделать в первую очередь.
3. Какие направления дадут максимальную отдачу в ближайшие недели.
4. В каком порядке масштабировать проект дальше.

## Текущее состояние проекта

На момент составления roadmap проект находится в хорошем состоянии для vertical slice и в среднем состоянии для масштабирования.

Что подтверждено локально:

- `bun run test` проходит: `34` test files, `162` tests.
- `bun run lint` проходит.
- `bun run build` проходит.
- `spacetime build --module-path spacetimedb` проходит.
- `bun run smoke:all` проходит полностью.
- `bun run content:manifest:check` проходит.
- `bun run content:obsidian:coverage:check` проходит.

Что не в порядке:

- `bun run content:map:metrics:check` падает, потому что `content/vn/map-metrics.snapshot.json` отстаёт от текущего snapshot.
- Текущий `content/vn/pilot.snapshot.json` уже не совпадает с последним зафиксированным content release в `content/vn/releases.manifest.json`.
- Часть документации и Obsidian-планов описывает более широкий стек, которого в этом репозитории сейчас нет.
- В проекте есть несколько очень крупных файлов, которые уже тормозят сопровождение и расширение.

## Что уже действительно работает

Проект нельзя считать прототипом в ранней стадии. Сейчас в коде уже есть:

- React/Vite/Bun frontend.
- SpacetimeDB runtime как authoritative слой.
- контентный snapshot pipeline из `obsidian/` в `content/vn/pilot.snapshot.json`;
- рабочий VN runtime;
- рабочая map runtime-система;
- рабочий Mind Palace loop;
- battle и command slices;
- social/runtime state для отношений, favours, faction signal, agency career, rumors;
- acceptance matrix и smoke pipeline;
- release governance, CI и content-manifest discipline.

Это означает, что проект уже имеет рабочее ядро. Главная задача теперь не "сделать хоть что-то", а:

- стабилизировать текущий слой;
- углубить Freiburg как основной playable loop;
- расчистить архитектуру для дальнейшего роста;
- только потом масштабировать контент и географию.

## Стратегический приоритет

На ближайший цикл развития правильная стратегия такая:

1. Сначала стабилизировать текущий контентный и release baseline.
2. Затем углубить Freiburg slice как главный системный игровой луп.
3. После этого убрать архитектурные узкие места.
4. И только затем включать Karlsruhe как следующий крупный runtime slice.

Если делать наоборот, проект начнёт расти быстрее, чем выдерживает его текущая архитектура и контентная дисциплина.

## Roadmap на 6-8 недель

### Фаза 1. Стабилизация baseline

Срок: 3-7 дней

### Цель

Привести репозиторий к консистентному состоянию, где:

- content-gates соответствуют текущему snapshot;
- документация не врёт;
- есть один понятный release baseline;
- локальные изменения не смешаны с незавершённым контентным drift.

### Задачи

- Обновить `content/vn/map-metrics.snapshot.json`, если текущее увеличение map bindings и condition-driven logic является намеренным.
- Синхронизировать `docs/CONTENT_RELEASE_RUNBOOK.md` с актуальной snapshot schema.
- Проверить и зафиксировать, какие пункты в Obsidian-доках относятся к этому репозиторию, а какие описывают старый или внешний контур.
- Оформить новый content release после синхронизации snapshot и manifest.
- Проверить, что `README.md`, `ARCHITECTURE.md`, `docs/ACCEPTANCE_MATRIX.md` и release docs описывают фактическое состояние проекта, а не прошлую стадию.

### Команды контроля

```bash
bun run content:manifest:check
bun run content:extract
bun run content:obsidian:coverage:check
bun run content:map:metrics:check
bun run content:drift:check
bun run quality:release
```

### Критерий готовности фазы

- Все content-gates зелёные.
- Текущий snapshot не расходится с ожидаемыми baseline-файлами.
- Документация по schema version и content release совпадает с кодом.
- Состояние ветки ясно разделяет code changes и content release changes.

### Риск, если пропустить фазу

Если пропустить этот шаг, дальнейшая работа будет идти поверх "грязного baseline". Это приведёт к постоянным ложным красным сигналам в CI и к потере доверия к content quality gates.

## Фаза 2. Углубление Freiburg как core gameplay loop

Срок: 2-3 недели

### Цель

Сделать Freiburg не просто набором отдельных демо-механик, а связным игровым контуром, где решения игрока влияют на:

- доступ к локациям;
- социальные отношения;
- favours и услуги;
- карьерный прогресс;
- слухи и их верификацию;
- ветвление на карте и во VN;
- Mind Palace closure.

### Почему это главный приоритет

Freiburg уже имеет рабочий runtime slice. Он покрыт smoke pipeline и acceptance matrix. Значит любая инвестиция сюда усиливает уже поддерживаемую систему, а не создаёт новый параллельный долг.

### Основные направления работ

#### 1. Social systems как часть core loop

Сейчас social runtime уже присутствует в schema, reducers и UI, но его нужно сделать центральной механикой, а не только источником отображаемого статуса.

Нужно усилить:

- `playerNpcFavor`
- `playerFactionSignal`
- `playerAgencyCareer`
- `playerRumorState`

Что должно появиться:

- реальные gate-условия на карте и в VN, завязанные на favor, rumor и rank;
- реальные costs на действия;
- последствия выбора по faction signal;
- сервисы NPC как игровые capability, а не только текст в UI;
- карьерные критерии как системная мотивация игрока.

#### 2. Расширение map loop

Нужно увеличить глубину взаимодействия карты:

- добавить больше condition-driven bindings;
- увеличить число meaningful shadow routes;
- связать rumors и social unlocks с map progression;
- сделать часть перемещений не просто travel, а решением с последствиями;
- усилить связь между point state, unlock groups и social conditions.

#### 3. Freiburg acceptance expansion

Нужно расширить список поддерживаемых player flows. Сейчас acceptance matrix уже хорошая, но в ней пока мало социальных сценариев.

Нужно добавить:

- social access flow;
- rumor verification flow;
- agency career progression flow;
- service unlock flow.

Каждый новый flow должен иметь:

- точный entry path;
- smoke script;
- явные content-gates;
- понятный ownership в runtime.

#### 4. Связка VN -> Map -> Mind Palace

Сейчас эти системы уже взаимодействуют, но следующая ступень зрелости такая:

- VN-сцены открывают новые социальные и маршрутные возможности;
- Map-решения приносят факты, слухи и сервисные unlocks;
- Mind Palace подтверждает стратегические выводы;
- подтверждённые выводы влияют на сюжетный и социальный доступ.

### Критерий готовности фазы

- Freiburg можно пройти как связную петлю, а не как набор отдельных демонстраций.
- Социальные состояния меняют реально доступные действия игрока.
- Новые сценарии поддерживаются acceptance matrix и smoke.

## Фаза 3. Архитектурная разгрузка

Срок: 1-2 недели, лучше частично параллельно с Фазой 2

### Цель

Снизить стоимость изменений и уменьшить вероятность регрессий перед следующим масштабированием.

### Крупнейшие точки техдолга

На момент анализа самые тяжёлые файлы:

- `spacetimedb/src/reducers/helpers/all.ts`
- `scripts/extract-vn-content.ts`
- `src/features/character/CharacterPanel.tsx`
- `src/features/vn/vnContent.ts`
- `src/features/map/ui/MapView.tsx`

Проблема не только в размере, а в смешении нескольких уровней ответственности:

- parsing;
- domain logic;
- reducers helpers;
- UI composition;
- presentation;
- content validation;
- orchestration.

### Что нужно сделать

#### Backend/runtime

- Разделить `helpers/all.ts` минимум на:
  - content parsing helpers;
  - player state mutation helpers;
  - social systems helpers;
  - battle/command helpers;
  - telemetry/idempotency helpers.

#### Content pipeline

- Разделить extraction script на:
  - scenario definitions;
  - quest catalog;
  - social catalog;
  - map snapshot construction;
  - validation;
  - serialization and checksum.

#### Frontend

- Разбить `CharacterPanel` на отдельные tab-level компоненты.
- Разгрузить `MapView`, вынеся HUD, modal layers, route rendering, code entry и interaction handlers в отдельные модули.
- Отделить `vnContent` parsing от runtime helper-логики.

### Что это даст

- быстрее добавлять новые механики;
- проще тестировать;
- легче локализовать регрессии;
- снизить когнитивную нагрузку на каждое изменение;
- подготовить базу для Karlsruhe и следующего контентного расширения.

### Критерий готовности фазы

- Крупные файлы распилены на модули с ясной ответственностью.
- Новые тесты ложатся на отдельные модули, а не только на толстые интеграционные поверхности.
- Изменение одной игровой системы меньше затрагивает соседние.

## Фаза 4. Performance и продуктовая сборка

Срок: 3-5 дней

### Цель

Снизить техническое трение пользовательской сборки и подготовить проект к более тяжёлому контенту.

### Текущие сигналы

Production build уже проходит, но bundle size заметно вырос. Это особенно важно, потому что проект уже использует:

- `mapbox-gl`
- `three`
- `@react-three/fiber`
- достаточно тяжёлый UI/runtime слой

### Задачи

- Улучшить code splitting для карты и 3D-компонентов.
- Проверить, что debug/pilot режимы не тянут в production лишние зависимости раньше времени.
- Рассмотреть manual chunking для крупных модулей.
- Минимизировать дублируемый parsing snapshot в нескольких местах.

### Критерий готовности фазы

- Production bundle остаётся управляемым.
- Тяжёлые подсистемы грузятся только по требованию.
- Main app shell не деградирует при росте контента.

## Фаза 5. Karlsruhe enablement

Срок: 2-3 недели после завершения предыдущих фаз

### Цель

Включить Karlsruhe как полноценный поддерживаемый runtime slice, а не как декоративно присутствующий авторский материал.

### Почему не раньше

Karlsruhe уже хорошо представлен в authoring-слое, но в runtime он ещё не включён как поддерживаемая игровая поверхность. Это видно по тому, что в UI он отображается, но flow остаётся недоступным.

Если начать Karlsruhe до стабилизации Freiburg и до разгрузки архитектуры:

- проект раздвоит фокус;
- acceptance matrix перестанет быть компактной и надёжной;
- техдолг вырастет быстрее, чем полезный gameplay.

### Что нужно сделать перед запуском Karlsruhe

- определить минимальный поддерживаемый Karlsruhe slice;
- подключить его через snapshot-backed runtime, а не через временные заглушки;
- сделать отдельный acceptance flow;
- добавить smoke script;
- провести тот же уровень content validation, что уже действует для Freiburg;
- повторно проверить входной flow из HomePage.

### Критерий готовности фазы

- Karlsruhe можно реально открыть и пройти в supported path.
- Flow не помечен как "not available yet".
- На него есть smoke, acceptance entry path и content gates.

## Рекомендуемый порядок приоритетов

### P0

- исправить `content:map:metrics:check`;
- синхронизировать docs с schema version `6`;
- оформить новый content release baseline.

### P1

- углубить Freiburg social loop;
- добавить social acceptance flows;
- усилить rumor/favor/career integration на карте и во VN.

### P2

- распилить архитектурные монолиты;
- улучшить bundle structure;
- убрать дублирование parsing/runtime glue logic.

### P3

- включить Karlsruhe как следующий runtime slice;
- расширять supported flow set только после smoke coverage.

## Что не стоит делать сейчас

- Не стоит одновременно расширять Freiburg, Karlsruhe и новые глобальные системы.
- Не стоит вкладываться в большой новый контентный объём до стабилизации content baseline.
- Не стоит оставлять крупные файлы без разгрузки, если планируется ещё один большой системный цикл.
- Не стоит воспринимать наличие материалов в `obsidian/` как признак того, что они уже готовы для runtime.

## Метрики прогресса

Для ближайшего цикла полезно отслеживать не только "сколько сделано", но и "насколько система стала надёжнее".

### Release hygiene

- `quality:release` зелёный.
- `content:drift:check` зелёный.
- `content:map:metrics:check` зелёный.
- snapshot checksum совпадает с ожидаемым release state.

### Runtime coverage

- число supported flows в acceptance matrix;
- число smoke scripts, проходящих без ручных действий;
- число систем, влияющих на gameplay, а не только на UI.

### Архитектурное здоровье

- уменьшение размера крупнейших файлов;
- уменьшение количества мест, где snapshot парсится вручную;
- уменьшение числа изменений "через весь стек" для одной фичи.

### Продуктовая глубина

- сколько решений игрока реально влияет на доступные действия;
- сколько social systems участвует в map/VN gating;
- насколько Freiburg можно проходить разными путями, а не одним маршрутом.

## Рекомендуемый milestone plan

### Milestone A. Stable Baseline

Результат:

- репозиторий консистентен;
- docs и snapshot синхронизированы;
- content baseline зафиксирован.

### Milestone B. Freiburg Social Core

Результат:

- social systems становятся частью основного gameplay;
- появляются новые acceptance flows;
- Freiburg становится главным доказанным игровым контуром.

### Milestone C. Architecture Ready for Growth

Результат:

- основные монолиты разгружены;
- новые задачи внедряются быстрее;
- Karlsruhe можно включать без резкого роста хрупкости.

### Milestone D. Karlsruhe Runtime Slice

Результат:

- второй городской slice подключён как supported runtime;
- проект переходит от одного сильного vertical slice к двум поддерживаемым направлениям.

## Финальный вывод

Сейчас проекту не нужен резкий разворот. Ему нужен дисциплинированный рост.

Самый правильный следующий шаг:

- сначала стабилизировать baseline;
- затем сделать Freiburg действительно глубоким;
- затем расчистить архитектуру;
- и только после этого масштабировать мир дальше.

Это даст максимальную отдачу при минимальном росте хаоса.
