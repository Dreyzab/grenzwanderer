---
id: scene_dog_station_encounter
type: vn_scene
phase: sandbox_dog
tags:
  - type/encounter
  - location/station
---

# 🚂 False Lead: The Station

## 📋 Structure

| Element       | Node                        |
| ------------- | --------------------------- |
| 🎨 Background | [[scene_station_bg]]        |
| 📖 Beat 1     | [[scene_dog_station_beat1]] |

## 🎭 Encounter

You hear barking near the tracks.
**Reveal**: It's a **Wolf** (or fierce guard dog) chained up.
**Interaction**: Meet the **Beggar King**. He mocks your detective skills but shares a rumor.
**Unlock**: Beggar Network (Rumors).

## ⚙️ State Delta

- `dog_lead_station_checked = true`

## → Next

[[scene_dog_leads]] (Return to investigation)
