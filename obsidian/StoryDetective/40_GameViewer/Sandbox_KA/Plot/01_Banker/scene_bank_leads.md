---
id: scene_bank_leads
type: vn_scene
phase: sandbox_banker
tags:
  - type/hub
  - mechanic/investigation
  - case/sandbox_banker
---

# Сцена-хаб: Следы по делу Вагнера

## Trigger Source

- Вход из `scene_bank_intro_ch1` или `scene_bank_intro_ch2`.
- Повторный вход из `scene_son_house` и `scene_tavern`.

## Preconditions

- `sandbox_banker = started`

## Designer View

- Формат: городская карта следов.
- Цель: собрать достаточно фактов для уверенной конфронтации в казино.
- Материалы дизайна:
  - [[40_GameViewer/Sandbox_KA/Plot/01_Banker/banker_story_spine|banker_story_spine]]
  - [[40_GameViewer/Sandbox_KA/Plot/01_Banker/banker_clue_matrix|banker_clue_matrix]]

## Structure

| Element    | Node                                                                |
| ---------- | ------------------------------------------------------------------- | --------------------------- |
| Background | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads_bg       | scene_bank_leads_bg]]       |
| Beat       | [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_bank_leads_dialogue | scene_bank_leads_dialogue]] |

## Choice Contract v1

| choice_id          | gating_check                                              | success_effect                           | fail_effect                          | next_node           |
| ------------------ | --------------------------------------------------------- | ---------------------------------------- | ------------------------------------ | ------------------- |
| `BANK_LEAD_HOUSE`  | `banker_lead_house_checked = false`                       | Получение бытовых улик `CLUE_B01/B02`    | none                                 | `scene_son_house`   |
| `BANK_LEAD_TAVERN` | `banker_lead_tavern_checked = false`                      | Получение социальных улик `CLUE_B03/B04` | none                                 | `scene_tavern`      |
| `BANK_LEAD_CASINO` | `banker_lead_house_checked OR banker_lead_tavern_checked` | Запуск развязки                          | Если без улик - сложная конфронтация | `scene_casino_duel` |

## Mechanics View

- Это центральный узел темпа расследования.
- Игроку разрешено идти в казино после хотя бы одной ветки.
- Soft-fail recovery: даже при неполной доказательной базе финал достижим, но с меньшим контролем над исходом.

## State Delta

- `banker_case_stage = 'lead_hub'`

## Transitions

- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_son_house|scene_son_house]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_tavern|scene_tavern]]
- [[40_GameViewer/Sandbox_KA/Plot/01_Banker/scene_casino_duel|scene_casino_duel]]

## Validation

- Перед входом в казино игроку должен быть явно показан текущий набор найденных зацепок.
- Хаб не должен блокироваться после одной посещенной ветки.
