---
id: detectiv_root_readme
aliases:
  - Detectiv README
tags:
  - type/readme
  - status/active
---

# Detectiv README

## Назначение

Корневой вход в vault `obsidian/Detectiv` с runtime-актуальным маршрутом для Case 01 и ссылками на рабочие доски.

## Runtime-актуальный старт Case 01

1. Телеграмма и создание персонажа.
2. `detective_case1_hbf_arrival` (вокзал, Фритц, выбор приоритета).
3. Выход на карту с двумя активными целями: банк и ратуша.
4. Ветка игрока:
   - `priority_bank_first`: сначала банк, затем ратуша.
   - `priority_mayor_first`: сначала ратуша, затем банк.
5. После первого визита в обе стартовые точки продолжается расследование Case 01.

## Актуальные правила появления Клары

- Клара появляется в обоих местах, но с разным первым контекстом.
- Если первым выбран банк: первое личное знакомство происходит в банке; в ратуше позже идёт follow-up.
- Если первой выбрана ратуша: Клару представляет мэр; в банке дальше уже рабочая связка без повторного first-intro.

## Где поддерживать синхронизацию

- Общая доска: [[00_Map_Room/Gameplay_Story_Board|Gameplay_Story_Board]]
- Протокол: [[99_System/Narrative_Gameplay_Protocol|Narrative_Gameplay_Protocol]]
- Чеклист: [[99_System/Narrative_Gameplay_Checklist|Narrative_Gameplay_Checklist]]
- Пейсинг: [[99_System/Narrative_Pacing_Rules|Narrative_Pacing_Rules]]
- Карта runtime: `apps/server/src/scripts/data/case_01_points.ts`

## Что считать рудиментами

- Жесткий линейный маршрут `HBF -> Alt Briefing` без выбора приоритета.
- Упоминания, что карта-эксплорация всегда стартует после alt briefing.
- Формулировки, где Клара имеет только одну точку первого появления.
