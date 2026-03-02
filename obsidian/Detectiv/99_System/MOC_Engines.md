---
id: moc_engines
tags:
  - type/moc
  - domain/system
  - status/active
aliases:
  - Engines Catalog
  - Реестр движков
---

# MOC Engines

Единый runtime-актуальный каталог движков проекта. Включает только `active/developing` слой из кода и системных заметок.

## Кодовые движки

### 1) World Engine

- Статус: `active`
- Каноничная заметка: [[99_System/API_Engine_Contract|API Engine Contract]]
- Code anchors:
  - `apps/server/src/modules/engine.ts`
  - `apps/web/src/features/detective/engine/store.ts`
  - `packages/shared/lib/detective_engine_types.ts`
- Тесты/проверка:
  - `apps/server/test/modules/engine.test.ts`

### 2) Runtime Orchestrator v2

- Статус: `active`
- Каноничная заметка: [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- Code anchors:
  - `apps/web/src/features/detective/runtime/orchestrator.ts`
  - `apps/web/src/features/detective/runtime/webRuntimeOrchestrator.ts`
  - `packages/shared/lib/runtime.types.ts`
- Тесты/проверка:
  - `apps/web/src/features/detective/runtime/orchestrator.test.ts`
  - `apps/web/src/features/detective/dossier/store.runtime-patch.test.ts`

### 3) VN Runtime Engine

- Статус: `active`
- Карточка движка: [[99_System/Engine_VN_Runtime|Engine VN Runtime]]
- Code anchors:
  - `apps/web/src/entities/visual-novel/lib/runtime.ts`
  - `apps/web/src/entities/visual-novel/model/store.ts`
  - `apps/web/src/pages/VisualNovelPage/VisualNovelPage.tsx`

### 4) Quest Engine

- Статус: `developing`
- Карточка движка: [[99_System/Engine_Quest_Runtime|Engine Quest Runtime]]
- Code anchors:
  - `apps/web/src/features/quests/engine.ts`
  - `apps/web/src/features/quests/store.ts`
  - `apps/web/src/features/detective/lib/map-action-handler.ts`

### 5) Story Spine Engine

- Статус: `developing`
- Карточка движка: [[99_System/Engine_Story_Spine|Engine Story Spine]]
- Code anchors:
  - `packages/shared/lib/story-spine-engine.ts`
  - `apps/web/src/features/story-spine/store.ts`
  - `apps/web/src/features/story-spine/orchestrator.ts`

### 6) Map Resolver Engine

- Статус: `active`
- Карточка движка: [[99_System/Engine_Map_Resolver|Engine Map Resolver]]
- Code anchors:
  - `packages/shared/lib/map-resolver.ts`
  - `apps/web/src/widgets/map/map-view/MapView.tsx`
  - `apps/server/src/modules/map.ts`

### 7) Interrogation Tension Engine

- Статус: `developing`
- Карточка движка: [[99_System/Engine_Interrogation_Tension|Engine Interrogation Tension]]
- Code anchors:
  - `apps/web/src/features/detective/interrogation/tensionEngine.ts`
  - `apps/web/src/features/detective/interrogation/tensionStore.ts`
  - `apps/web/src/features/detective/interrogation/ui/TensionHUD.tsx`

### 8) Parliament AI Engine

- Статус: `active`
- Карточка движка: [[99_System/Engine_Parliament_AI|Engine Parliament AI]]
- Code anchors:
  - `apps/server/src/modules/parliament-ai.ts`
  - `apps/web/src/features/detective/lib/useParliamentThought.ts`
  - `packages/shared/lib/parliament-ai.types.ts`

### 9) Battle Engine (runtime + system)

- Статус: `developing`
- Каноничная заметка: [[20_Game_Design/Systems/Sys_Battle|Sys Battle]]
- Code anchors:
  - `packages/shared/data/battle.ts`
  - `apps/web/src/entities/battle/model/store.ts`
  - `apps/web/src/pages/BattlePage/BattlePage.tsx`

## Системные движки (20_Game_Design/Systems)

- [[20_Game_Design/Systems/Sys_Investigation|Sys Investigation]] - `developing`
- [[20_Game_Design/Systems/Sys_MindPalace|Sys MindPalace]] - `developing`
- [[20_Game_Design/Systems/Sys_FogOfWar|Sys FogOfWar]] - `developing`
- [[20_Game_Design/Systems/Inventory_Merchant|Inventory and Merchant]] - `active/developing`
- [[20_Game_Design/Systems/Sys_Battle|Sys Battle]] - `developing`

## Правило покрытия

- В каталоге должны присутствовать все движки из актуального runtime-контура.
- Legacy/архивные плановые заметки (`docs/PLAN*`) сюда не включаются.
- Для уже каноничных заметок (например, `API_Engine_Contract`, `Runtime_Orchestrator_v2`) создается ссылка, а не дубликат карточки.

## Связанные индексы

- [[99_System/READ_ME|System Hub]]
- [[99_System/Data_Index|Data Index]]
- [[20_Game_Design/MOC_Game_Design|Game Design Hub]]
