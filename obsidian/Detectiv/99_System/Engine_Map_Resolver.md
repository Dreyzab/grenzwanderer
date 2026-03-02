---
id: engine_map_resolver
tags:
  - type/system
  - domain/map
  - status/active
aliases:
  - Map Resolver Engine
---

# Engine Map Resolver

## Назначение

Резолвить доступные действия точки карты на основе условий контекста и приоритетов binding-правил.

## Границы ответственности

- Внутри движка:
  - вычисление условий (`flag`, `item`, `point_state`, `quest_stage`, logical ops);
  - формирование списка доступных interactions по trigger;
  - приоритизация действий и выбор auto-interaction.
- Вне движка:
  - сетевые вызовы и persistence состояния точек;
  - отрисовка map UI;
  - выполнение action side-effects.

## Входы

- `MapPointBinding[]` или JSON-строка bindings.
- `TriggerType` (например, `marker_click`, `arrive`).
- `ResolutionContext`:
  - `flags`
  - `inventory`
  - `pointStates`
  - `questStages`

## Выходы

- `ResolverOption[]`:
  - `binding`
  - `enabled`
  - optional `disabledReason`
- `MapPointBinding | null` для auto-trigger сценария.

## Основной цикл

1. Нормализация источника bindings (array/string).
2. Фильтрация по `trigger`.
3. Проверка conditions для каждого binding.
4. Сортировка по `priority` (desc).
5. Возврат полного списка либо best available interaction.

## Инварианты и safety

- Отсутствующее состояние точки трактуется как `locked`.
- Невалидный JSON bindings не роняет runtime: возвращается пустой набор.
- Unknown condition type логируется warning и не считается true.
- Логические операторы `and/or/not/logic_not` поддерживаются в одном резолвере.

## Code anchors

- `packages/shared/lib/map-resolver.ts`
- `packages/shared/lib/map-resolver.test.ts`
- `apps/web/src/widgets/map/map-view/MapView.tsx`
- `apps/server/src/modules/map.ts`

## Тесты/проверка

- `packages/shared/lib/map-resolver.test.ts`
- `apps/server/test/modules/map.test.ts`

## Связанные заметки

- [[20_Game_Design/Systems/Sys_Investigation|Sys Investigation]]
- [[20_Game_Design/Systems/Sys_FogOfWar|Sys FogOfWar]]
- [[99_System/Engine_Quest_Runtime|Engine Quest Runtime]]
- [[99_System/MOC_Engines|MOC Engines]]
