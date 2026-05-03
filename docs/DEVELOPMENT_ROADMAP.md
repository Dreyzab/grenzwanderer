# Grenzwanderer Development Roadmap

_Актуально на 2026-03-10_

## Status Refresh (2026-03-18)

This note supersedes older roadmap bullets where they disagree with the current repository state.

- Canonical supported onboarding is now `case01_hbf_arrival -> Fritz priority choice -> bank/Mayor -> leads -> convergence -> warehouse finale`. `journalist_agency_wakeup` and `sandbox_agency_briefing` remain side/dev-only content.
- Auth hardening for `register_worker_identity`, `publish_content`, and `rollback_content` is already landed in repo state.
- The visibility decision matrix is already landed and currently covers the full set of `public: true` tables.
- The immediate governance follow-up is CI supply-chain hardening: full SHA pinning, installer-step review, and Dependabot. It is not another reducer-auth baseline PR.

## Цель документа

Этот roadmap фиксирует порядок развития проекта `Grenzwanderer` на основе текущего состояния репозитория.

`deep-research-report.md` и `deep-UXresearch-report.md` используются здесь как risk register и источник гипотез для сверки, но не как альтернативный source of truth. Источником истины для roadmap остаются текущие файлы репозитория: `package.json`, `scripts/acceptance-matrix.ts`, `spacetimedb/src/schema.ts`, reducers в `spacetimedb/src/reducers/` и `.github/workflows/`.

Документ отвечает на четыре вопроса:

1. В каком состоянии проект находится сейчас.
2. Что нужно делать в первую очередь.
3. Какие направления дают максимальную отдачу в ближайшие недели.
4. В каком порядке масштабировать проект дальше без ложных внешних нарративов.

## Текущее состояние проекта

На текущем этапе проект находится в хорошем состоянии для одного сильного vertical slice и в среднем состоянии для дальнейшего масштабирования.

Что подтверждается самим репозиторием:

- Freiburg остаётся единственным поддерживаемым player-facing city.
- Karlsruhe по-прежнему находится вне supported flow set.
- Источник истины для supported flows находится в `scripts/acceptance-matrix.ts`.
- `smoke:all` выводится из acceptance matrix, а не поддерживается отдельным списком вручную.
- Freiburg social loop уже имеет поддерживаемые smoke flows:
  - `smoke:social-access`
  - `smoke:rumor-verification`
  - `smoke:agency-career`
  - `smoke:service-unlock`
- В репозитории уже есть release governance, content pipeline, acceptance matrix и smoke infrastructure.

Что остаётся напряжением для следующего цикла:

- baseline и content release дисциплина всё ещё требуют стабилизации;
- security/governance слой отстаёт от уровня gameplay/runtime дисциплины;
- несколько hotspots уже велики настолько, что повышают стоимость изменений;
- часть внешних или старых материалов описывает более широкий контур, чем реально поддерживается этим репозиторием.

## Валидированная дельта из research reports

Отчёт полезен не как новый roadmap, а как список гипотез, которые нужно сверить с текущим кодом и документацией.

### Что действительно актуально и входит в roadmap

- В `spacetimedb/src/schema.ts` operational-private raw таблицы уже закрыты (`public: false`); переходный риск сместился на публичные scoped views и их subscription surface.
- `register_worker_identity` сейчас саморегистрирует caller identity без отдельного административного gate.
- `publish_content` и `rollback_content` не показывают явного admin guard.
- GitHub Actions в `.github/workflows/` используют version tags, а не pin на полный SHA.
- `ci.yml` ставит SpacetimeDB CLI через remote installer path `curl | sh`.
- В `.github/` отсутствует `dependabot.yml`.

### Что уже устарело относительно текущего репозитория

- Freiburg social acceptance coverage уже не является будущей задачей "с нуля".
- Supported social flows уже существуют и зафиксированы в acceptance matrix.
- Freiburg уже нельзя описывать как набор только изолированных демо-механик без поддерживаемого smoke-слоя.

### Что не должно определять roadmap в этом цикле

- Общие productization-идеи, не привязанные к ближайшим проблемам репозитория.
- Любые предположения из внешних документов, которые не подтверждаются текущим кодом или текущей документацией.
- Большие архитектурные инициативы, не привязанные к зафиксированному blocker.

### Что UX-отчёт добавляет к roadmap

- Governance migration должна сохранять UX, а не только безопасность: если player-scoped данные уходят из raw public tables, им нужен replacement read path через `my_*`, `region_*` или другой ограниченный read model, чтобы не ломать текущие клиентские и smoke flows.
- Разделение на public minimal data и более полный internal state полезно не только для security/perf, но и для уменьшения пользовательского шума, объёма подписок и спойлерного payload.
- “Парламент голосов” / voice progression выглядит как сильный product/domain candidate, но пока не должен маскироваться под уже подтверждённую repo-first задачу. Это отдельный post-Freiburg discovery track, а не часть текущего governance P0.
- Hardlink anti-spoofing, civic loop и более широкий location-based expansion остаются более поздней продуктовой траекторией. Их нельзя поднимать раньше, чем supported Freiburg path и минимальный governance-baseline станут устойчивыми.

## Стратегический приоритет

Основная продуктовая траектория остаётся такой:

1. Сначала стабилизировать текущий baseline контента и документации.
2. Затем углубить Freiburg как основной gameplay loop.
3. И только затем включать Karlsruhe как следующий крупный runtime slice.

Параллельно с этим запускается security/governance track. Он не заменяет основную продуктовую очередность и не переписывает roadmap вокруг deep research report, но закрывает repo-validated риски, которые уже есть сейчас.

Architecture cleanup больше не рассматривается как равнообязательная фаза такого же уровня, как baseline, Freiburg и Karlsruhe. Он переводится в evidence-gated hotspot track и запускается только при наличии измеримого blocker.

Performance больше не трактуется как поздняя косметическая добавка. Ранние performance guardrails должны включаться уже во время baseline и Freiburg-работы, чтобы проблемы карты, 3D и тяжёлых UI-поверхностей не успели стать скрытым blocker к моменту формальной Phase 3.

## Roadmap на 6-8 недель

### Фаза 1. Стабилизация baseline

Срок: 3-7 дней

### Цель

Привести репозиторий к консистентному состоянию, где:

- content-gates соответствуют текущему snapshot и release baseline;
- документация не противоречит source-of-truth файлам;
- поддерживаемый scope проекта описан явно и без следов старого контура;
- ветка ясно разделяет code changes и content release changes.

### Задачи

- Синхронизировать `content/vn/map-metrics.snapshot.json`, если текущий рост map bindings и condition-driven logic является намеренным.
- Проверить, что `content/vn/pilot.snapshot.json`, `content/vn/releases.manifest.json` и `docs/CONTENT_RELEASE_RUNBOOK.md` описывают один и тот же текущий baseline.
- Синхронизировать `README.md`, `ARCHITECTURE.md`, `docs/ACCEPTANCE_MATRIX.md` и release docs с фактическим supported scope.
- Явно отделить repo-backed материалы от Obsidian- или bridge-доков, которые описывают внешний или старый контур.
- Оформить новый content release baseline после синхронизации snapshot и manifest.

### Команды контроля

```bash
bun run content:manifest:check
bun run content:extract
bun run content:obsidian:coverage:check
bun run content:map:metrics:check
bun run content:drift:verify
bun run quality:release
```

### Критерий готовности фазы

- Все content-gates зелёные.
- Документация не расходится с текущим snapshot/release baseline.
- Supported flow scope описан одинаково в source-of-truth файлах и в human-readable docs.
- Состояние ветки не смешивает незавершённый content drift с независимыми кодовыми задачами.

### Риск, если пропустить фазу

Если пропустить этот шаг, следующая работа пойдёт поверх шумного baseline. Это даст ложные красные сигналы в CI, усложнит release discipline и размоет доверие к content quality gates.

## Параллельный security/governance track

Этот трек идёт рядом с Фазами 1-2. Он должен стартовать сразу, но не должен подменять собой основную gameplay-очерёдность.

### S1. SpacetimeDB decision matrix и visibility migration rules

Срок: 3-5 дней

#### Цель

Превратить visibility audit в decision-driven migration plan, а не в бесконечную классификацию.

#### Матрица решений

Каждая публичная таблица должна попасть ровно в один класс:

- `public-by-design`
- `player-scoped`
- `operational-private`

Правила по умолчанию:

- `public-by-design` можно оставить публичной только с явным обоснованием, почему она должна оставаться клиентски читаемой по дизайну.
- `player-scoped` нельзя переводить в private, пока для текущих client/smoke consumers не существует replacement read path.
- `operational-private` не должны оставаться клиентски читаемыми после первой волны hardening.

#### Задачи

- Инвентаризировать таблицы в `spacetimedb/src/schema.ts`.
- Классифицировать все публичные таблицы по decision matrix.
- Для каждой затрагиваемой таблицы зафиксировать target read model:
  - raw public table остаётся как есть;
  - player-scoped view/read model;
  - private operational table без клиентского доступа.
- Сформировать первую волну migration work только для тех таблиц, где target read model уже понятен.

#### Критерий готовности

- Нет ни одной `public: true` таблицы без класса в decision matrix.
- Для каждой таблицы из первой волны hardening есть target read model.
- Нет ни одной таблицы в состоянии "сначала закроем, потом разберёмся, кто читает".

### S2. Staged reducer hardening и compatibility barrier

Срок: 3-7 дней

#### Цель

Закрыть явные privileged gaps без big-bang перевода всех raw tables в private.

#### Этапы

##### Шаг 1. Закрыть явные privileged gaps в reducer surface

- `publish_content`
- `rollback_content`
- lifecycle worker identity

##### Шаг 2. Инвентаризировать blast radius

Нужно перечислить и проверить текущих потребителей:

- клиентские `useTable(...)` поверхности;
- smoke subscriptions и smoke helpers;
- generated bindings и зависящие от них consumer layers;
- local operator scripts и локальный dev-flow.

##### Шаг 3. Ввести replacement read paths

- Ввести новые read paths только для тех player-scoped данных, которые реально читаются клиентом или smoke suite.
- Перевести потребителей на replacement read paths до любых schema visibility flips.

##### Шаг 4. Менять visibility raw tables и регенерировать bindings

- visibility у raw tables меняется только после прохождения compatibility barrier;
- bindings regeneration делается уже после того, как все затронутые consumers готовы к новому read path.

#### Жёсткое правило совместимости

Ни одна таблица не переводится в private, пока для всех текущих player-facing и smoke consumers нет рабочего replacement read path.

#### Как не попасть в compatibility deadlock

- reducer hardening не должен ждать полного фронтенд-рефактора, если явный privileged gap можно закрыть раньше;
- если монолитный consumer блокирует migration path, сначала вводится промежуточный adapter, read hook или более узкий read model, а не откладывается весь governance-трек;
- если конкретный `useTable(...)`-consumer вроде `CharacterPanel.tsx` или другая крупная поверхность реально держит миграцию, это считается основанием запустить hotspot track именно для этого blocker, а не поводом держать raw tables публичными без срока.

#### Критерий готовности

- Privileged reducers перечислены и имеют явную auth model.
- Replacement read paths существуют для всех затронутых consumers первой волны.
- Visibility flips не планируются без предварительного compatibility pass.

### S3. Полный CI supply-chain hardening

Срок: 2-4 дня

#### Цель

Довести CI governance до минимально достаточной инженерной дисциплины по всему workflow surface, а не только по `uses:`.

#### Задачи

- Перевести `100%` workflow `uses:` на pin по полному SHA.
- Проверить и сузить permissions там, где это возможно.
- Рассматривать installer `run:` steps так же строго, как `uses:`.
- Отдельно пересмотреть SpacetimeDB install path через `curl | sh` в `ci.yml`.
- Если немедленный отказ от remote installer path слишком дорог, зафиксировать переходный вариант: pinned bootstrap script с checksum/signature verification или отдельный CI image/toolchain layer с фиксированной версией SpacetimeDB CLI.
- Добавить `dependabot.yml` для npm и GitHub Actions как часть полного workflow review, а не как единственный результат.

#### Критерий готовности

- `100%` workflow `uses:` pinned на полный SHA.
- Все remote installer steps либо явно verified, либо заменены, либо удалены.
- Dependabot включён для npm и GitHub Actions.

### S4. Provenance и SBOM

Срок: после S3

#### Цель

Рассматривать provenance только после закрытия базовых CI-рисков.

#### Задачи

- Выбрать формат SBOM только после завершения S3.
- Проверить, поддерживает ли текущий GitHub plan нужные attestations.
- Если нет, явно зафиксировать fallback или отложить тему без раздувания scope.

#### Критерий готовности

- SBOM/attestation либо внедряются осознанно, либо явно откладываются.

## Ближайшая PR-очередь внутри governance track

Эта очередь не меняет основную продуктовую траекторию `baseline -> Freiburg -> Karlsruhe`, а задаёт порядок ближайших code-facing PR внутри текущего governance-цикла.

### PR0. Auth hardening landing

Цель: приземлить уже собранный auth-пакет как отдельный чистый PR, не смешивая его с нерелевантным content/docs drift.

Состав:

- выделить в отдельный PR admin bootstrap/grant flow, worker allowlist, guards на privileged reducers, operator token flow, нужные smoke-обновления и regenerated bindings;
- исключить из PR нерелевантные изменения рабочего дерева, не относящиеся к auth/governance hardening;
- не смешивать этот PR с visibility migration или CI hardening.

Критерий готовности:

- не-admin caller не может `publish_content` и `rollback_content`;
- non-allowlisted worker не может зарегистрироваться и доставить thought;
- локальный operator flow и существующие Freiburg smokes остаются зелёными;
- PR не тащит за собой нерелевантный content baseline drift.

### PR1. S1 decision matrix + blast radius

Цель: закрыть подготовительную часть `S1` как repo-backed inventory PR без schema visibility flips.

Состав:

- проинвентаризировать текущие `39` governed relations в visibility inventory и разнести их по классам `public-by-design`, `player-scoped`, `operational-private`;
- для каждой таблицы зафиксировать текущих потребителей: player UI, smoke, operator/debug, internal/runtime;
- для всех `player-scoped` и `operational-private` таблиц определить target read model или replacement query path;
- собрать ordered migration queue так, чтобы первая волна отдельно выделяла low-blast-radius surface: worker/AI/telemetry/idempotency.

Критерий готовности:

- `0` unclassified public tables;
- для каждой таблицы вне `public-by-design` есть consumer map и replacement plan;
- migration queue явно отделяет первую волну от тяжёлых player-facing surfaces;
- PR не содержит visibility changes.

### PR2. S3 CI supply-chain hardening

Цель: закрыть `S3` как отдельный infrastructure PR, не привязанный к schema migration.

Состав:

- перевести `100%` workflow `uses:` на full SHA;
- ввести минимальные workflow permissions: read-only по умолчанию и write только там, где он реально нужен для release automation;
- проверить installer `run:` steps так же строго, как `uses:`, с отдельным решением по SpacetimeDB install path через `curl | sh`;
- добавить `dependabot.yml` для npm и GitHub Actions только после завершения полного workflow review.

Критерий готовности:

- все workflow `uses:` pinned на полный SHA;
- workflow permissions минимальны и валидны;
- remote installer steps либо verified, либо заменены на воспроизводимый вариант;
- Dependabot видит npm и GitHub Actions.

### PR3. Первая visibility migration tranche

Цель: начать первую реальную migration волну без broad frontend rewrite.

Состав:

- начать с `operational-private` таблиц с минимальным blast radius: worker/AI/telemetry/idempotency surface;
- не трогать в первом срезе тяжёлые player-facing поверхности: map state, `CharacterPanel`, VN/Home content reads, mind/quest state;
- вводить узкие replacement read paths, adapters или hooks только там, где у первой волны уже есть реальный consumer;
- если миграцию блокирует конкретный монолитный consumer, заводить узкий hotspot follow-up только под этот blocker.

Критерий готовности:

- migrated tranche больше не требует raw public access;
- replacement read paths держат UI/smoke без регрессий;
- bindings регенерируются только в том PR, где реально меняется reducer/schema surface;
- базовые smoke flows и supported Freiburg flows остаются зелёными.

## Фаза 2. Углубление Freiburg как core gameplay loop

Срок: 2-3 недели

### Цель

Сделать Freiburg не просто поддерживаемым slice, а действительно связным игровым контуром, где решения игрока меняют:

- доступ к локациям;
- социальные отношения;
- favours и услуги;
- карьерный прогресс;
- слухи и их верификацию;
- ветвление на карте и во VN;
- Mind Palace closure.

### Почему это всё ещё главный продуктовый приоритет

Freiburg уже имеет поддерживаемый runtime slice, acceptance matrix и smoke coverage. Значит следующая инвестиция сюда усиливает работающую систему, а не создаёт новый параллельный долг.

### Основные направления работ

#### 1. Углубить уже поддерживаемые social flows

Нужно усиливать не "наличие social flows", а их глубину и последствия.

Фокус:

- `freiburg_social_access`
- `freiburg_rumor_verification`
- `freiburg_agency_career_progression`
- `freiburg_service_unlock`

Что должно усилиться:

- реальные gate-условия на карте и во VN;
- реальная стоимость решений и социальные последствия;
- системные unlocks, а не только UI-сигналы;
- более жёсткая привязка progression к favor, rumor, standing и career state.

#### 2. Расширить map loop вокруг существующих supported flows

- добавить больше condition-driven bindings;
- увеличить число meaningful shadow routes;
- связать rumors, service unlocks и social state с map progression;
- сделать часть перемещений решением с последствиями, а не только travel.

#### 3. Расширять acceptance depth, а не имитировать coverage

Новые или расширенные Freiburg flows можно добавлять только тогда, когда у них есть:

- точный entry path;
- smoke command;
- явные content-gates;
- понятный ownership в runtime.

Нельзя обратно скатываться к описанию "будущих social flows" там, где flows уже поддерживаются и должны теперь углубляться.

#### 4. Укрепить связку VN -> Map -> Mind Palace

- VN-сцены должны открывать новые маршрутные и социальные возможности;
- Map-решения должны приносить факты, слухи и unlocks;
- Mind Palace должен подтверждать стратегические выводы;
- подтверждённые выводы должны влиять на сюжетный и социальный доступ.

Это не побочная polish-задача. Если связка VN, карты и Mind Palace начинает давать проверяемые последствия в supported Freiburg loop, проект получает главный кандидат на сильный detective/exploration core, который удерживает игрока не новизной локаций, а глубиной расследовательской петли.

#### 5. Ранние performance guardrails

- следить за bundle и interaction pressure карты, 3D и VN уже во время Freiburg-итерации, а не ждать отдельной performance-фазы;
- если `MapView.tsx` начинает мешать code splitting, lazy loading или безопасным изменениям supported map flow, этого достаточно для запуска hotspot track;
- performance-проблемы на supported player-facing поверхностях считаются продуктовым риском, а не только техническим долгом.

### Критерий готовности фазы

- Все четыре уже поддерживаемых Freiburg social flows остаются зелёными.
- Каждый из этих четырёх flows получает хотя бы одно новое authoritative consequence, gate или downstream unlock, покрытое smoke/acceptance.
- Freiburg проходится как связная петля, а не как набор демонстраций.

## Post-Freiburg UX/product discovery backlog

Этот backlog не перепрыгивает текущие repo-validated приоритеты. Он включается только после стабилизации baseline, закрытия минимального governance-baseline и закрепления Freiburg как сильного supported loop.

### D1. Voice progression / Parliament of Voices

- Рассматривать “голоса” как отдельный domain track, а не как расплывчатую narrative-идею.
- Если трек запускается, его нужно оформлять как first-class per-player state с детерминированными правилами, тестируемыми порогами и smoke-reproducible последствиями.
- До появления repo-backed implementation plan этот трек не должен размывать Freiburg roadmap.

### D2. UX-safe data shaping

- Если governance migration уводит данные из raw public tables, UX-track должен проверить, что новые read models не ухудшают:
  - onboarding;
  - читаемость текущего прогресса;
  - скорость реакции карты/VN;
  - наблюдаемость поддерживаемых user flows.
- В этом контексте допустимы `public minimal snapshot`, ограниченные views и более узкие subscription targets, но только как поддержка supported experience, а не как новая самостоятельная архитектурная программа.

### D3. Hardlink / anti-spoofing / civic loop

- Это остаётся отдельной более поздней productization-темой.
- Трек не должен стартовать до тех пор, пока Freiburg и governance baseline не перестанут быть движущими рисками проекта.
- Если такой трек начнётся, он должен иметь отдельный acceptance surface, а не встраиваться скрыто в текущие Freiburg smoke flows.

## Evidence-gated hotspot track

Этот трек больше не считается обязательной фазой по умолчанию. Он запускается только тогда, когда конкретный hotspot реально блокирует governance/product work или повторно создаёт cross-stack churn.

### Текущие подтверждённые hotspots

В репозитории уже есть как минимум пять файлов выше `1000 LOC`:

- `scripts/ai-worker-watch.ts` — около `1000+` строк
- `scripts/extract-vn-content.ts` — около `3800` строк
- `src/features/character/CharacterPanel.tsx` — около `1500` строк
- `src/features/vn/vnContent.ts` — около `1500` строк
- `src/features/map/ui/MapView.tsx` — около `1100` строк

Это достаточно, чтобы считать hotspot cleanup justified, но недостаточно, чтобы делать из него такую же обязательную фазу, как baseline stabilization или governance hardening.

### Когда track запускается

- hotspot блокирует первую волну governance migration;
- hotspot системно тормозит Freiburg depth;
- одно и то же изменение снова требует слишком широкого cross-stack churn;
- существующая тестовая поверхность слишком жирная для безопасного изменения.

### Наиболее вероятные ранние триггеры

- `spacetimedb/src/reducers/helpers/player_progression.ts` или соседние helper-модули могут стать ранним кандидатом, если `S2` упрётся в авторизационные изменения и reducer hardening без узких точек входа;
- `src/features/map/ui/MapView.tsx` остаётся ранним кандидатом, если performance guardrails покажут, что code splitting, lazy loading или изменение map flow невозможно делать без непропорционального риска;
- крупные player-facing consumers вроде `src/features/character/CharacterPanel.tsx` могут стать триггером, если именно они создают compatibility deadlock для replacement read paths.

### Первая tranche

Если hotspot track запускается, первый tranche ограничивается только текущими oversized hotspots. Нельзя открывать "широкую архитектурную программу" без зафиксированного blocker.

### Критерий готовности

- конкретный blocking hotspot разбит на более узкие responsibilities;
- affected module/tests становятся уже и адреснее;
- refactor подтверждается снижением cross-stack blast radius, а не только ощущением, что код стал чище.

## Фаза 3. Performance и продуктовая сборка

Срок: 3-5 дней

### Цель

Снизить техническое трение пользовательской сборки и подготовить проект к более тяжёлому контенту.

Эта фаза нужна как consolidation step, а не как первый момент, когда команда вообще начинает думать о performance. Ранние guardrails и локальные разгрузки должны стартовать раньше, если supported surfaces уже начинают тормозить Freiburg-итерацию.

### Текущие сигналы

Production build уже является обязательной частью baseline quality gates. При этом bundle pressure будет расти, потому что проект уже использует:

- `mapbox-gl`
- `three`
- `@react-three/fiber`
- тяжёлый UI/runtime слой поверх карты, VN и debug-поверхностей

### Задачи

- Улучшить code splitting для карты и 3D-компонентов.
- Проверить, что debug/pilot режимы не тянут в production лишние зависимости раньше времени.
- Рассмотреть manual chunking для крупных модулей.
- Минимизировать дублируемый parsing snapshot в нескольких местах.

### Критерий готовности фазы

- Production bundle остаётся управляемым.
- Тяжёлые подсистемы грузятся только по требованию.
- Main app shell не деградирует при росте контента.

## Фаза 4. Karlsruhe enablement

Срок: после Фазы 2 и после закрытия blocking governance gaps

### Цель

Включить Karlsruhe как полноценный поддерживаемый runtime slice, а не как декоративно присутствующий авторский материал.

### Почему не раньше

Karlsruhe уже присутствует в authoring-слое, но всё ещё не входит в supported flow set. Если начать Karlsruhe раньше стабилизации Freiburg и до закрытия минимального governance-baseline:

- проект раздвоит фокус;
- acceptance matrix потеряет компактность и надёжность;
- техдолг вырастет быстрее, чем полезный gameplay.

Если Фаза 1 и Фаза 2 завершатся успешно, Karlsruhe должен становиться не новым тяжёлым переписыванием проекта, а следующим content/runtime slice поверх уже укреплённой платформенной дисциплины: snapshot-backed content, acceptance flow, smoke и governance guardrails.

### Что нужно сделать перед запуском Karlsruhe

- определить минимальный поддерживаемый Karlsruhe slice;
- подключить его через snapshot-backed runtime, а не через временные заглушки;
- сделать отдельный acceptance flow;
- добавить smoke script;
- провести тот же уровень content validation, что уже действует для Freiburg;
- повторно проверить входной flow из HomePage;
- убедиться, что blocking governance gaps больше не держат migration surface проекта в подвешенном состоянии.

### Критерий готовности фазы

- Karlsruhe можно реально открыть и пройти в supported path.
- Flow не помечен как "not available yet".
- На него есть smoke, acceptance entry path и content gates.

## Изменения публичных интерфейсов и контрактов

Этот roadmap не фиксирует немедленного изменения публичных API или типов.

Но он явно признаёт, что governance changes почти наверняка затронут:

- generated bindings;
- subscription targets;
- client read paths;
- smoke и local operator flows.

Контракт на уровне поведения такой:

- raw player-scoped tables не закрываются до появления replacement read path;
- privileged reducers получают explicit auth behavior до любых больших schema flips;
- smoke и local operator flows считаются частью совместимости, а не "вне плана";
- schema/read-model changes внедряются инкрементально, а не одним big-bang переводом публичных таблиц в private;
- generated bindings регенерируются только в тех PR, где реально меняется reducer/schema surface.

## Контуры проверки и acceptance

### Reducer auth scenarios

- не-admin caller не может `publish_content` и `rollback_content`;
- non-allowlisted worker не может зарегистрироваться или доставить thought;
- разрешённые admin/worker paths продолжают работать.

### Compatibility scenarios

- player-facing surfaces, читающие текущие player/content tables, продолжают работать после migration read path;
- Freiburg social smokes и existing supported flows остаются зелёными;
- bindings regeneration проходит после schema/read-model changes.

### CI hardening scenarios

- локальный эквивалент quality pipeline остаётся зелёным;
- обновлённый installer path для SpacetimeDB CLI воспроизводим и не опирается на непроверенный remote step.

### Hotspot scenarios

- refactor запускается только для зафиксированного blocker;
- после refactor affected module/tests становятся уже, а не просто перемещаются по файлам.

## Рекомендуемый порядок приоритетов

### Основная продуктовая траектория

#### P0

- стабилизировать content baseline;
- синхронизировать docs с текущим snapshot/release состоянием;
- оформить новый понятный content release baseline.

#### P1

- углубить уже поддерживаемый Freiburg social loop;
- расширить gameplay depth существующих supported flows;
- усилить rumor/favor/career/service integration на карте и во VN.

#### P2

- улучшить bundle structure и performance hygiene, начиная с ранних guardrails на уже поддерживаемых поверхностях;
- готовить Karlsruhe только после Freiburg depth и закрытия минимального governance-baseline.

#### P3

- включить Karlsruhe как следующий runtime slice;
- расширять supported flow set только после smoke coverage.

### Параллельный security/governance priority

#### S1

- завершить decision matrix для всех публичных таблиц;
- зафиксировать target read model для первой волны hardening.

#### S2

- закрыть privileged reducer gaps через staged migration;
- пройти compatibility barrier до любых visibility flips.

#### S3

- перевести `100%` workflow `uses:` на full SHA;
- проверить installer `run:` steps так же строго, как `uses:`;
- добавить Dependabot для npm и GitHub Actions.

#### S4

- рассматривать SBOM и attestations только после S3 и только в рамках подтверждённого GitHub plan.

### Условный UX/product discovery priority

#### D1

- поднимать voice progression / Parliament of Voices только после Freiburg core и governance minimums;
- оформлять этот трек как отдельный domain discovery с deterministic rules и testability, а не как “общую narrative-доработку”.

#### D2

- поднимать hardlink anti-spoofing и civic loop только как отдельный post-Freiburg productization track;
- не смешивать его с текущим supported flow set, пока для него нет собственного acceptance surface.

### Условный hotspot priority

#### H1

- запускать hotspot cleanup только при наличии зафиксированного blocker;
- ограничивать первый tranche текущими oversized hotspots.

## Что не стоит делать сейчас

- Не стоит переписывать весь roadmap вокруг deep research report.
- Не стоит вручную поддерживать второй acceptance matrix вне `scripts/acceptance-matrix.ts`.
- Не стоит описывать Freiburg social flows как "будущие", если они уже входят в supported scope.
- Не стоит считать, что `pin actions + Dependabot` закрывают весь CI supply-chain conversation, если installer paths не проверены.
- Не стоит переводить raw player-scoped tables в private до появления replacement read path.
- Не стоит держать security hardening заложником полного UI-рефактора, если staged migration, adapters и промежуточные read paths позволяют двигаться инкрементально.
- Не стоит запускать большую архитектурную программу без зафиксированного blocker.
- Не стоит считать performance поздней косметической задачей, если карта, 3D или тяжёлые player-facing surfaces уже замедляют Freiburg-итерацию.
- Не стоит одновременно масштабировать Freiburg, Karlsruhe и новые глобальные системы.
- Не стоит вкладываться в provenance/SBOM раньше, чем закрыты базовые workflow и authorization gaps.

## Метрики прогресса

Для ближайшего цикла полезно отслеживать не только "сколько сделано", но и "насколько система стала надёжнее".

### Release hygiene

- `quality:release` зелёный.
- `content:drift:verify` зелёный.
- `content:map:metrics:check` зелёный.
- snapshot checksum совпадает с ожидаемым release state.

### Freiburg coverage

- все четыре уже поддерживаемых Freiburg social flows зелёные;
- каждый из этих flows получает как минимум одно новое authoritative consequence, gate или downstream unlock;
- число smoke scripts, проходящих без ручных действий, не снижается.

### UX discovery hygiene

- voice progression не попадает в активную реализацию без отдельного domain plan;
- governance migration не ухудшает текущие supported player flows;
- новые read models уменьшают лишний пользовательский шум и не создают спойлерный/избыточный payload там, где он не нужен.

### Governance hygiene

- `0` unclassified public tables;
- `100%` privileged reducers имеют явную auth model;
- `100%` workflow `uses:` pinned на SHA;
- `100%` remote installer steps либо verified, либо удалены;
- Dependabot фактически включён и покрывает npm + GitHub Actions;
- первая migrated tranche больше не требует raw public access и не ломает supported Freiburg flows.

### Performance guardrails

- поддерживаемые map/VN surfaces не деградируют до состояния, в котором они блокируют Freiburg-итерацию;
- ранние bundle/runtime сигналы фиксируются до formal Phase 3, а не после неё;
- если `MapView.tsx` или другая тяжёлая surface блокирует code splitting, lazy loading или безопасную доставку supported flow, она переводится в hotspot track вместо ожидания "позднего" perf-pass.

### Hotspot health

- число активных blockers, упирающихся в oversized hotspots;
- число hotspot-файлов, для которых выделен более узкий owner module;
- число изменений, которые больше не требуют cross-stack churn из-за конкретного hotspot.

### Продуктовая глубина

- сколько решений игрока реально влияет на доступные действия;
- сколько social systems участвует в map/VN gating;
- насколько Freiburg можно проходить разными путями, а не одним маршрутом.

## Рекомендуемый milestone plan

### Milestone A. Stable Baseline

Результат:

- репозиторий консистентен;
- docs, snapshot и release baseline синхронизированы;
- supported scope описан без противоречий.

### Milestone S. Security/Governance Baseline

Результат:

- decision matrix для публичных таблиц завершена;
- auth hardening landed отдельным чистым PR;
- privileged reducers получают staged hardening plan с compatibility barrier;
- workflows pinned и dependency automation подключён;
- installer paths прошли supply-chain review.
- первая operational-private tranche migrated без broad schema flip и без регрессии в supported flows;
- ранние blockers в крупных helper-модулях SpacetimeDB или consumer-поверхностях либо разгружены, либо явно заведены в hotspot track.

### Milestone B. Freiburg Social Core

Результат:

- social systems становятся частью основного gameplay;
- существующие supported social flows становятся глубже;
- Freiburg закрепляется как главный доказанный игровой контур.

### Milestone D. UX/Product Discovery Baseline (Conditional)

Результат:

- voice progression вынесен в отдельный domain discovery, если на него реально открыт product track;
- UX-safe read models описаны как поддержка governance migration, а не как размытая инициатива;
- hardlink/anti-spoofing остаётся отдельной поздней темой, пока не появится собственный acceptance surface.

### Milestone H. Hotspot Relief (Conditional)

Результат:

- конкретный blocking hotspot разгружен;
- affected test surface стала уже;
- refactor снизил реальный cross-stack blast radius.
- cleanup запущен из-за реального blocker, а не только из-за размера файла.

### Milestone C. Karlsruhe Runtime Slice

Результат:

- второй городской slice подключён как supported runtime;
- проект переходит от одного сильного vertical slice к двум поддерживаемым направлениям.

## Финальный вывод

Сейчас проекту не нужен резкий разворот. Ему нужен дисциплинированный рост на основе уже работающего Freiburg slice и уже существующей content/runtime дисциплины.

Правильный следующий порядок такой:

- сначала стабилизировать baseline;
- затем приземлить отдельный auth hardening PR;
- потом закрыть decision matrix и blast radius как отдельный governance PR;
- после этого провести CI supply-chain hardening;
- и только затем делать первую visibility migration tranche;
- затем углубить Freiburg;
- запускать hotspot cleanup только там, где есть зафиксированный blocker;
- и только после этого масштабировать supported мир дальше.

Это даёт максимальную отдачу без подмены реального состояния репозитория внешними предположениями.

## Player/Foundation Follow-Ups

- ~~Split `spacetimedb/src/reducers/helpers/all.ts`~~ — снят монолитный barrel; домены вынесены (`mind_*`, `auth`, `effects`, …); см. `docs/SPACETIMEDB_HELPERS.md`.
- Expand the first `ReducerContextLike` step into typed reducer helper groups, starting with player state helpers and visibility helpers.
- Replace remaining raw `Record<string, boolean | number>` feature reads with narrow selectors when a feature owns the keys.
- Promote `generate_character_reaction` from planned contract to runtime only after `player_character_state` and reveal-layer persistence land.
