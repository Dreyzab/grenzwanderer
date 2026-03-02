---
id: engine_interrogation_tension
tags:
  - type/system
  - domain/interaction
  - status/developing
aliases:
  - Interrogation Tension Engine
---

# Engine Interrogation Tension

## Назначение

Обеспечивать детерминированную механику напряжения допроса: расчет sweet spot, lockout и прогресса без побочных эффектов.

## Границы ответственности

- Внутри движка:
  - расчет эффективного sweet spot по профилю NPC;
  - учет уязвимого/резистентного голоса игрока;
  - проверка lockout threshold;
  - выдача режима видимости sweet spot.
- Вне движка:
  - переходы VN-сцен и выборов;
  - персист состояния;
  - генерация narrative текста.

## Входы

- `InterrogationProfile` (sweetSpot range, vulnerable/resistant voices).
- `playerVoices` и `playerPerception`.
- Текущее значение tension.

## Выходы

- `EffectiveSweetSpot { min, max }`.
- `boolean` для `isInSweetSpot(...)`.
- `boolean` для `shouldLockout(...)`.
- `number` для `computeProgressTick(...)`.
- `SweetSpotVisibility` (`hidden` / `partial` / `full`).

## Основной цикл

1. Получить профиль допроса и voice stats игрока.
2. Рассчитать effective sweet spot.
3. Сравнить текущий tension со spot.
4. Выдать progress tick и lockout сигнал.
5. Обновить HUD/бар и выполнить следующий шаг VN логики.

## Инварианты и safety

- Все расчеты - pure functions (без side effects).
- Tension всегда клампится в диапазон `0..100`.
- Если после модификаторов `min > max`, диапазон схлопывается в pivot, а не ломает механику.
- Default lockout threshold = `100`, при отсутствии override.

## Code anchors

- `apps/web/src/features/detective/interrogation/tensionEngine.ts`
- `apps/web/src/features/detective/interrogation/tensionStore.ts`
- `apps/web/src/features/detective/interrogation/ui/TensionHUD.tsx`
- `apps/web/src/features/detective/interrogation/ui/TensionBar.tsx`

## Тесты/проверка

- `apps/web/src/features/detective/interrogation/__tests__/tensionEngine.test.ts`

## Связанные заметки

- [[99_System/Engine_VN_Runtime|Engine VN Runtime]]
- [[20_Game_Design/03_Interaction/READ_ME|03 Interaction]]
- [[99_System/MOC_Engines|MOC Engines]]
