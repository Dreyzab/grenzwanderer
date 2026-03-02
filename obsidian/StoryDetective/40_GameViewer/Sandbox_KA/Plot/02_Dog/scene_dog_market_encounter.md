---
id: scene_dog_market_encounter
type: vn_scene
phase: sandbox_dog
tags:
  - type/encounter
  - location/market
---

# 🐟 False Lead: The Market

## 📋 Structure

| Element       | Node                       |
| ------------- | -------------------------- |
| 🎨 Background | [[scene_market_bg]]        |
| 📖 Beat 1     | [[scene_dog_market_beat1]] |

## 🎭 Encounter

You follow a trail of destruction to a fish stall.
**Reveal**: It's not Bruno. It's a giant **Stray Cat**.
**Interaction**: Meet the **Fishmonger**. He laughs and gives you a _Rotten Fish_ (Item).
**Unlock**: Fishmonger Service (Trade).

## ⚙️ State Delta

- `dog_lead_market_checked = true`

## → Next

[[scene_dog_leads]] (Return to investigation)
