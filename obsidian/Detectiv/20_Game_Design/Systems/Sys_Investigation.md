---
id: sys_investigation
tags:
  - type/system
  - domain/investigation
  - status/developing
---

# Sys Investigation

## Назначение

Управлять расследовательным контуром: доступностью действий на карте, прохождением следов, обновлением состояний точек и связью с квестовым прогрессом.

## Границы ответственности

- Внутри системы:
  - резолв доступных interactions по context;
  - применение map actions и переходов расследования;
  - согласование point-state progression с правилами retention/scope.
- Вне системы:
  - AI-thought генерация;
  - внутренняя VN-сценическая оркестрация;
  - battle/economy контур.

## Входы

- Map bindings и trigger-события (`marker_click`, `arrive` и др.).
- `flags`, `inventory`, `pointStates`, `questStages`.
- Runtime route/event codes из map/backend слоя.

## Выходы

- Список доступных действий в интеракции точки.
- Выбранные действия (`start_vn`, `unlock`, `set_flag`, и др.) в runtime pipeline.
- Обновленные состояния точек и progression-флаги.

## Основной цикл

1. Загрузка map points и user point states.
2. Резолв interactions через map-resolver.
3. Выбор действия игроком и исполнение через map action handler.
4. Upsert point state с monotonic policy (без деградации состояния).
5. Обновление квест/сцена контекста и повторная оценка доступных веток.

## Инварианты и safety

- Состояние точки не должно деградировать (`completed` не откатывается в `discovered`).
- Невалидные actions/bindings не приводят к silent-corruption: они отклоняются или пропускаются с warning.
- Критический путь расследования не должен иметь hard-fail без recovery route.

## Code anchors

- `apps/server/src/modules/map.ts`
- `packages/shared/lib/map-resolver.ts`
- `apps/web/src/widgets/map/map-view/MapView.tsx`
- `apps/web/src/features/detective/lib/map-action-handler.ts`

## Тесты/проверка

- `apps/server/test/modules/map.test.ts`
- `packages/shared/lib/map-resolver.test.ts`
- `apps/web/src/features/detective/lib/map-action-handler.test.tsx`

## Связанные заметки

- [[99_System/Engine_Map_Resolver|Engine Map Resolver]]
- [[20_Game_Design/Systems/Sys_FogOfWar|Sys FogOfWar]]
- [[99_System/Narrative_Gameplay_Protocol|Narrative Gameplay Protocol]]
- [[99_System/MOC_Engines|MOC Engines]]
