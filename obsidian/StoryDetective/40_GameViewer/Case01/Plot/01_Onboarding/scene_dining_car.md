---
id: scene_dining_car
type: vn_scene
parent: scene_intro_journey
phase: onboarding
status: active
tags:
  - type/vn_scene
  - layer/vn
  - case/case01
  - phase/onboarding
---

# Dining Car — Eleonora, Lotte & Wine

## Structure

| Element      | Node                                              |
| ------------ | ------------------------------------------------- |
| Background 1 | [[scene_dining_car_bg]] (empty dining car)        |
| Background 2 | [[scene_dining_car_mother_bg]] (Eleonora & Lotte) |
| Background 3 | [[scene_dining_car_wine_bg]] (wine close-up)      |
| Background 4 | [[scene_dining_car_felix_bg]] (Felix in doorway)  |
| Beat 1       | `scene_case01_train_dining_car_intro`              |
| Beat 2       | `scene_case01_train_dining_car_mother`              |
| Beat 3       | `scene_case01_train_dining_car_marriage_joke`       |
| Branch       | Silent / Introduce / Ask Hotel                     |
| Beat 4       | `scene_case01_train_dining_car_wine_beat`           |
| Beat 5       | `scene_case01_train_dining_car_felix_interrupts`    |
| Beat 6       | `scene_case01_train_dining_car_eleonora_farewell`   |

## Narrative

Detective follows Felix to the dining car. Eleonora and Lotte are already seated at a corner table, wine and tea between them. The scene establishes:

1. **Eleonora's control** — how she manages space, attention, and social architecture
2. **Lotte's dual identity** — journalist tells (notebook, pen callus) visible to perceptive players
3. **Felix's fatigue** — the first signs of the apathy mechanic (being presented as an appendage)
4. **Player agency** — wine acceptance sets `flag_joked_with_mother`, Felix defense sets `flag_defended_felix`

## Passive Checks

| Check           | Voice      | DC | Reward                                     |
| --------------- | ---------- | -- | ------------------------------------------ |
| Empathy (intro) | attr_empathy | 10 | XP + insight into Eleonora/Lotte dynamic   |
| Perception (wine) | attr_perception | 8 | XP + ring mark detail on Eleonora          |
| Empathy (Felix) | attr_empathy | 11 | XP + Felix apathy early diagnostic         |

## Flags Set

- `met_mother_intro` — on farewell beat
- `met_felix_intro` — on farewell beat
- `met_redhead_intro` — on farewell beat (Lotte recognized)
- `flag_joked_with_mother` — if player accepts wine
- `flag_silent_observation` — if player stays silent at branch
- `flag_defended_felix` — if player sides with Felix on departure

## Characters

- [[30_World_Intel/Characters/char_mother_hartmann|Eleonora Hartmann]]
- [[30_World_Intel/Characters/char_lotte_weber|Lotte Weber]]
- [[30_World_Intel/Characters/char_partner|Felix Hartmann]]
- [[30_World_Intel/Characters/char_inspector|Detective]]

## → Next

[[scene_hbf_arrival]] (via ankommen video → voza cutscene → platform)
