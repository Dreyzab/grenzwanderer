---
id: scene_tavern
type: vn_scene
phase: sandbox_banker
status: active
tags:
  - type/vn_scene
  - layer/vn
  - case/sandbox_banker
  - phase/investigation
  - location/tavern
---

# Сцена: Таверна "Черный Пруссак"

## Trigger Source

- Вход из [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]].

## Preconditions

- `sandbox_banker = started`

## Designer View

- Визуал: дым, карты, пьяные споры и стол постоянных игроков.
- Цель: добыть слухи, которые можно подтвердить в казино.
- Тон: грубая правда улицы против аккуратной версии банкира.

## Structure

| Element        | Node                                                          |
| -------------- | ------------------------------------------------------------- | --------------------- |
| Background     | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_bg     | scene_tavern_bg]]     |
| Passive Checks | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_checks | scene_tavern_checks]] |
| Beat 1         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_beat1  | scene_tavern_beat1]]  |

## Choice Contract v1

| choice_id                | gating_check     | success_effect              | fail_effect                                        | next_node          |
| ------------------------ | ---------------- | --------------------------- | -------------------------------------------------- | ------------------ |
| `TAVERN_BRIBE_INFO`      | `money >= 10`    | `CLUE_B03_TAVERN_TESTIMONY` | Потеря денег без полного ответа                    | `scene_tavern_ch1` |
| `TAVERN_INTIMIDATE_INFO` | `authority >= 2` | `CLUE_B04_CROUPIER_LEDGER`  | Свидетель замолкает, но бармен дает fallback-улику | `scene_tavern_ch2` |

## Mechanics View

- Сцена выдает социальные улики о маршруте денег и связке Фридрих - `W`.
- Soft-fail recovery: даже при провале давления игрок получает минимальный ориентир на казино.

## State Delta

- `banker_lead_tavern_checked = true`

## Transitions

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_ch1|scene_tavern_ch1]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern_ch2|scene_tavern_ch2]]

## Validation

- После первого визита флаг `banker_lead_tavern_checked` должен стать `true`.
- Возврат в `scene_bank_leads` обязателен при любом результате.
