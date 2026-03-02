---
id: scene_dog_leads
type: vn_scene
phase: sandbox_dog
tags:
  - type/hub
  - mechanic/investigation
---

# 🔍 Where is Bruno?

## 📋 Structure

| Element       | Node                         |
| ------------- | ---------------------------- |
| 🎨 Background | [[scene_map_city_bg]]        |
| 📖 Beat 1     | [[scene_dog_leads_dialogue]] |

## 🔀 Investigation Choices

### 🍎 The Market (Smell of fish?)

- _Condition_: `dog_lead_market_checked` IS FALSE
- _Link_: [[scene_dog_market_encounter]]

### 🚂 The Station (Crowds?)

- _Condition_: `dog_lead_station_checked` IS FALSE
- _Link_: [[scene_dog_station_encounter]]

### 🧵 The Tailor (Fabric scraps?)

- _Condition_: `dog_lead_tailor_checked` IS FALSE
- _Link_: [[scene_dog_tailor_encounter]]
- _Hint_: "Mayor's suit was torn recently."

### 🍺 The Workers' Pub (Sausage rumors?)

- _Condition_: `dog_lead_pub_checked` IS FALSE
- _Link_: [[scene_dog_pub_encounter]]
- _Hint_: "Workers complain about a sandwich thief."

### 🎓 The University (Student prank?)

- _Condition_: `dog_lead_uni_checked` IS FALSE
- _Link_: [[scene_dog_uni_encounter]]
- _Hint_: "Students love mascots."

### 🌳 The City Park (Trees and squirrels?)

- _Link_: [[scene_park_reunion]] (True Lead)

## 💡 Hints

- If `dog_lead_market_checked`: "It wasn't at the market (just a cat)."
- If `dog_lead_station_checked`: "Station is too loud for him."
- If `dog_lead_tailor_checked`: "Tailor hasn't seen him since the fitting."

## → Fallback

If most checked? -> [[scene_park_reunion]]
