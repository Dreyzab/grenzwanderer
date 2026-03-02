---
id: sys_mindpalace
tags:
  - type/system
  - domain/mind
  - status/developing
---

# Sys MindPalace

## Назначение

Управлять контуром пассивных проверок, визуализацией улик и дедуктивных связей, а также обратной связью по состоянию голосов в ходе VN-сцен.

## Границы ответственности

- Внутри системы:
  - показ overlay/board для пассивных проверок и связей улик;
  - фиксация результатов проверок и голосовых состояний;
  - визуальная дедукция/конклюзии в рамках текущего расследования.
- Вне системы:
  - world travel/economy;
  - server persistence world engine;
  - AI-thought generation (Parliament AI).

## Входы

- Evidence/entries/check-state из dossier runtime.
- Voice state и результаты passive checks.
- Сценический контекст VN (scene/check events).

## Выходы

- UI-слой Mind Palace (`overlay`, `board`, `conclusions`).
- Patch-ориентированные изменения состояния:
  - `set_passive_check_result`
  - `update_voice_state`
  - `add_evidence` (при открытии новых улик).

## Основной цикл

1. Получение текущего scene/check контекста.
2. Вычисление доступных пассивных проверок и их исходов.
3. Применение runtime patches в dossier store.
4. Обновление визуальных узлов, связей и итоговых конклюзий.
5. Передача последствий обратно в VN/runtime слой.

## Инварианты и safety

- Обновления Mind Palace проходят через patch-путь runtime (без full snapshot merge в hot path).
- Проверки должны оставаться детерминированными при одинаковом входном state.
- Падение отдельного UI-виджета не должно блокировать основной сценарный прогресс.

## Code anchors

- `apps/web/src/features/detective/mind-palace/MindPalaceOverlay.tsx`
- `apps/web/src/features/detective/mind-palace/MindPalaceBoard.tsx`
- `apps/web/src/features/detective/mind-palace/usePassiveChecks.ts`
- `apps/web/src/widgets/visual-novel/VisualNovelOverlay.tsx`
- `apps/web/src/features/detective/dossier/store.ts`

## Тесты/проверка

- `apps/web/src/features/detective/dossier/store.runtime-patch.test.ts`
- `apps/web/src/features/detective/runtime/orchestrator.test.ts`

## Связанные заметки

- [[99_System/Runtime_Orchestrator_v2|Runtime Orchestrator v2]]
- [[99_System/Engine_VN_Runtime|Engine VN Runtime]]
- [[99_System/Engine_Parliament_AI|Engine Parliament AI]]
- [[99_System/MOC_Engines|MOC Engines]]
