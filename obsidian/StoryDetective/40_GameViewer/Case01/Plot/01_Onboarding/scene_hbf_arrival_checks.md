---
id: scene_hbf_arrival_checks
parent: scene_hbf_arrival
type: vn_checks
tags:
  - type/vn_checks
  - case/case01
---

# 🔍 Passive Checks: HBF Arrival

## On Scene Enter

| Skill      | DC  | Trigger | Success                                 | Reward                 |
| ---------- | --- | ------- | --------------------------------------- | ---------------------- |
| Perception | 7   | Auto    | Замечаешь красную отметку на расписании | [[ev_marked_schedule]] |
| Intuition  | 8   | Auto    | Ощущение слежки — кто-то наблюдает      | `flag_paranoia_hint`   |

## During Beat 2

| Skill      | DC  | Trigger    | Success                        | Reward       |
| ---------- | --- | ---------- | ------------------------------ | ------------ |
| Perception | 6   | View crowd | Выделяешь Fritz в толпе раньше | Variant text |

## Check Failure Effects

| Check           | Failure Consequence                                 |
| --------------- | --------------------------------------------------- |
| Perception DC 7 | Не получаешь [[ev_marked_schedule]] — улика упущена |
| Intuition DC 8  | Нет намёка на паранойю — сюрприз позже              |
