---
id: scene_dog_pub_encounter
type: vn_scene
phase: sandbox_dog
tags:
  - type/encounter
  - location/pub
---

# 🍺 False Lead: The Red Cog

## 📋 Structure

| Element       | Node                    |
| ------------- | ----------------------- |
| 🎨 Background | [[scene_pub_bg]]        |
| 📖 Beat 1     | [[scene_dog_pub_beat1]] |

## 🎭 Encounter

You enter **The Red Cog** (`loc_workers_pub`).
**Reveal**: The "Sandwich Thief" is a **Hungry Socialist** (`char_socialist`).
**Interaction**: Debate politics or buy him a meal.
**Reward**: **Worker Trust** (+Reputation with Lower Class).

## ⚙️ State Delta

- `dog_lead_pub_checked = true`

## → Next

[[scene_dog_leads]]
