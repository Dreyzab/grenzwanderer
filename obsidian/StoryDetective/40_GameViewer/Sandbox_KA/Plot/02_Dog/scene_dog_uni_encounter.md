---
id: scene_dog_uni_encounter
type: vn_scene
phase: sandbox_dog
tags:
  - type/encounter
  - location/university
---

# 🎓 False Lead: The University

## 📋 Structure

| Element       | Node                    |
| ------------- | ----------------------- |
| 🎨 Background | [[scene_uni_bg]]        |
| 📖 Beat 1     | [[scene_dog_uni_beat1]] |

## 🎭 Encounter

You investigate **Institute of Hygiene** (`loc_uni_med`).
**Reveal**: The "Mascot" is a **Skeleton** dressed in a hat.
**Interaction**: Meet the **Coroner/Assistant** (`char_coroner`). He needs help with a "fresh" cadaver.
**Reward**: **Medical Knowledge** (+Logic).

## ⚙️ State Delta

- `dog_lead_uni_checked = true`

## → Next

[[scene_dog_leads]]
