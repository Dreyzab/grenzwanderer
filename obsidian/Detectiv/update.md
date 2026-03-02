---
id: detectiv_update_2026_02_opening
aliases:
  - Detectiv Update
  - Case 01 Opening Update
tags:
  - type/update
  - status/active
---

# Update: Game Opening Restructure

## Дата

2026-02-08

## Изменено

- Стартовый флоу перестроен в формат: `телеграмма -> HBF (Фритц) -> выбор приоритета -> карта`.
- Добавлена развилка приоритета:
  - `priority_bank_first`
  - `priority_mayor_first`
- На карте одновременно доступны `loc_freiburg_bank` и `loc_rathaus`, но с разным приоритетом целей.
- Добавлен ратушный follow-up сценарий для синхронизации веток после первого контакта с Кларой.
- Поведение Клары нормализовано:
  - первое знакомство в банке, если игрок пошел в банк первым;
  - представление у мэра, если игрок пошел в ратушу первым;
  - в обоих местах Клара присутствует с разным диалоговым контекстом.

## Удалены рудименты

- Убрана модель, где после `detective_case1_hbf_arrival` всегда принудительно открывался `detective_case1_alt_briefing`.
- Убраны трактовки, что `map_first_exploration` является универсальным обязательным шагом для любого маршрута.
- Убрано допущение, что Клара имеет единственный сценарий первого появления.

## Текущие опорные флаги

- Маршрут: `priority_bank_first`, `priority_mayor_first`, `hbf_priority_selected`
- Встречи: `clara_introduced`, `clara_met_at_bank`, `clara_met_at_mayor`, `met_mayor_first`
- Follow-up контроль: `mayor_followup_completed`

## Source of Truth

- Runtime map bindings: `apps/server/src/scripts/data/case_01_points.ts`
- Scenario logic:
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/00_onboarding/case1_hbf_arrival.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_alt_briefing.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/01_briefing/case1_mayor_followup.logic.ts`
  - `apps/web/src/entities/visual-novel/scenarios/detective/case_01_bank/main/02_bank/case1_bank.logic.ts`
