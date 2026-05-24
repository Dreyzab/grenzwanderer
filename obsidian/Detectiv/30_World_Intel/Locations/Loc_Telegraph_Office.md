---
id: world_loc_telephone
tags:
  - location
  - world
  - fribourg-1905
runtime_location_id: loc_telephone
---

# Telegraph Office

> **ID**: `loc_telephone`
> **District**: Altstadt Administrative Strip
> **Runtime Type**: `BUREAU`
> **Vibe**: _Urgent messages under institutional control_

## Atmosphere (Sensory)

- **Sight**: Switchboard racks, coded forms, waiting bench.
- **Sound**: Relay clicks and line buzz.
- **Smell**: Hot wire insulation, paper dust.
- **Light**: Task lamps over switchboard.
- **Mood**: Compressed urgency.

## Phase Variations

| Phase   | Description                                             | Available NPCs              | Restrictions                   |
| ------- | ------------------------------------------------------- | --------------------------- | ------------------------------ |
| morning | Official dispatch cycle and bureaucratic queue.         | operator, clerk, journalist | Hidden until interlude unlock. |
| day     | Public telegram traffic and interception opportunities. | operator, clerk, journalist | Hidden until interlude unlock. |
| evening | Priority lines remain; staff reduced.                   | operator, clerk, journalist | Hidden until interlude unlock. |
| night   | Emergency-only communications.                          | operator, clerk, journalist | Hidden until interlude unlock. |

## Historical Context (Freiburg 1905)

Telegraph nodes in 1905 compressed political and commercial response times, turning information routing into strategic power.

## POI Sync (case_01_points.ts)

- **locationId**: `loc_telephone`
- **Data source**: `apps/server/src/scripts/data/case_01_points.ts`
- **Bindings**: trigger_interlude_b

## Investigation Hooks

- Primary narrative node: [[10_Narrative/Scenes/node_case1_first_lead_selection|node_case1_first_lead_selection]]
- Related MOC: [[00_Map_Room/MOC_Locations|MOC_Locations]]

## ИВМР Pneumatic Sub-Spur (Backdrop Anchor)

> **Lore-only.** Не публиковать на карте, не индексировать как POI, не давать прямого пути нажатия. Доступ — только через сцены и проверки.

Один из трёх городских узлов пневматической почты имеет неофициальное ответвление, не отмеченное ни в кадастре города, ни в публичном плане сети связи. Технически — пара дополнительных чугунных труб 8,125 дюйма, уходящих под фундамент здания на северо-восток (в сторону холодного канала [[fct_chapter_of_mercy|Капитула Милосердия]]). Функционально — третий эшелон [[../Factions/bg_imperial_resonance|Императорского Ведомства Магического Резонанса]].

- **Operator:** [[../Characters/char_pneumatic_courier|Pneumatic Courier]], только ночная смена среды между 02:14 и 02:19.
- **Trace artefact:** [[../Items/clue_imvr_pneumatic_capsule|ИВМР Pneumatic Capsule]] (№ 4413-Ω).
- **Visibility gates:**
  - `Perception` DC 11 — заметить лишнюю пару труб в техническом коридоре.
  - `Occultism` DC 9 — почувствовать «холодный шов» вдоль стены (для Witch origin срабатывает пассивно через Spiritual Veil Sight).
  - Прямое указание от [[char_fortune_teller|Fortune Teller]] (только после поднятия её Stage 2).
- **Investigation pressure note:** проникновение в сабспур _вне_ ночной фазы среды ничего не даёт; капсулы перевозятся только в этом окне. Случайный шум в трубах в другие ночи — это городская сеть, а не Ведомство.

## Voice Reads at Switchboard

| Voice      | DC  | On Success                                                       |
| ---------- | --- | ---------------------------------------------------------------- |
| Logic      | 10  | «Три отдельных узла, две публичных схемы. Где третья?»           |
| Occultism  | 9   | «Один из щитков заземления — не для тока. Для эфира.»            |
| Perception | 11  | «Один из операторов не пишет в журнал смены. Никогда.»           |
