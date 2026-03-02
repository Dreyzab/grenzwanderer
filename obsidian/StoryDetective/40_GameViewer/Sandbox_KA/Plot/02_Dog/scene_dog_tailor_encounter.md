---
id: scene_dog_tailor_encounter
type: vn_scene
phase: sandbox_dog
tags:
  - type/encounter
  - location/tailor
---

# 🧵 False Lead: The Tailor

## 📋 Structure

| Element       | Node                       |
| ------------- | -------------------------- |
| 🎨 Background | [[scene_tailor_bg]]        |
| 📖 Beat 1     | [[scene_dog_tailor_beat1]] |

## 🎭 Encounter

You visit the **Schneider Workshop** (`loc_tailor`).
**Reveal**: The "scraps" were from the Mayor's fitting, not the dog.
**Interaction**: Meet **Herr Schneider** (`char_tailor`). He complains about the Mayor's waistline.
**Reward**: Unlocks **Disguise Crafting** service (future).
**Item**: Gives you a _Silk Ribbon_ (useless but fancy).

## ⚙️ State Delta

- `dog_lead_tailor_checked = true`

## → Next

[[scene_dog_leads]]
