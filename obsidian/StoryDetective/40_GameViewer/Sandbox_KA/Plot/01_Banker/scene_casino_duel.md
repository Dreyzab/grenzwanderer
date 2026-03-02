---
id: scene_casino_duel
type: vn_scene
phase: sandbox_banker
status: active
tags:
  - type/vn_scene
  - layer/vn
  - case/sandbox_banker
  - phase/resolution
  - location/casino
---

# Сцена: Казино и очная ставка

## Trigger Source

- Вход из [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads|scene_bank_leads]].

## Preconditions

- `sandbox_banker = started`
- Рекомендуется хотя бы одна собранная улика (`CLUE_B01` или `CLUE_B03`), но вход не блокируется.

## Designer View

- Визуал: зал с картежным столом, напряжение перед публикой.
- Задача: через дуэль и разговор вывести Фридриха на правду и решить, как оформить финал.
- Тон: кульминация с moral-choice.

## Structure

| Element        | Node                                                               |
| -------------- | ------------------------------------------------------------------ | -------------------------- |
| Background     | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_bg     | scene_casino_duel_bg]]     |
| Passive Checks | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_checks | scene_casino_duel_checks]] |
| Beat 1         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_beat1  | scene_casino_duel_beat1]]  |
| Beat 2         | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_beat2  | scene_casino_duel_beat2]]  |

## Choice Contract v1

| choice_id               | gating_check                                                   | success_effect                              | fail_effect             | next_node               |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------- | ----------------------- | ----------------------- |
| `CASINO_EXPOSE_PUBLIC`  | `clue_CLUE_B06_LEDGER_MISMATCH = true`                         | Рост репутации и жесткая развязка           | Потеря доверия семьи    | `scene_casino_duel_ch1` |
| `CASINO_SETTLE_PRIVATE` | `clue_CLUE_B02_PAWN_RECEIPT OR clue_CLUE_B03_TAVERN_TESTIMONY` | Мягкая развязка и сохранение семейного лица | Меньше публичной выгоды | `scene_casino_duel_ch2` |

## Mechanics View

- Перед разговором применяется дуэльный модуль `sandbox_son_duel` как проверка давления.
- При нехватке улик финал остается достижимым (soft-fail), но выборы дают меньше контроля.

## State Delta

- `banker_case_stage = 'finale'`

## Transitions

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_beat1|scene_casino_duel_beat1]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel_beat2|scene_casino_duel_beat2]]

## Validation

- Кейс не должен иметь hard fail, блокирующий выход на карту.
- Любой исход обязан вести в [[40_GameViewer/Sandbox_KA/03_Map_Return/scene_banker_exit_to_map|scene_banker_exit_to_map]].
