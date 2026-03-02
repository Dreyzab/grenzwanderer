---
id: scene_son_house
type: vn_scene
phase: sandbox_banker
status: active
tags:
  - type/vn_scene
  - layer/vn
  - case/sandbox_banker
  - phase/investigation
  - location/son_house
---

# Сцена: Дом Фридриха

## Trigger Source

- Вход из [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]].

## Preconditions

- `sandbox_banker = started`

## Designer View

- Визуал: комната с хаотично разбросанными вещами, следами поспешного сбора.
- Цель: понять, Фридрих просто транжира или влез в чужую игру.
- Тон: бытовая правда против версии клиента.

## Structure

| Element        | Node                                                             |
| -------------- | ---------------------------------------------------------------- | ------------------------ |
| Background     | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house_bg     | scene_son_house_bg]]     |
| Passive Checks | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house_checks | scene_son_house_checks]] |
| Beat 1         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house_beat1  | scene_son_house_beat1]]  |

## Choice Contract v1

| choice_id            | gating_check | success_effect          | fail_effect                               | next_node             |
| -------------------- | ------------ | ----------------------- | ----------------------------------------- | --------------------- |
| `SON_HOUSE_DESK`     | none         | `CLUE_B01_DEBT_NOTE`    | Находится только часть записки            | `scene_son_house_ch1` |
| `SON_HOUSE_WARDROBE` | none         | `CLUE_B02_PAWN_RECEIPT` | Находится только одна квитанция без суммы | `scene_son_house_ch2` |

## Mechanics View

- Сцена дает "личный" слой улик: долг и попытки Фридриха закрыть его.
- Обе выборки ведут обратно в хаб следов.

## State Delta

- `banker_lead_house_checked = true`

## Transitions

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house_ch1|scene_son_house_ch1]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house_ch2|scene_son_house_ch2]]

## Validation

- После первого посещения дома флаг `banker_lead_house_checked` должен стать `true`.
- Возврат в `scene_bank_leads` доступен при любом исходе осмотра.
