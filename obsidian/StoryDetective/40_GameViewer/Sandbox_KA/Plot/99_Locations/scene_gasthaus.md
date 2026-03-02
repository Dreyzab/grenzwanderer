---
id: scene_gasthaus
type: vn_scene
phase: sandbox_ka_extras
status: active
tags:
  - type/vn_scene
  - layer/vn
  - location/inn
---

# 🍺 Gasthaus "Zum Goldenen Adler"

## 📋 Structure

| Element           | Node                      |
| ----------------- | ------------------------- |
| 🎨 Background     | [[scene_gasthaus_bg]]     |
| 🔍 Passive Checks | [[scene_gasthaus_checks]] |
| 📖 Beat 1         | [[scene_gasthaus_beat1]]  |

## 👥 Characters

- [[char_innkeeper|Wirtin Helga]]
- [[char_drunkard|Local Worker]]

## 🔀 Choices

1. [[scene_gasthaus_ch1]] → Order a Beer (Cost: 1 Mark)
2. [[scene_gasthaus_ch2]] → Listen to Gossip (Passive: Empathy)

## → Exit

[[map_ka_gasthaus]]
