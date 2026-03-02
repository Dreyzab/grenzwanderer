---
id: scene_bank_intro
type: vn_scene
phase: sandbox_banker
status: active
tags:
  - type/vn_scene
  - layer/vn
  - case/sandbox_banker
  - phase/investigation
  - location/bank
---

# Сцена: Разговор с банкиром

## Trigger Source

- Вход из [[40_GameViewer/Sandbox_KA/02_Quest_Entries/scene_banker_entry|scene_banker_entry]].

## Preconditions

- `sandbox_banker` в статусе `started`.

## Designer View

- Визуал: кабинет с закрытым сейфом, ведомости на столе.
- Тон: банкир просит деликатности, но нервничает сильнее, чем должен невиновный отец.
- Опорные ноты:
  - сын исчезает по ночам;
  - из сейфа пропадают деньги;
  - полиция недопустима из-за репутации.

## Structure

| Element        | Node                                                              |
| -------------- | ----------------------------------------------------------------- | ------------------------- |
| Background     | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_bg     | scene_bank_intro_bg]]     |
| Passive Checks | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_checks | scene_bank_intro_checks]] |
| Beat 1         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_beat1  | scene_bank_intro_beat1]]  |
| Beat 2         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_beat2  | scene_bank_intro_beat2]]  |

## Choice Contract v1

| choice_id                 | gating_check                   | success_effect                   | fail_effect                            | next_node              |
| ------------------------- | ------------------------------ | -------------------------------- | -------------------------------------- | ---------------------- |
| `BANK_INTRO_ACCEPT`       | none                           | Запускает ветку расследования    | none                                   | `scene_bank_intro_ch1` |
| `BANK_INTRO_PRESS_MOTIVE` | `logic >= 2` or `empathy >= 2` | Получает `CLUE_B05_WAX_ON_GLOVE` | Получает подозрение без доказательства | `scene_bank_intro_ch2` |

## Mechanics View

- Сцена выдает первые подозрения и открывает хаб следов.
- Пассивная проверка логики может выдать `CLUE_B06_LEDGER_MISMATCH` до выхода из кабинета.

## State Delta

- `banker_case_stage = 'intro_done'`

## Transitions

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_ch1|scene_bank_intro_ch1]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_intro_ch2|scene_bank_intro_ch2]]

## Validation

- Игрок всегда должен иметь маршрут в `scene_bank_leads` даже без успешных проверок.
- До финала должен быть хотя бы один намек, что банкир скрывает часть правды.
